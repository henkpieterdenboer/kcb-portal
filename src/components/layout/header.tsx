"use client";

import { Menu } from "lucide-react";

export function Header({ onMenuToggle }: { onMenuToggle?: () => void } = {}) {
  return (
    <header className="flex h-14 items-center border-b bg-white px-4 lg:hidden">
      <button
        onClick={onMenuToggle}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="ml-3 text-lg font-bold text-gray-900">KCB Portal</span>
    </header>
  );
}
