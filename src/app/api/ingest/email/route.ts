import { NextRequest, NextResponse } from "next/server";
import { emailIngestionSchema } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { processEmailAttachments } from "@/lib/ingest/process-attachments";

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

  const { subject, from, receivedDateTime, body: emailBody, bodyHtml: emailBodyHtml, attachments } = parsed.data;

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
      emailBody: emailBody || null,
      emailBodyHtml: emailBodyHtml || null,
      rawPayload: body as object,
    },
  });

  const { results, errors } = await processEmailAttachments(
    emailIngestion.id,
    attachments
  );

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
