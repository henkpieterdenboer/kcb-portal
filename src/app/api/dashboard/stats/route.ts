import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SHIPMENT_STATUSES, ACTIVE_STATUSES, TERMINAL_STATUSES } from "@/types";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  // Target date for "today" queries
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    counts,
    recentShipments,
    todayArrivals,
    todayInspections,
    todayStatusChanges,
  ] = await Promise.all([
    // All status counts
    Promise.all(
      SHIPMENT_STATUSES.map(async (status) => ({
        status,
        count: await prisma.shipment.count({ where: { status } }),
      }))
    ),

    // Recent active shipments only
    prisma.shipment.findMany({
      where: { status: { in: ACTIVE_STATUSES as string[] } },
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

    // Today's arrivals: shipments with verwachteAankomst on target date
    prisma.shipment.findMany({
      where: {
        verwachteAankomst: { gte: startOfDay, lte: endOfDay },
      },
      include: { subShipments: true },
      orderBy: { verwachteAankomst: "asc" },
    }),

    // Today's inspections: shipments with inspectiedatum on target date
    prisma.shipment.findMany({
      where: {
        inspectiedatum: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        subShipments: true,
        inspectionReports: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { inspectiedatum: "asc" },
    }),

    // Today's status changes count
    prisma.statusHistory.count({
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
    }),
  ]);

  // All totals
  const totals: Record<string, number> = { total: 0 };
  for (const { status, count } of counts) {
    totals[status] = count;
    totals.total += count;
  }

  // Active-only totals
  const activeTotals: Record<string, number> = { total: 0 };
  for (const { status, count } of counts) {
    if ((ACTIVE_STATUSES as string[]).includes(status)) {
      activeTotals[status] = count;
      activeTotals.total += count;
    }
  }

  return NextResponse.json({
    totals,
    activeTotals,
    recentShipments,
    todayArrivals,
    todayInspections,
    todayStatusChanges,
  });
}
