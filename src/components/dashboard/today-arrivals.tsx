"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shipments/status-badge";
import { Plane } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface ArrivalShipment {
  id: string;
  aangiftenummer: string;
  exporteur: string | null;
  landVanOorsprong: string | null;
  awb: string | null;
  status: string;
  subShipments: { botanischeNaam: string }[];
}

export function TodayArrivals({ shipments }: { shipments: ArrivalShipment[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plane className="h-4 w-4 text-blue-600" />
          {t("dashboard.todayArrivals")} ({shipments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shipments.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            {t("dashboard.noArrivals")}
          </p>
        ) : (
          <div className="space-y-3">
            {shipments.map((s) => (
              <Link
                key={s.id}
                href={`/shipments/${s.id}`}
                className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-gray-50"
              >
                <div>
                  <span className="font-mono text-sm font-medium">
                    {s.awb || s.aangiftenummer}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {s.exporteur}
                  </span>
                  {s.landVanOorsprong && (
                    <span className="ml-2 text-xs text-gray-400">
                      ({s.landVanOorsprong})
                    </span>
                  )}
                </div>
                <StatusBadge status={s.status} />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
