"use client";

import { ChevronRight } from "lucide-react";
import { SHIPMENT_STATUSES, ACTIVE_STATUSES } from "@/types";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface StatusPipelineProps {
  totals: Record<string, number>;
  showTerminal?: boolean;
  selectedStatus?: string | null;
  onStatusClick?: (status: string | null) => void;
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

export function StatusPipeline({ totals, showTerminal = false, selectedStatus, onStatusClick }: StatusPipelineProps) {
  const { t } = useTranslation();
  const statuses = showTerminal ? SHIPMENT_STATUSES : ACTIVE_STATUSES;
  const isClickable = !!onStatusClick;

  return (
    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
      {statuses.map((status, i) => {
        const isSelected = selectedStatus === status;
        return (
          <div key={status} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => onStatusClick?.(isSelected ? null : status)}
              className={cn(
                "flex w-full flex-col items-center gap-1 rounded-lg border p-2 sm:p-3 shadow-sm transition-all",
                isClickable && "cursor-pointer hover:shadow-md hover:border-gray-300",
                isSelected
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "bg-white",
              )}
            >
              <div className={`h-1.5 sm:h-2 w-full sm:w-16 rounded-full ${stageColors[status]}`} />
              <span className="text-[10px] sm:text-xs font-medium text-gray-600 text-center leading-tight">
                {t("status." + status)}
              </span>
              <span className="text-base sm:text-lg font-bold">{totals[status] || 0}</span>
            </button>
            {i < statuses.length - 1 && (
              <ChevronRight className="hidden sm:block h-4 w-4 text-gray-400 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
