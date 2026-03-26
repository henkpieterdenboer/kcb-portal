"use client";

import { useEffect, useState } from "react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { StatusPipeline } from "@/components/dashboard/status-pipeline";
import { RecentShipments } from "@/components/dashboard/recent-shipments";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  totals: Record<string, number>;
  recentShipments: Array<{
    id: string;
    aangiftenummer: string;
    exporteur: string | null;
    awb: string | null;
    landVanOorsprong: string | null;
    status: string;
    updatedAt: string;
    subShipments: { botanischeNaam: string }[];
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px]" />
          ))}
        </div>
        <Skeleton className="h-[80px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <KpiCards totals={data.totals} />
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-4 font-semibold">Status Pipeline</h3>
        <StatusPipeline totals={data.totals} />
      </div>
      <RecentShipments shipments={data.recentShipments} />
    </div>
  );
}
