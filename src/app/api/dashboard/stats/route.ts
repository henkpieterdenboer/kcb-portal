import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SHIPMENT_STATUSES } from "@/types";

export async function GET() {
  const [counts, recentShipments] = await Promise.all([
    Promise.all(
      SHIPMENT_STATUSES.map(async (status) => ({
        status,
        count: await prisma.shipment.count({ where: { status } }),
      }))
    ),
    prisma.shipment.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        subShipments: true,
        _count: {
          select: {
            inspectionReports: true,
            sampleReports: true,
            blockadeReports: true,
          },
        },
      },
    }),
  ]);

  const totals: Record<string, number> = { total: 0 };
  for (const { status, count } of counts) {
    totals[status] = count;
    totals.total += count;
  }

  return NextResponse.json({ totals, recentShipments });
}
