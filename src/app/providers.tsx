"use client";

import { SessionProvider } from "next-auth/react";
import { DateProvider } from "@/lib/date-context";
import { LanguageProvider } from "@/lib/i18n/context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <DateProvider>{children}</DateProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
