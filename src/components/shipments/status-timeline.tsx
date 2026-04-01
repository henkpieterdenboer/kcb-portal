"use client";

import { Mail } from "lucide-react";
import { StatusBadge } from "./status-badge";

interface StatusEntry {
  id: string;
  status: string;
  source: string | null;
  details: string | null;
  timestamp: string;
  emailIngestionId?: string | null;
}

interface StatusTimelineProps {
  history: StatusEntry[];
  onViewEmail?: (emailIngestionId: string) => void;
}

export function StatusTimeline({ history, onViewEmail }: StatusTimelineProps) {
  const emailSources = ["MEDEDELING", "INSPECTIERAPPORT", "BLOKKADERAPPORT"];

  return (
    <div className="space-y-4">
      {history.map((entry, i) => {
        const hasEmail = onViewEmail && entry.emailIngestionId && entry.source && emailSources.includes(entry.source);
        return (
          <div key={entry.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              {i < history.length - 1 && <div className="h-full w-px bg-gray-200" />}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={entry.status} />
                {entry.source && (
                  hasEmail ? (
                    <button
                      onClick={() => onViewEmail!(entry.emailIngestionId!)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      via {entry.source}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">via {entry.source}</span>
                  )
                )}
              </div>
              {entry.details && (
                <p className="mt-1 text-sm text-gray-600">{entry.details}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {new Date(entry.timestamp).toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        );
      })}
      {history.length === 0 && (
        <p className="text-sm text-gray-500">No status history available</p>
      )}
    </div>
  );
}
