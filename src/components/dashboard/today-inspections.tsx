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
              const time = report?.tijdAanvang || null;
              return (
                <Link
                  key={s.id}
                  href={`/shipments/${s.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {time && (
                      <span className="text-sm font-medium text-violet-600">
                        {time}
                      </span>
                    )}
                    <div>
                      <span className="font-mono text-sm font-medium">
                        {s.awb || s.aangiftenummer}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {s.exporteur}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {s.subShipments.map((sub) => sub.botanischeNaam).join(", ")}
                    </span>
                    <StatusBadge status={s.status} />
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
