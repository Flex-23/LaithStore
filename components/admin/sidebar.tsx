"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { adminLogoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { agentCode, type Permission, type Permissions } from "@/lib/agent";
import {
  ArrowRightIcon,
  ChartIcon,
  CloseIcon,
  HomeIcon,
  LayersIcon,
  LogoutIcon,
  MenuIcon,
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
  /** Admin and accounts staff. */
  accountsOnly?: boolean;
  /** Shown to entry employees (agents) only. */
  agentOnly?: boolean;
  /** Shown to the follow-up employee only. */
  followOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin/new-order", label: "تسجيل الطلب", Icon: PackageIcon, agentOnly: true },
  { href: "/admin/my-orders", label: "الطلبات", Icon: TruckIcon, agentOnly: true },
  { href: "/admin/my-accounts", label: "الحسابات", Icon: WalletIcon, agentOnly: true },
  { href: "/admin/follow-up", label: "متابعة الطلبات", Icon: TruckIcon, followOnly: true },
  { href: "/admin/dashboard", label: "لوحة التحكم", Icon: LayersIcon, permission: "dashboard" },
  { href: "/admin/orders", label: "الطلبات", Icon: TruckIcon, permission: "orders" },
  { href: "/admin/products", label: "المنتجات", Icon: PackageIcon, permission: "products" },
  { href: "/admin/categories", label: "الفئات", Icon: TagIcon, permission: "products" },
  { href: "/admin/home", label: "الصفحة الرئيسية", Icon: HomeIcon, permission: "home" },
  { href: "/admin/statements", label: "كشف حساب مندوب", Icon: WalletIcon, accountsOnly: true },
  { href: "/admin/reports", label: "التقارير", Icon: ChartIcon, accountsOnly: true },
  { href: "/admin/agents", label: "الموظفون", Icon: UsersIcon, adminOnly: true },
  { href: "/admin/agents/reports", label: "تقارير المندوبين", Icon: ChartIcon, accountsOnly: true },
  { href: "/admin/expenses", label: "الصرفيات", Icon: WalletIcon, accountsOnly: true },
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
    item.agentOnly
      ? role === "AGENT"
      : item.followOnly
        ? role === "FOLLOWUP"
        : item.accountsOnly
          ? isAdmin || role === "ACCOUNTANT"
          : item.adminOnly
        ? isAdmin
        : item.permission
          ? permissions[item.permission]
          : true,
  );
  // The drawer counts as open only on the page it was opened from, so
  // navigating closes it without needing an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const drawerOpen = openAt === pathname;

  // Exact match first so /admin/agents doesn't light up for /admin/agents/reports.
  const isActive = (href: string) =>
    pathname === href ||
    (pathname.startsWith(href + "/") &&
      !items.some((o) => o.href !== href && o.href.startsWith(href + "/") && pathname.startsWith(o.href)));

  const roleLabel = isAdmin ? (
    "مدير"
  ) : role === "ACCOUNTANT" ? (
    <>
      موظف حسابات · <span className="ltr">{agentCode(agentNumber)}</span>
    </>
  ) : role === "FOLLOWUP" ? (
    <>
      موظف متابعة · <span className="ltr">{agentCode(agentNumber)}</span>
    </>
  ) : (
    <>
      موظف إدخال · <span className="ltr">{agentCode(agentNumber)}</span>
    </>
  );

  const navLinks = items.map(({ href, label, Icon }) => (
    <Link
      key={href}
      href={href}
      className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors lg:py-2.5 ${
        isActive(href)
          ? "bg-brand text-white shadow-[0_8px_20px_-10px_var(--ring)]"
          : "text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      <Icon width={18} height={18} />
      {label}
    </Link>
  ));

  return (
    <>
      {/* ---------------------------------------------------- Phone: top bar */}
      <header className="glass sticky top-0 z-40 flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2" aria-label="لوحة الإدارة">
          <Logo size="sm" />
          <span className="badge">{isAdmin ? "الإدارة" : role === "FOLLOWUP" ? "المتابعة" : role === "ACCOUNTANT" ? "الحسابات" : "الإدخال"}</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setOpenAt(pathname)}
              className="btn-icon !h-10 !w-10"
              aria-label="القائمة"
              aria-expanded={drawerOpen}
            >
              <MenuIcon width={20} height={20} />
            </button>
          ) : (
            <form action={adminLogoutAction}>
              <button className="btn-icon !h-10 !w-10 text-danger" aria-label="تسجيل الخروج" title="تسجيل الخروج">
                <LogoutIcon width={18} height={18} />
              </button>
            </form>
          )}
        </div>
      </header>

      {/* Phone: slide-in menu for the admin's many pages */}
      {isAdmin && drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="القائمة">
          <button
            type="button"
            className="animate-fade-in absolute inset-0 bg-black/50"
            onClick={() => setOpenAt(null)}
            aria-label="إغلاق"
          />
          <div className="animate-fade-in absolute inset-y-0 start-0 flex w-[82%] max-w-xs flex-col bg-surface shadow-2xl">
            <div className="flex items-center justify-between p-4">
              <p className="font-serif text-lg">القائمة</p>
              <button type="button" className="btn-icon" onClick={() => setOpenAt(null)} aria-label="إغلاق">
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">{navLinks}</nav>
            <div className="space-y-2 border-t border-border p-4">
              <Link href="/" className="flex items-center gap-2 text-sm text-muted">
                <ArrowRightIcon width={16} height={16} className="rotate-180" /> عرض المتجر
              </Link>
              <div className="rounded-xl surface-2 p-3">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-xs text-muted">{roleLabel}</p>
                <form action={adminLogoutAction} className="mt-2">
                  <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-danger hover:bg-surface">
                    <LogoutIcon width={16} height={16} /> تسجيل الخروج
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------- Phone: bottom tabs (agents' 3 pages) */}
      {!isAdmin && items.length > 1 && (
        <nav
          className="glass fixed inset-x-0 bottom-0 z-40 grid border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          aria-label="التنقل"
        >
          {items.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive(href) ? "text-brand" : "text-muted"
              }`}
            >
              <span
                className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${
                  isActive(href) ? "bg-brand-soft" : ""
                }`}
              >
                <Icon width={20} height={20} />
              </span>
              {label}
            </Link>
          ))}
        </nav>
      )}

      {/* -------------------------------------------------- Desktop: sidebar */}
      <aside className="hidden flex-col border-e border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="flex items-center justify-between p-6">
          <Link href="/admin" className="flex items-center gap-2" aria-label="لوحة الإدارة">
            <Logo size="sm" />
            <span className="badge">الإدارة</span>
          </Link>
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto px-4">{navLinks}</nav>

        <div className="border-t border-border p-4">
          <Link
            href="/"
            className="mb-2 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <ArrowRightIcon width={16} height={16} className="rotate-180" />
            عرض المتجر
          </Link>
          <div className="rounded-xl surface-2 p-3">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-xs text-muted">{roleLabel}</p>
            <form action={adminLogoutAction} className="mt-2">
              <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-danger hover:bg-surface">
                <LogoutIcon width={16} height={16} /> تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
