"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TestBanner } from "@/components/layout/test-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: re-enable auth check after login is fixed
  return (
    <div className="flex h-screen flex-col">
      <TestBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
