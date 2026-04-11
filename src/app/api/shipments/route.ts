import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { shipmentsQuerySchema } from "@/lib/validations";
import { TERMINAL_STATUSES, ACTIVE_STATUSES } from "@/types";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = shipmentsQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!query.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { status, dateFrom, dateTo, search, archived, sortBy, sortOrder, page, pageSize } = query.data;

  const where: Record<string, unknown> = {};

  // Archive filter
  if (archived === "true") {
    where.status = { in: TERMINAL_STATUSES as string[] };
  } else if (archived === "false") {
    where.status = { in: ACTIVE_STATUSES as string[] };
  }
  // archived === "all" -> no status filter

  // Explicit status filter overrides archive filter
  if (status) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as Record<string, Date>).lte = new Date(dateTo);
  }

  if (search) {
    where.OR = [
      { aangiftenummer: { contains: search, mode: "insensitive" } },
      { awb: { contains: search, mode: "insensitive" } },
      { exporteur: { contains: search, mode: "insensitive" } },
      { referentie: { contains: search, mode: "insensitive" } },
    ];
  }

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: {
        subShipments: true,
        statusHistory: {
          orderBy: { timestamp: "desc" },
          take: 1,
          select: { timestamp: true },
        },
        _count: {
          select: {
            inspectionReports: true,
            sampleReports: true,
            blockadeReports: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.shipment.count({ where }),
  ]);

  // Map lastStatusAt from latest status history entry
  const mapped = shipments.map(({ statusHistory, ...s }) => ({
    ...s,
    lastStatusAt: statusHistory[0]?.timestamp ?? s.updatedAt,
  }));

  return NextResponse.json({
    shipments: mapped,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
