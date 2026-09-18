import { redirect } from "next/navigation";
import { landingPath, requireStaff } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** Sends each staff member to the first page they're allowed to open. */
export default async function AdminIndex() {
  const staff = await requireStaff();
  redirect(landingPath(staff) ?? "/admin/no-access");
}
