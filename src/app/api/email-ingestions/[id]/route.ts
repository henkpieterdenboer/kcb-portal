import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
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
    include: {
      shipments: {
        select: {
          id: true,
          aangiftenummer: true,
          awb: true,
          status: true,
        },
      },
    },
  });

  if (!ingestion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Extract attachment metadata from rawPayload (without base64 content)
  const attachments: { name: string; contentType?: string; index: number }[] = [];
  if (ingestion.rawPayload && typeof ingestion.rawPayload === "object") {
    const payload = ingestion.rawPayload as { attachments?: { name: string; contentType?: string }[] };
    if (Array.isArray(payload.attachments)) {
      payload.attachments.forEach((att, index) => {
        attachments.push({
          name: att.name,
          contentType: att.contentType,
          index,
        });
      });
    }
  }

  return NextResponse.json({
    ...ingestion,
    rawPayload: undefined,
    attachments,
  });
}
