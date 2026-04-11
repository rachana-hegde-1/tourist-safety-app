import { requireAdminOrPolicePage } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminOrPolicePage();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex">
      <AdminSidebar />
      <main className="flex-1 min-h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
}

