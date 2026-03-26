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

const languages: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "nl", label: "NL" },
  { value: "pl", label: "PL" },
];

export function Header() {
  const { data: session } = useSession();
  const { language, setLanguage } = useTranslation();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div />
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
