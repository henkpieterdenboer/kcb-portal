"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shipments/status-badge";
import { useTranslation } from "@/lib/i18n/context";

interface ShipmentRow {
  id: string;
  aangiftenummer: string;
  exporteur: string | null;
  awb: string | null;
  landVanOorsprong: string | null;
  status: string;
  updatedAt: string;
  subShipments: { botanischeNaam: string }[];
}

export function RecentShipments({ shipments }: { shipments: ShipmentRow[] }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">{t("dashboard.recentShipments")}</h3>
      </div>

      {/* Mobile card view */}
      <div className="space-y-0 divide-y md:hidden">
        {shipments.map((s) => (
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
              <span>{new Date(s.updatedAt).toLocaleDateString("nl-NL")}</span>
            </div>
          </Link>
        ))}
        {shipments.length === 0 && (
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
            {shipments.map((s) => (
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
                  {new Date(s.updatedAt).toLocaleDateString("nl-NL")}
                </TableCell>
              </TableRow>
            ))}
            {shipments.length === 0 && (
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
