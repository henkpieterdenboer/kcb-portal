"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { SHIPMENT_STATUSES, ACTIVE_STATUSES, TERMINAL_STATUSES } from "@/types";
import { Search } from "lucide-react";

interface ShipmentRow {
  id: string;
  aangiftenummer: string;
  exporteur: string | null;
  awb: string | null;
  landVanOorsprong: string | null;
  status: string;
  lastStatusAt: string;
  subShipments: { botanischeNaam: string }[];
  _count: {
    inspectionReports: number;
    sampleReports: number;
    blockadeReports: number;
  };
}

interface ShipmentTableProps {
  shipments: ShipmentRow[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  mode?: "active" | "archived";
}

export function ShipmentTable({ shipments, pagination, mode }: ShipmentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const basePath = mode === "archived" ? "/shipments/archive" : "/shipments";
  const filterStatuses = mode === "archived"
    ? TERMINAL_STATUSES
    : mode === "active"
      ? ACTIVE_STATUSES
      : SHIPMENT_STATUSES;

  function applyFilters(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    if (!("page" in params)) sp.set("page", "1");
    router.push(`${basePath}?${sp.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t("shipments.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters({ search });
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={searchParams.get("status") || "ALL"}
            onValueChange={(v) => applyFilters({ status: v === "ALL" ? "" : (v ?? "") })}
          >
            <SelectTrigger className="flex-1 sm:w-[200px]">
              <SelectValue placeholder={t("shipments.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("shipments.allStatuses")}</SelectItem>
              {filterStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {t("status." + s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => applyFilters({ search })}>
            {t("shipments.filter")}
          </Button>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="space-y-2 md:hidden">
        {shipments.map((s) => (
          <Link
            key={s.id}
            href={`/shipments/${s.id}`}
            className="block rounded-lg border bg-white p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-medium text-blue-600">
                  {s.awb || s.aangiftenummer}
                </div>
                <div className="mt-0.5 text-sm text-gray-600 truncate">
                  {s.exporteur || "-"}
                </div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              {s.landVanOorsprong && <span>{s.landVanOorsprong}</span>}
              <span>{new Date(s.lastStatusAt).toLocaleDateString("nl-NL")}</span>
            </div>
            {s.subShipments.length > 0 && (
              <div className="mt-1 text-xs text-gray-400 truncate">
                {s.subShipments.map((sub) => sub.botanischeNaam).join(", ")}
              </div>
            )}
          </Link>
        ))}
        {shipments.length === 0 && (
          <div className="py-8 text-center text-gray-500">{t("shipments.noShipments")}</div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block rounded-lg border bg-white">
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
                  <Link
                    href={`/shipments/${s.id}`}
                    className="font-mono text-sm font-medium text-blue-600 hover:underline"
                  >
                    {s.awb || s.aangiftenummer}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[180px] truncate">
                  {s.exporteur || "-"}
                </TableCell>
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

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-gray-600">
            {t("shipments.showing", {
              start: (pagination.page - 1) * pagination.pageSize + 1,
              end: Math.min(pagination.page * pagination.pageSize, pagination.total),
              total: pagination.total,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => applyFilters({ page: String(pagination.page - 1) })}
            >
              {t("shipments.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => applyFilters({ page: String(pagination.page + 1) })}
            >
              {t("shipments.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
