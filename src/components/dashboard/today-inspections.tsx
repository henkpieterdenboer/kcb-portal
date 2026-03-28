"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shipments/status-badge";
import { ClipboardCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface InspectionShipment {
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
}

export function TodayInspections({ shipments }: { shipments: InspectionShipment[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-violet-600" />
          {t("dashboard.todayInspections")} ({shipments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shipments.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            {t("dashboard.noInspections")}
          </p>
        ) : (
          <div className="space-y-3">
            {shipments.map((s) => {
              const report = s.inspectionReports[0];
              // Use tijdAanvang from report, or extract time from inspectiedatum
              let time = report?.tijdAanvang || null;
              if (!time && s.inspectiedatum) {
                const d = new Date(s.inspectiedatum);
                const h = d.getUTCHours();
                const m = d.getUTCMinutes();
                if (h !== 0 || m !== 0) {
                  time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                }
              }
              return (
                <Link
                  key={s.id}
                  href={`/shipments/${s.id}`}
                  className="block rounded-md border p-3 transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-12 sm:w-14 shrink-0 text-center text-sm font-semibold text-violet-600">
                      {time || "--:--"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-medium">
                            {s.awb || s.aangiftenummer}
                          </span>
                          <span className="ml-2 text-sm text-gray-500 hidden sm:inline">
                            {s.exporteur}
                          </span>
                          <div className="text-sm text-gray-500 truncate sm:hidden">
                            {s.exporteur}
                          </div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      {s.subShipments.length > 0 && (
                        <div className="mt-0.5 text-xs text-gray-400 truncate">
                          {s.subShipments.map((sub) => sub.botanischeNaam).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
