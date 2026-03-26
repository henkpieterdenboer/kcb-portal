import { NextRequest, NextResponse } from "next/server";
import { emailIngestionSchema } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { parsePdfBuffer, ParseResult } from "@/lib/parser";

export async function POST(request: NextRequest) {
  // Verify API key
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey || apiKey !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = emailIngestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { subject, from, receivedDateTime, attachments } = parsed.data;

  // Create email ingestion record
  const pdfAttachments = attachments.filter(
    (a) => a.name.toLowerCase().endsWith(".pdf")
  );

  const emailIngestion = await prisma.emailIngestion.create({
    data: {
      subject,
      fromAddress: from,
      receivedAt: receivedDateTime ? new Date(receivedDateTime) : null,
      attachmentCount: pdfAttachments.length,
      status: "PROCESSING",
    },
  });

  const results: ParseResult[] = [];
  const errors: string[] = [];

  for (const attachment of pdfAttachments) {
    try {
      const buffer = Buffer.from(attachment.contentBytes, "base64");
      const result = await parsePdfBuffer(buffer, emailIngestion.id);
      results.push(result);
      if (!result.success && result.error) {
        errors.push(`${attachment.name}: ${result.error}`);
      }
    } catch (err) {
      const errorMsg = `${attachment.name}: ${err instanceof Error ? err.message : "Unknown error"}`;
      errors.push(errorMsg);
      results.push({ type: "ERROR", success: false, error: errorMsg });
    }
  }

  // Update email ingestion status
  await prisma.emailIngestion.update({
    where: { id: emailIngestion.id },
    data: {
      status: errors.length > 0 ? "PARTIAL_ERROR" : "PROCESSED",
      errors: errors.length > 0 ? errors.join("; ") : null,
    },
  });

  const shipments = results
    .filter((r) => r.success && r.aangiftenummer)
    .map((r) => r.aangiftenummer!);

  return NextResponse.json({
    processed: results.filter((r) => r.success).length,
    total: pdfAttachments.length,
    shipments: [...new Set(shipments)],
    errors,
  });
}
