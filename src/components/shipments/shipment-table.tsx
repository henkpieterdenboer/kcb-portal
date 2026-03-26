"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { SHIPMENT_STATUSES, STATUS_LABELS, ShipmentStatus } from "@/types";
import { Search } from "lucide-react";

interface ShipmentRow {
  id: string;
  aangiftenummer: string;
  exporteur: string | null;
  awb: string | null;
  landVanOorsprong: string | null;
  status: string;
  updatedAt: string;
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
}

export function ShipmentTable({ shipments, pagination }: ShipmentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  function applyFilters(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.set("page", "1");
    router.push(`/shipments?${sp.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search declaration no., AWB, exporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters({ search });
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={searchParams.get("status") || "ALL"}
          onValueChange={(v) => applyFilters({ status: v === "ALL" ? "" : (v ?? "") })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {SHIPMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s as ShipmentStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => applyFilters({ search })}>
          Filter
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Declaration No.</TableHead>
              <TableHead>Exporter</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>AWB</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell>
                  <Link
                    href={`/shipments/${s.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {s.aangiftenummer}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {s.exporteur || "-"}
                </TableCell>
                <TableCell>
                  {s.subShipments.map((sub) => sub.botanischeNaam).join(", ") || "-"}
                </TableCell>
                <TableCell>{s.landVanOorsprong || "-"}</TableCell>
                <TableCell className="font-mono text-sm">{s.awb || "-"}</TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {s._count.inspectionReports > 0 && `${s._count.inspectionReports} insp`}
                  {s._count.blockadeReports > 0 && ` ${s._count.blockadeReports} block`}
                  {s._count.sampleReports > 0 && ` ${s._count.sampleReports} sample`}
                  {s._count.inspectionReports === 0 &&
                    s._count.blockadeReports === 0 &&
                    s._count.sampleReports === 0 &&
                    "-"}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(s.updatedAt).toLocaleDateString("nl-NL")}
                </TableCell>
              </TableRow>
            ))}
            {shipments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                  No shipments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.pageSize + 1}-
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => applyFilters({ page: String(pagination.page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => applyFilters({ page: String(pagination.page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
