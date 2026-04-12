"use client";

import { DashboardNav } from "./DashboardNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation */}
      <DashboardNav />

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
