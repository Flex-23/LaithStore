import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "دخول الإدارة" };

/**
 * Standalone management sign-in for the admin and agents. Not linked from the
 * storefront; there is no self-registration — the admin comes from the seed
 * and agents are created by the admin.
 */
export default async function AdminLoginPage() {
  const session = await getSession();
  if (session && session.role !== "USER") redirect("/admin");

  return <AdminLoginForm />;
}
