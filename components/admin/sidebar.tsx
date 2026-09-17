"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogoutAction } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/constants";
import {
  ArrowRightIcon,
  ChartIcon,
  LayersIcon,
  LogoutIcon,
  PackageIcon,
  TagIcon,
  TruckIcon,
} from "@/components/icons";

const NAV = [
  { href: "/admin/dashboard", label: "لوحة التحكم", Icon: LayersIcon },
  { href: "/admin/products", label: "المنتجات", Icon: PackageIcon },
  { href: "/admin/categories", label: "الفئات", Icon: TagIcon },
  { href: "/admin/orders", label: "الطلبات", Icon: TruckIcon },
  { href: "/admin/reports", label: "التقارير", Icon: ChartIcon },
];

export function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col border-b border-border bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-e">
      <div className="flex items-center justify-between p-4 lg:p-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background font-serif text-lg">
            ل
          </span>
          <div className="leading-tight">
            <p className="font-serif text-lg">{APP_NAME}</p>
            <p className="text-[11px] text-muted">الإدارة</p>
          </div>
        </Link>
        <Link
          href="/"
          className="btn btn-outline btn-sm lg:hidden"
        >
          المتجر
        </Link>
      </div>

      <nav className="hide-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-2 lg:flex-1 lg:flex-col lg:px-4 lg:pb-0">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-foreground text-background"
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
          <p className="text-xs text-muted">مدير</p>
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
