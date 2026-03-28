"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation, Language } from "@/lib/i18n/context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Menu } from "lucide-react";

const languages: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "nl", label: "NL" },
  { value: "pl", label: "PL" },
];

export function Header({ onMenuToggle }: { onMenuToggle?: () => void } = {}) {
  const { data: session } = useSession();
  const { language, setLanguage } = useTranslation();

  return (
    <header className="flex h-14 lg:h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-gray-900 lg:hidden">KCB Portal</span>
      </div>
      <div className="flex items-center gap-3">
        <Select value={language} onValueChange={(v) => v && setLanguage(v as Language)}>
          <SelectTrigger className="h-8 w-[70px]">
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
        <span className="text-sm text-gray-600">{session?.user?.name || "User"}</span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gray-200 text-sm">
            {(session?.user?.name || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
