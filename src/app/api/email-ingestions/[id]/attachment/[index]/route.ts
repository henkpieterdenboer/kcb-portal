import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, index: indexStr } = await params;
  const index = parseInt(indexStr, 10);

  if (isNaN(index) || index < 0) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  const ingestion = await prisma.emailIngestion.findUnique({
    where: { id },
    select: { rawPayload: true },
  });

  if (!ingestion?.rawPayload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = ingestion.rawPayload as {
    attachments?: { name: string; contentType?: string; contentBytes: string }[];
  };

  const attachment = payload.attachments?.[index];
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  const buffer = Buffer.from(attachment.contentBytes, "base64");
  const contentType = attachment.contentType || "application/octet-stream";
  const fileName = attachment.name || `attachment-${index}`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
