"use client";

import { ChevronRight } from "lucide-react";
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

// All active statuses in display order
const pipelineStatuses = [
  "AANGEMELD",
  "INSPECTIE_AANGEVRAAGD",
  "INSPECTIE_GEPLAND",
  "FYSIEKE_INSPECTIE",
  "WACHT_OP_VERVOLG",
  "DOCUMENTCONTROLE",
] as const;

// Sub-statuses that belong to the Physical Inspection track
const inspectionSubStatuses = new Set([
  "INSPECTIE_AANGEVRAAGD",
  "INSPECTIE_GEPLAND",
  "FYSIEKE_INSPECTIE",
  "WACHT_OP_VERVOLG",
]);

const terminalStatuses = [
  "GOEDGEKEURD",
  "DOCUMENTCONTROLE_AFGEROND",
  "GEBLOKKEERD",
] as const;

export function StatusPipeline({ totals, showTerminal = false, selectedStatus, onStatusClick }: StatusPipelineProps) {
  const { t } = useTranslation();
  const isClickable = !!onStatusClick;

  const handleClick = (status: string) => {
    onStatusClick?.(selectedStatus === status ? null : status);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
        {pipelineStatuses.map((status, i) => {
          const isSelected = selectedStatus === status;
          // Insert separator before Document Control
          const showSeparator = status === "DOCUMENTCONTROLE";
          // Show chevron between inspection-track cards
          const showChevron = i < pipelineStatuses.length - 1 && !showSeparator;

          return (
            <div key={status} className="flex items-center flex-1 min-w-0">
              {showSeparator && (
                <div className="hidden sm:flex items-center px-2 self-stretch">
                  <div className="h-full w-px bg-gray-200" />
                </div>
              )}
              {showChevron && i > 0 && (
                <ChevronRight className="hidden sm:block h-4 w-4 text-gray-400 shrink-0 -ml-1 mr-1" />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => handleClick(status)}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-lg border p-2 sm:p-3 shadow-sm transition-all",
                  isClickable && "cursor-pointer hover:shadow-md hover:border-gray-300",
                  isSelected
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "bg-white",
                )}
              >
                <div className={`h-1.5 sm:h-2 w-full rounded-full ${stageColors[status]}`} />
                <span className="text-[10px] sm:text-xs font-medium text-gray-600 text-center leading-tight">
                  {t("status." + status)}
                </span>
                <span className="text-base sm:text-lg font-bold">{totals[status] || 0}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Terminal statuses (optional) */}
      {showTerminal && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          {terminalStatuses.map((status) => (
            <button
              key={status}
              type="button"
              disabled={!isClickable}
              onClick={() => handleClick(status)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 sm:p-3 shadow-sm transition-all flex-1",
                isClickable && "cursor-pointer hover:shadow-md hover:border-gray-300",
                selectedStatus === status
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "bg-white",
              )}
            >
              <div className={`h-1.5 sm:h-2 w-full rounded-full ${stageColors[status]}`} />
              <span className="text-[10px] sm:text-xs font-medium text-gray-600 text-center leading-tight">
                {t("status." + status)}
              </span>
              <span className="text-base sm:text-lg font-bold">{totals[status] || 0}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
