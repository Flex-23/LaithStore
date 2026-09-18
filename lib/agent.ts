// Pure agent/permission helpers — safe to import from client components.

// Panel permissions an admin can grant to an agent. Admins hold all of them.
export const PERMISSIONS = ["products", "orders", "dashboard", "home"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  products: "المنتجات والفئات (إضافة وتعديل)",
  orders: "جميع الطلبات",
  dashboard: "لوحة التحكم",
  home: "محتوى الصفحة الرئيسية",
};

/** Form field name for each permission (mirrors the User columns). */
export const PERMISSION_FIELDS: Record<Permission, string> = {
  products: "canManageProducts",
  orders: "canManageOrders",
  dashboard: "canViewDashboard",
  home: "canManageHome",
};

export type Permissions = Record<Permission, boolean>;

/** Display code for an agent, e.g. AG-0007. */
export function agentCode(agentNumber: number | null | undefined): string {
  return agentNumber == null ? "—" : `AG-${String(agentNumber).padStart(4, "0")}`;
}
