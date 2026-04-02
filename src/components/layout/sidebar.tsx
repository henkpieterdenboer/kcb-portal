"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ship, Archive, Mail, Settings, Users, LogOut, KeyRound, ChevronsUpDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useTranslation, Language } from "@/lib/i18n/context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const languages: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands" },
  { value: "pl", label: "Polski" },
  { value: "es", label: "Espanol" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslation();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState("");

  const mainNav = [
    { name: t("nav.dashboard"), href: "/", icon: LayoutDashboard },
    { name: t("nav.shipments"), href: "/shipments", icon: Ship },
    { name: t("nav.archive"), href: "/shipments/archive", icon: Archive },
  ];

  const bottomNav = [
    ...(isAdmin ? [
      { name: t("nav.emailLog"), href: "/settings/emails", icon: Mail },
      { name: t("nav.users"), href: "/settings/users", icon: Users },
    ] : []),
    { name: t("nav.settings"), href: "/settings", icon: Settings },
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

  function resetPasswordForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  async function handleChangePassword() {
    setError("");
    if (newPassword.length < 8) {
      setError(t("changePassword.passwordMin"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("changePassword.passwordMismatch"));
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        toast.success(t("changePassword.success"));
        setPasswordDialogOpen(false);
        resetPasswordForm();
      } else if (res.status === 403) {
        setError(t("changePassword.wrongPassword"));
      } else {
        setError("Failed to change password");
      }
    } catch {
      setError("Failed to change password");
    }
    setChanging(false);
  }

  return (
    <>
      <div className="flex h-full w-64 flex-col border-r bg-white">
        <div className="flex flex-col items-start justify-center border-b px-6 py-3">
          <img src="/logo.png" alt="Coloriginz" className="h-7 w-auto" />
          <h1 className="text-sm font-semibold text-gray-500">{t("nav.appTitle")}</h1>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t px-3 py-3 space-y-1">
          {bottomNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          {/* User account dropdown */}
          <div className="mt-2 border-t pt-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-gray-50 transition-colors">
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
                <ChevronsUpDown className="h-4 w-4 text-gray-400 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.value}
                    onClick={() => setLanguage(lang.value)}
                    className={language === lang.value ? "font-medium bg-gray-50" : ""}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { resetPasswordForm(); setPasswordDialogOpen(true); }}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {t("changePassword.title")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { onNavigate?.(); signOut({ callbackUrl: "/login" }); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Change password dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={(open) => { setPasswordDialogOpen(open); if (!open) resetPasswordForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("changePassword.title")}</DialogTitle>
            <DialogDescription>{session?.user?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder={t("changePassword.currentPlaceholder")}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder={t("changePassword.newPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder={t("changePassword.confirmPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(); }}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleChangePassword} disabled={changing} className="w-full">
              {changing ? t("changePassword.changing") : t("changePassword.change")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
