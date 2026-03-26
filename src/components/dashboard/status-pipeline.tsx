"use client";

import { ChevronRight } from "lucide-react";
import { SHIPMENT_STATUSES, STATUS_LABELS } from "@/types";

interface StatusPipelineProps {
  totals: Record<string, number>;
}

const stageColors: Record<string, string> = {
  AANGEMELD: "bg-slate-500",
  INSPECTIE_AANGEVRAAGD: "bg-indigo-500",
  INSPECTIE_GEPLAND: "bg-violet-500",
  DOCUMENTCONTROLE: "bg-blue-500",
  DOCUMENTCONTROLE_AFGEROND: "bg-cyan-500",
  FYSIEKE_INSPECTIE: "bg-yellow-500",
  GOEDGEKEURD: "bg-green-500",
  WACHT_OP_VERVOLG: "bg-orange-500",
  GEBLOKKEERD: "bg-red-500",
};

export function StatusPipeline({ totals }: StatusPipelineProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SHIPMENT_STATUSES.map((status, i) => (
        <div key={status} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1 rounded-lg border bg-white p-3 shadow-sm">
            <div className={`h-2 w-16 rounded-full ${stageColors[status]}`} />
            <span className="text-xs font-medium text-gray-600">
              {STATUS_LABELS[status]}
            </span>
            <span className="text-lg font-bold">{totals[status] || 0}</span>
          </div>
          {i < SHIPMENT_STATUSES.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );
}
