import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { processEmailAttachments } from "@/lib/ingest/process-attachments";
import { parseEmailBody } from "@/lib/parser";

/**
 * Temporary admin endpoint: wipe all derived data and reprocess every
 * EmailIngestion in chronological order so status history is rebuilt
 * cleanly with the current parsing logic.
 *
 * DELETE THIS ENDPOINT after use.
 */

export const maxDuration = 300; // 5 min timeout for bulk processing

export async function POST(request: NextRequest) {
  // Allow auth via session (browser) or API key (CLI)
  const apiKey = request.headers.get("X-API-Key");
  if (apiKey && apiKey === process.env.INGEST_API_KEY) {
    // OK — authenticated via API key
  } else {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Phase 1: Clear all derived state
  const deletedHistory = await prisma.statusHistory.deleteMany({});
  await prisma.shipment.updateMany({ data: { status: "AANGEMELD" } });
  // Clear implicit many-to-many junction table
  await prisma.$executeRawUnsafe(`DELETE FROM "_EmailIngestionToShipment"`);

  // Phase 2: Get all email ingestions ordered chronologically
  const emails = await prisma.emailIngestion.findMany({
    orderBy: [{ receivedAt: "asc" }, { processedAt: "asc" }],
  });

  const log: { id: string; subject: string | null; success: boolean; shipments: string[]; error?: string }[] = [];

  for (const email of emails) {
    try {
      // Reset ingestion status
      await prisma.emailIngestion.update({
        where: { id: email.id },
        data: { status: "PROCESSING", errors: null },
      });

      const payload = email.rawPayload as {
        attachments?: { name: string; contentType?: string; contentBytes?: string }[];
      } | null;
      const attachments = payload?.attachments || [];

      const { results, errors } = await processEmailAttachments(email.id, attachments);

      // Parse email body only when no PDFs were successfully processed
      const hasPdfResults = results.some((r) => r.success);
      if (!hasPdfResults) {
        let bodyResult = null;
        if (email.emailBodyHtml) {
          try {
            bodyResult = await parseEmailBody(email.emailBodyHtml, email.id);
          } catch {
            // ignore
          }
        }
        if (!bodyResult && email.emailBody) {
          try {
            bodyResult = await parseEmailBody(email.emailBody, email.id);
          } catch {
            // ignore
          }
        }
        if (bodyResult) results.push(bodyResult);
      }

      const shipments = results
        .filter((r) => r.success && r.aangiftenummer)
        .map((r) => r.aangiftenummer!);

      log.push({
        id: email.id,
        subject: email.subject,
        success: results.some((r) => r.success),
        shipments: [...new Set(shipments)],
        error: errors.length > 0 ? errors.join("; ") : undefined,
      });
    } catch (err) {
      log.push({
        id: email.id,
        subject: email.subject,
        success: false,
        shipments: [],
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    deletedHistoryEntries: deletedHistory.count,
    totalEmails: emails.length,
    processed: log.filter((l) => l.success).length,
    failed: log.filter((l) => !l.success).length,
    log,
  });
}
