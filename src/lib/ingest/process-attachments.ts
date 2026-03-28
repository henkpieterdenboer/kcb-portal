import { prisma } from "@/lib/db";
import { parsePdfBuffer, ParseResult } from "@/lib/parser";

export interface AttachmentInput {
  name: string;
  contentType?: string;
  contentBytes?: string;
}

export async function processEmailAttachments(
  emailIngestionId: string,
  attachments: AttachmentInput[]
): Promise<{ results: ParseResult[]; errors: string[] }> {
  const pdfAttachments = attachments.filter(
    (a) => a.name.toLowerCase().endsWith(".pdf")
  );
  const parsableAttachments = pdfAttachments.filter((a) => a.contentBytes);

  const results: ParseResult[] = [];
  const errors: string[] = [];

  if (pdfAttachments.length > 0 && parsableAttachments.length === 0) {
    errors.push(
      "PDF attachments found but none have contentBytes - use 'Get Attachment' action in Power Automate to include file content"
    );
  }

  for (const attachment of parsableAttachments) {
    try {
      const buffer = Buffer.from(attachment.contentBytes!, "base64");
      const result = await parsePdfBuffer(buffer, emailIngestionId);
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
    where: { id: emailIngestionId },
    data: {
      status: errors.length > 0 ? "PARTIAL_ERROR" : "PROCESSED",
      errors: errors.length > 0 ? errors.join("; ") : null,
    },
  });

  return { results, errors };
}
