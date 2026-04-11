import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { awbLookupParamSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { STATUS_LABELS, type ShipmentStatus } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ awb: string }> }
) {
  // 1. Auth check
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Rate limit (by API key)
  const { ok, remaining } = rateLimit(apiKey);
  if (!ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // 3. Validate AWB param
  const { awb } = await params;
  const parsed = awbLookupParamSchema.safeParse({ awb: decodeURIComponent(awb) });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid AWB parameter" },
      { status: 400 }
    );
  }

  const awbValue = parsed.data.awb;

  // 4. Lookup
  const shipments = await prisma.shipment.findMany({
    where: {
      awb: { equals: awbValue, mode: "insensitive" },
    },
    select: {
      id: true,
      aangiftenummer: true,
      status: true,
      exporteur: true,
      landVanOorsprong: true,
      updatedAt: true,
    },
  });

  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  const response = {
    awb: awbValue,
    exists: shipments.length > 0,
    count: shipments.length,
    shipments: shipments.map((s) => ({
      aangiftenummer: s.aangiftenummer,
      status: s.status,
      statusLabel: STATUS_LABELS[s.status as ShipmentStatus] ?? s.status,
      exporteur: s.exporteur,
      landVanOorsprong: s.landVanOorsprong,
      updatedAt: s.updatedAt.toISOString(),
      url: `${appUrl}/shipments/${s.id}`,
    })),
  };

  return NextResponse.json(response, {
    headers: { "X-RateLimit-Remaining": String(remaining) },
  });
}
