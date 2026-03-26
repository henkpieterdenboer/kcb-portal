"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface DateContextValue {
  currentDate: Date;
  isSimulated: boolean;
  setSimulatedDate: (date: Date | null) => void;
}

const DateContext = createContext<DateContextValue | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
  const [simulatedDate, setSimulatedDateState] = useState<Date | null>(null);

  const setSimulatedDate = useCallback((date: Date | null) => {
    setSimulatedDateState(date);
  }, []);

  const currentDate = simulatedDate ?? new Date();

  return (
    <DateContext.Provider value={{ currentDate, isSimulated: simulatedDate !== null, setSimulatedDate }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDateContext() {
  const ctx = useContext(DateContext);
  if (!ctx) {
    throw new Error("useDateContext must be used within a DateProvider");
  }
  return ctx;
}
