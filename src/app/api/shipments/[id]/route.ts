import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      subShipments: true,
      inspectionReports: { orderBy: { createdAt: "desc" } },
      sampleReports: { orderBy: { createdAt: "desc" } },
      blockadeReports: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { timestamp: "desc" } },
      emailIngestions: {
        select: {
          id: true,
          subject: true,
          fromAddress: true,
          receivedAt: true,
          attachmentCount: true,
        },
        orderBy: { processedAt: "asc" },
      },
    },
  });

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  return NextResponse.json(shipment);
}
