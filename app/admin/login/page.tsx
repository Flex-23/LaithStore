import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "دخول المدير" };

/**
 * Standalone admin sign-in. Not linked from the storefront; there is no
 * self-registration — admin accounts are created by the seed / database.
 */
export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.role === "ADMIN") redirect("/admin/dashboard");

  return <AdminLoginForm />;
}
