"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { adminLogoutAction } from "@/app/actions/auth";
import { agentCode, type Permission, type Permissions } from "@/lib/agent";
import {
  ArrowRightIcon,
  ChartIcon,
  HomeIcon,
  LayersIcon,
  LogoutIcon,
  PackageIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof LayersIcon;
  /** Permission needed (agents); omit for admin-only entries. */
  permission?: Permission;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "لوحة التحكم", Icon: LayersIcon, permission: "dashboard" },
  { href: "/admin/orders", label: "الطلبات", Icon: TruckIcon, permission: "orders" },
  { href: "/admin/products", label: "المنتجات", Icon: PackageIcon, permission: "products" },
  { href: "/admin/categories", label: "الفئات", Icon: TagIcon, permission: "products" },
  { href: "/admin/home", label: "الصفحة الرئيسية", Icon: HomeIcon, permission: "home" },
  { href: "/admin/reports", label: "التقارير", Icon: ChartIcon, adminOnly: true },
  { href: "/admin/agents", label: "المندوبون", Icon: UsersIcon, adminOnly: true },
  { href: "/admin/agents/reports", label: "تقارير المندوبين", Icon: ChartIcon, adminOnly: true },
  { href: "/admin/expenses", label: "الصرفيات", Icon: WalletIcon, adminOnly: true },
];

export function AdminSidebar({
  name,
  role,
  agentNumber,
  permissions,
}: {
  name: string;
  role: Role;
  agentNumber: number | null;
  permissions: Permissions;
}) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";
  const items = NAV.filter((item) =>
    item.adminOnly ? isAdmin : item.permission ? permissions[item.permission] : true,
  );

  return (
    <aside className="flex flex-col border-b border-border bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-e">
      <div className="flex items-center justify-between p-4 lg:p-6">
        <Link href="/admin" className="flex items-center gap-2" aria-label="لوحة الإدارة">
          <Logo size="sm" />
          <span className="badge">الإدارة</span>
        </Link>
        <Link
          href="/"
          className="btn btn-outline btn-sm lg:hidden"
        >
          المتجر
        </Link>
      </div>

      <nav className="hide-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-2 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-4 lg:pb-0">
        {items.map(({ href, label, Icon }) => {
          // Exact match first so /admin/agents doesn't light up for /admin/agents/reports.
          const active =
            pathname === href ||
            (pathname.startsWith(href + "/") &&
              !items.some((o) => o.href !== href && o.href.startsWith(href + "/") && pathname.startsWith(o.href)));
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand text-white shadow-[0_8px_20px_-10px_var(--ring)]"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <Icon width={18} height={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-border p-4 lg:block">
        <Link
          href="/"
          className="mb-2 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <ArrowRightIcon width={16} height={16} className="rotate-180" />
          عرض المتجر
        </Link>
        <div className="rounded-xl surface-2 p-3">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted">
            {isAdmin ? "مدير" : (
              <>
                مندوب · <span className="ltr">{agentCode(agentNumber)}</span>
              </>
            )}
          </p>
          <form action={adminLogoutAction} className="mt-2">
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-danger hover:bg-surface">
              <LogoutIcon width={16} height={16} /> تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
