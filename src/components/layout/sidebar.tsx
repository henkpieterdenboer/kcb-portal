"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ship, Archive, Mail, Settings, Users, LogOut } from "lucide-react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useTranslation, Language } from "@/lib/i18n/context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands" },
  { value: "pl", label: "Polski" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslation();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const mainNav = [
    { name: t("nav.dashboard"), href: "/", icon: LayoutDashboard },
    { name: t("nav.shipments"), href: "/shipments", icon: Ship },
    { name: t("nav.archive"), href: "/shipments/archive", icon: Archive },
    { name: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  const adminNav = [
    { name: t("nav.users"), href: "/settings/users", icon: Users },
    { name: t("nav.emailLog"), href: "/settings/emails", icon: Mail },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/shipments") return pathname === "/shipments";
    if (href === "/settings") return pathname === "/settings";
    return pathname.startsWith(href);
  }

  function NavLink({ item }: { item: { name: string; href: string; icon: React.ElementType } }) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive(item.href)
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-gray-900">{t("nav.appTitle")}</h1>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t px-3 py-3 space-y-1">
        {/* Admin links */}
        {isAdmin && (
          <>
            {adminNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            <div className="my-2 border-t" />
          </>
        )}

        {/* Language selector */}
        <div className="px-3 py-1.5">
          <Select value={language} onValueChange={(v) => v && setLanguage(v as Language)}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User info + sign out */}
        <div className="mt-1 border-t pt-3">
          <div className="flex items-center gap-3 px-3 py-1.5">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-gray-200 text-sm">
                {(session?.user?.name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || "User"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {session?.user?.email || ""}
              </div>
            </div>
          </div>
          <button
            onClick={() => { onNavigate?.(); signOut({ callbackUrl: "/login" }); }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
            {t("nav.signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}
