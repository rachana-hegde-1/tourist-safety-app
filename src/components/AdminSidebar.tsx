"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Home, AlertTriangle, Users, MapPin, Smartphone, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Live Map", href: "/admin", icon: Home },
  { name: "Alerts", href: "/admin/alerts", icon: AlertTriangle },
  { name: "Tourists", href: "/admin/tourists", icon: Users },
  { name: "Zones", href: "/admin/zones", icon: MapPin },
  { name: "Wearable Sim", href: "/admin/wearable-sim", icon: Smartphone },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col bg-white border-r border-gray-200 dark:bg-slate-950 dark:border-slate-800">
      <div className="flex h-full flex-col justify-between">
        <div>
          <div className="px-6 py-6 border-b border-gray-200 dark:border-slate-800">
            <div className="text-lg font-semibold">Admin Console</div>
            <p className="text-sm text-muted-foreground">Live operations panel</p>
          </div>
          <nav className="px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-6 pb-6">
          <SignOutButton>
            <Button variant="outline" className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </SignOutButton>
        </div>
      </div>
    </aside>
  );
}
