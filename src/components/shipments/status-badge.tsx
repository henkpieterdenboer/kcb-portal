"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_COLORS, ShipmentStatus } from "@/types";

export function StatusBadge({ status }: { status: string }) {
  const s = status as ShipmentStatus;
  const label = STATUS_LABELS[s] || status;
  const colorClass = STATUS_COLORS[s] || "bg-gray-100 text-gray-800";

  return (
    <Badge variant="secondary" className={colorClass}>
      {label}
    </Badge>
  );
}
