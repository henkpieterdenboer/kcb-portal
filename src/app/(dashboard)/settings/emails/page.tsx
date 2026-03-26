"use client";

import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/context";
import { EmailIngestionLog } from "@/components/settings/email-ingestion-log";

export default function EmailLogPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="py-8 text-center text-gray-500">Unauthorized</div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("emailLog.title")}</h2>
      <EmailIngestionLog />
    </div>
  );
}
