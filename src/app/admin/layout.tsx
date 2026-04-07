import Link from "next/link";
import { requireAdminOrPolicePage } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminOrPolicePage();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin" className="underline underline-offset-4">
            Live Map
          </Link>
          <Link href="/admin/alerts" className="underline underline-offset-4">
            Alerts
          </Link>
          <Link href="/admin/tourists" className="underline underline-offset-4">
            Tourists
          </Link>
          <Link href="/admin/zones" className="underline underline-offset-4">
            Zones
          </Link>
          <Link href="/admin/wearable-sim" className="underline underline-offset-4">
            Wearable Sim
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

