"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
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
