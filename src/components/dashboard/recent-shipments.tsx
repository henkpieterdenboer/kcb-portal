"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/shipments/status-badge";
import { useTranslation } from "@/lib/i18n/context";

interface ShipmentRow {
  id: string;
  aangiftenummer: string;
  exporteur: string | null;
  awb: string | null;
  landVanOorsprong: string | null;
  status: string;
  lastStatusAt: string;
  subShipments: { botanischeNaam: string }[];
}

interface RecentShipmentsProps {
  shipments: ShipmentRow[];
  statusFilter?: string | null;
}

export function RecentShipments({ shipments, statusFilter }: RecentShipmentsProps) {
  const { t } = useTranslation();
  const [showDocControl, setShowDocControl] = useState(false);

  const filtered = useMemo(() => {
    let result = shipments;
    if (!showDocControl) {
      result = result.filter((s) => s.status !== "DOCUMENTCONTROLE");
    }
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }
    return result;
  }, [shipments, statusFilter, showDocControl]);

  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold">{t("dashboard.openShipments")}</h3>
        <div className="flex items-center gap-3">
          {statusFilter && (
            <StatusBadge status={statusFilter} />
          )}
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <Switch checked={showDocControl} onCheckedChange={setShowDocControl} />
            {t("dashboard.showDocControl")}
          </label>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="space-y-0 divide-y md:hidden">
        {filtered.map((s) => (
          <Link
            key={s.id}
            href={`/shipments/${s.id}`}
            className="block p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-medium text-blue-600">
                  {s.awb || s.aangiftenummer}
                </div>
                <div className="mt-0.5 text-sm text-gray-600 truncate">{s.exporteur || "-"}</div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
              {s.landVanOorsprong && <span>{s.landVanOorsprong}</span>}
              <span>{new Date(s.lastStatusAt).toLocaleDateString("nl-NL")}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">{t("shipments.noShipments")}</div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.awb")}</TableHead>
              <TableHead>{t("table.exporter")}</TableHead>
              <TableHead>{t("table.product")}</TableHead>
              <TableHead>{t("table.origin")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.updated")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell>
                  <Link href={`/shipments/${s.id}`} className="font-mono text-sm font-medium text-blue-600 hover:underline">
                    {s.awb || s.aangiftenummer}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[180px] truncate">{s.exporteur || "-"}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {s.subShipments.map((sub) => sub.botanischeNaam).join(", ") || "-"}
                </TableCell>
                <TableCell>{s.landVanOorsprong || "-"}</TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(s.lastStatusAt).toLocaleDateString("nl-NL")}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                  {t("shipments.noShipments")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
