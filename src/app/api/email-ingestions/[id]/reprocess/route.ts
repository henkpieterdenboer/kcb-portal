import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { processEmailAttachments } from "@/lib/ingest/process-attachments";
import { parseEmailBody } from "@/lib/parser";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const ingestion = await prisma.emailIngestion.findUnique({
    where: { id },
  });

  if (!ingestion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!ingestion.rawPayload || typeof ingestion.rawPayload !== "object") {
    return NextResponse.json(
      { error: "No raw payload stored for this email" },
      { status: 422 }
    );
  }

  const payload = ingestion.rawPayload as { attachments?: { name: string; contentType?: string; contentBytes?: string }[] };
  const attachments = payload.attachments || [];

  // Reset status
  await prisma.emailIngestion.update({
    where: { id },
    data: { status: "PROCESSING", errors: null },
  });

  const { results, errors } = await processEmailAttachments(id, attachments);

  // Also parse email body for structured fields (same as initial ingestion)
  // Try plain text first, fall back to HTML body
  {
    let bodyResult = null;
    if (ingestion.emailBody) {
      try {
        bodyResult = await parseEmailBody(ingestion.emailBody, id);
      } catch (err) {
        console.error("Failed to parse email body on reprocess:", err);
      }
    }
    if (!bodyResult && ingestion.emailBodyHtml) {
      try {
        bodyResult = await parseEmailBody(ingestion.emailBodyHtml, id);
      } catch (err) {
        console.error("Failed to parse email body HTML on reprocess:", err);
      }
    }
    if (bodyResult) results.push(bodyResult);
  }

  const shipments = results
    .filter((r) => r.success && r.aangiftenummer)
    .map((r) => r.aangiftenummer!);

  return NextResponse.json({
    processed: results.filter((r) => r.success).length,
    total: attachments.filter((a) => a.name.toLowerCase().endsWith(".pdf")).length,
    shipments: [...new Set(shipments)],
    errors,
  });
}
