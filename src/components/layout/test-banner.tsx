"use client";

import { useDateContext } from "@/lib/date-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TestBanner() {
  const { currentDate, isSimulated, setSimulatedDate } = useDateContext();

  if (process.env.NEXT_PUBLIC_TEST_MODE !== "true") {
    return null;
  }

  const dateValue = currentDate.toISOString().split("T")[0];

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-red-600 px-4 py-2 text-sm text-white">
      <span className="font-semibold">Test Environment</span>
      <div className="flex items-center gap-2">
        <span>Simulated date:</span>
        <Input
          type="date"
          value={dateValue}
          onChange={(e) => {
            if (e.target.value) {
              const [year, month, day] = e.target.value.split("-").map(Number);
              setSimulatedDate(new Date(year, month - 1, day, 12, 0, 0));
            }
          }}
          className="h-7 w-40 border-red-400 bg-red-700 text-white placeholder:text-red-300 [&::-webkit-calendar-picker-indicator]:invert"
        />
        {isSimulated && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimulatedDate(null)}
            className="h-7 border-red-400 bg-transparent text-white hover:bg-red-700 hover:text-white"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
