"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { UserManagement } from "@/components/settings/user-management";

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  if (status === "loading" || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("users.title")}</h2>
      <UserManagement />
    </div>
  );
}
