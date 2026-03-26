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
  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">Recent Shipments</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Declaration No.</TableHead>
            <TableHead>Exporter</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Origin</TableHead>
            <TableHead>AWB</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((s) => (
            <TableRow key={s.id} className="cursor-pointer hover:bg-gray-50">
              <TableCell>
                <Link href={`/shipments/${s.id}`} className="font-medium text-blue-600 hover:underline">
                  {s.aangiftenummer}
                </Link>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">{s.exporteur || "-"}</TableCell>
              <TableCell>
                {s.subShipments.map((sub) => sub.botanischeNaam).join(", ") || "-"}
              </TableCell>
              <TableCell>{s.landVanOorsprong || "-"}</TableCell>
              <TableCell className="font-mono text-sm">{s.awb || "-"}</TableCell>
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
              <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                No shipments found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
