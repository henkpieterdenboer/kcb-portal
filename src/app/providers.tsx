"use client";

import { SessionProvider } from "next-auth/react";
import { DateProvider } from "@/lib/date-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DateProvider>{children}</DateProvider>
    </SessionProvider>
  );
}
