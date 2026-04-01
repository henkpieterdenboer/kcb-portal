import { NextRequest, NextResponse } from "next/server";
import { emailIngestionSchema } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { processEmailAttachments } from "@/lib/ingest/process-attachments";
import { parseEmailBody } from "@/lib/parser";

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

  // Parse email body only when no PDFs were successfully processed (planning emails).
  // Mededeling emails have PDFs and their body contains English labels that cause bad parses.
  // Try HTML body first — KCB plain text bodies are often truncated.
  const hasPdfResults = results.some((r) => r.success);
  if (!hasPdfResults) {
    let bodyResult = null;
    if (emailBodyHtml) {
      try {
        bodyResult = await parseEmailBody(emailBodyHtml, emailIngestion.id);
      } catch (err) {
        console.error("Failed to parse email body HTML:", err);
      }
    }
    if (!bodyResult && emailBody) {
      try {
        bodyResult = await parseEmailBody(emailBody, emailIngestion.id);
      } catch (err) {
        console.error("Failed to parse email body:", err);
      }
    }
    if (bodyResult) results.push(bodyResult);
  }

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
