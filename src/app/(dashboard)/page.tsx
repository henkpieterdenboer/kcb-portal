"use client";

import { useEffect, useState, useCallback } from "react";
import { useDateContext } from "@/lib/date-context";
import { useTranslation } from "@/lib/i18n/context";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { StatusPipeline } from "@/components/dashboard/status-pipeline";
import { TodayInspections } from "@/components/dashboard/today-inspections";
import { TodayArrivals } from "@/components/dashboard/today-arrivals";
import { RecentShipments } from "@/components/dashboard/recent-shipments";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardData {
  totals: Record<string, number>;
  activeTotals: Record<string, number>;
  recentShipments: Array<{
    id: string;
    aangiftenummer: string;
    exporteur: string | null;
    awb: string | null;
    landVanOorsprong: string | null;
    status: string;
    lastStatusAt: string;
    subShipments: { botanischeNaam: string }[];
  }>;
  todayArrivals: Array<{
    id: string;
    aangiftenummer: string;
    exporteur: string | null;
    landVanOorsprong: string | null;
    awb: string | null;
    status: string;
    subShipments: { botanischeNaam: string }[];
  }>;
  todayInspections: Array<{
    id: string;
    aangiftenummer: string;
    awb: string | null;
    exporteur: string | null;
    status: string;
    inspectiedatum: string | null;
    subShipments: { botanischeNaam: string }[];
    inspectionReports: Array<{
      tijdAanvang: string | null;
      tijdEinde: string | null;
    }>;
  }>;
  todayStatusChanges: number;
}

export default function DashboardPage() {
  const { currentDate, setSimulatedDate } = useDateContext();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pipelineFilter, setPipelineFilter] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    // Use local date components to avoid UTC date shift (e.g. 00:30 CEST = previous day in UTC)
    const dateParam = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    fetch(`/api/dashboard/stats?date=${dateParam}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dateString = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px]" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
        <Skeleton className="h-[80px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date header with navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            const prev = new Date(currentDate);
            prev.setDate(prev.getDate() - 1);
            setSimulatedDate(prev);
          }}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg sm:text-2xl font-bold">{dateString}</h2>
        <button
          onClick={() => {
            const next = new Date(currentDate);
            next.setDate(next.getDate() + 1);
            setSimulatedDate(next);
          }}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* KPI row */}
      <KpiCards
        todayArrivals={data.todayArrivals.length}
        todayInspections={data.todayInspections.length}
        activeShipments={data.activeTotals.total}
        blocked={(data.totals.GEBLOKKEERD || 0) + (data.totals.WACHT_OP_VERVOLG || 0)}
      />

      {/* Today's sections */}
      <div className="grid gap-4 md:grid-cols-2">
        <TodayInspections shipments={data.todayInspections} />
        <TodayArrivals shipments={data.todayArrivals} />
      </div>

      {/* Active Status Pipeline */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-4 font-semibold">{t("dashboard.activePipeline")}</h3>
        <StatusPipeline totals={data.totals} selectedStatus={pipelineFilter} onStatusClick={setPipelineFilter} />
      </div>

      {/* Recent active shipments */}
      <RecentShipments shipments={data.recentShipments} statusFilter={pipelineFilter} />
    </div>
  );
}
