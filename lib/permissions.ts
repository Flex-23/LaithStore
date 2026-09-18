// Server-side staff/permission guards. Client components should import the
// pure helpers from "./agent" instead (this module pulls in Prisma).
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { getSession } from "./auth";
import type { Permission, Permissions } from "./agent";

export { agentCode, PERMISSIONS, PERMISSION_LABELS } from "./agent";
export type { Permission, Permissions } from "./agent";

export type Staff = {
  id: string;
  name: string;
  role: Role;
  agentNumber: number | null;
  commissionPercent: number;
  permissions: Permissions;
};

const ALL: Permissions = { products: true, orders: true, dashboard: true, home: true };

/**
 * Loads the signed-in staff member (admin or active agent) with their live
 * permissions from the database. Returns null for customers / visitors.
 */
export async function getStaff(): Promise<Staff | null> {
  const session = await getSession();
  if (!session || session.role === "USER") return null;
  try {
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || user.role === "USER" || !user.isActive) return null;
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      agentNumber: user.agentNumber,
      commissionPercent: user.commissionPercent,
      permissions:
        user.role === "ADMIN"
          ? ALL
          : {
              products: user.canManageProducts,
              orders: user.canManageOrders,
              dashboard: user.canViewDashboard,
              home: user.canManageHome,
            },
    };
  } catch {
    return null;
  }
}

/** First panel page this staff member may open (null if none). */
export function landingPath(staff: Staff): string | null {
  if (staff.permissions.dashboard) return "/admin/dashboard";
  if (staff.permissions.orders) return "/admin/orders";
  if (staff.permissions.products) return "/admin/products";
  if (staff.permissions.home) return "/admin/home";
  return null;
}

/**
 * Page guard: must be signed-in staff, optionally holding `permission`.
 * Lacking the permission sends them to their own landing page.
 */
export async function requireStaff(permission?: Permission): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (permission && !staff.permissions[permission]) {
    redirect(landingPath(staff) ?? "/admin/no-access");
  }
  return staff;
}

/** Page guard for admin-only areas (agents, expenses, reports). */
export async function requireAdminStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (staff.role !== "ADMIN") redirect(landingPath(staff) ?? "/admin/no-access");
  return staff;
}

/** Server-action guard: returns the staff member or null (no redirect). */
export async function staffWith(permission: Permission): Promise<Staff | null> {
  const staff = await getStaff();
  return staff && staff.permissions[permission] ? staff : null;
}

export async function adminOnly(): Promise<Staff | null> {
  const staff = await getStaff();
  return staff?.role === "ADMIN" ? staff : null;
}
