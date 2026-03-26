import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { emailIngestionsQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = emailIngestionsQuerySchema.safeParse(
    Object.fromEntries(searchParams)
  );

  if (!query.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }

  const { status, search, page, pageSize } = query.data;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { fromAddress: { contains: search, mode: "insensitive" } },
    ];
  }

  const [ingestions, total] = await Promise.all([
    prisma.emailIngestion.findMany({
      where,
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
      orderBy: { processedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.emailIngestion.count({ where }),
  ]);

  return NextResponse.json({
    ingestions,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
