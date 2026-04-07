import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AdminRole = "admin" | "police";

export function extractRole(user: Awaited<ReturnType<typeof currentUser>>): string | null {
  const role = (user?.publicMetadata as { role?: unknown } | undefined)?.role;
  return typeof role === "string" ? role : null;
}

export async function requireAdminOrPolicePage() {
  const user = await currentUser();
  const role = extractRole(user);
  if (role !== "admin" && role !== "police") {
    redirect("/dashboard");
  }
  return { userId: user!.id, role: role as AdminRole };
}

export async function requireAdminOrPoliceApi() {
  const user = await currentUser();
  const role = extractRole(user);
  if (!user || (role !== "admin" && role !== "police")) {
    return null;
  }
  return { userId: user.id, role: role as AdminRole };
}

