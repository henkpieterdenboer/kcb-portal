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
  );
}
