import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      subShipments: true,
      inspectionReports: { orderBy: { createdAt: "desc" } },
      sampleReports: { orderBy: { createdAt: "desc" } },
      blockadeReports: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { timestamp: "asc" } },
    },
  });

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  return NextResponse.json(shipment);
}
