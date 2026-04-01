"use client";

import { ChevronRight } from "lucide-react";
import { SHIPMENT_STATUSES } from "@/types";
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

// Two parallel paths after registration
const inspectionPath = [
  "AANGEMELD",
  "INSPECTIE_AANGEVRAAGD",
  "INSPECTIE_GEPLAND",
  "FYSIEKE_INSPECTIE",
] as const;

const documentPath = ["DOCUMENTCONTROLE"] as const;

const terminalStatuses = [
  "GOEDGEKEURD",
  "DOCUMENTCONTROLE_AFGEROND",
  "WACHT_OP_VERVOLG",
  "GEBLOKKEERD",
] as const;

function StatusButton({
  status,
  count,
  isSelected,
  isClickable,
  onClick,
  t,
}: {
  status: string;
  count: number;
  isSelected: boolean;
  isClickable: boolean;
  onClick: () => void;
  t: (key: string) => string;
}) {
  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={onClick}
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
      <span className="text-base sm:text-lg font-bold">{count}</span>
    </button>
  );
}

export function StatusPipeline({ totals, showTerminal = false, selectedStatus, onStatusClick }: StatusPipelineProps) {
  const { t } = useTranslation();
  const isClickable = !!onStatusClick;

  const handleClick = (status: string) => {
    onStatusClick?.(selectedStatus === status ? null : status);
  };

  return (
    <div className="space-y-3">
      {/* Active pipeline: two parallel paths */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Inspection path */}
        <div className="flex flex-1 items-center gap-2">
          {inspectionPath.map((status, i) => (
            <div key={status} className="flex items-center gap-2 flex-1">
              <StatusButton
                status={status}
                count={totals[status] || 0}
                isSelected={selectedStatus === status}
                isClickable={isClickable}
                onClick={() => handleClick(status)}
                t={t}
              />
              {i < inspectionPath.length - 1 && (
                <ChevronRight className="hidden sm:block h-4 w-4 text-gray-400 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="hidden sm:flex items-center px-1">
          <div className="h-full w-px bg-gray-200" />
        </div>

        {/* Document path */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {documentPath.map((status) => (
              <StatusButton
                key={status}
                status={status}
                count={totals[status] || 0}
                isSelected={selectedStatus === status}
                isClickable={isClickable}
                onClick={() => handleClick(status)}
                t={t}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Terminal statuses (optional) */}
      {showTerminal && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          {terminalStatuses.map((status) => (
            <StatusButton
              key={status}
              status={status}
              count={totals[status] || 0}
              isSelected={selectedStatus === status}
              isClickable={isClickable}
              onClick={() => handleClick(status)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
