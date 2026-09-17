"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/constants";
import { useCart } from "./providers/cart-context";
import { ThemeToggle } from "./theme-toggle";
import {
  CartIcon,
  ChevronDownIcon,
  CloseIcon,
  LayersIcon,
  LogoutIcon,
  MenuIcon,
  PackageIcon,
  UserIcon,
} from "./icons";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المتجر" },
];

export function Navbar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-border" : "border-b border-transparent"
      }`}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
        {/* Start: logo + links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background font-serif text-lg">
              ل
            </span>
            <span className="font-serif text-xl">{APP_NAME}</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`link-underline text-sm font-medium transition-colors ${
                  pathname === l.href ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* End: actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:grid" />

          {user ? (
            <>
              {/* Only customers shop; admins just get the profile menu. */}
              {user.role === "USER" && (
                <button
                  onClick={openCart}
                  className="btn-ghost relative grid h-10 w-10 place-items-center rounded-full border border-border"
                  aria-label="فتح السلة"
                >
                  <CartIcon width={19} height={19} />
                  {count > 0 && (
                    <span className="animate-scale-in absolute -inset-e-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                      {count}
                    </span>
                  )}
                </button>
              )}

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="btn-ghost flex h-10 items-center gap-1.5 rounded-full border border-border ps-1.5 pe-2.5"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-brand">
                    <UserIcon width={16} height={16} />
                  </span>
                  <ChevronDownIcon
                    width={15}
                    height={15}
                    className={`text-muted transition-transform ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    className="animate-scale-in absolute inset-e-0 mt-2 w-60 origin-top overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]"
                  >
                    <div className="border-b border-border px-4 py-3">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {user.role === "ADMIN" ? "مدير" : "عضو"}
                      </p>
                    </div>
                    <div className="p-1.5">
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
                        >
                          <LayersIcon width={17} height={17} /> لوحة التحكم
                        </Link>
                      )}
                      <Link
                        href="/products"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
                      >
                        <PackageIcon width={17} height={17} /> متابعة التسوق
                      </Link>
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger hover:bg-surface-2"
                        >
                          <LogoutIcon width={17} height={17} /> تسجيل الخروج
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn btn-ghost btn-sm">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                إنشاء حساب
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="btn-ghost grid h-10 w-10 place-items-center rounded-full border border-border md:hidden"
            aria-label="القائمة"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="animate-fade-in border-t border-border bg-surface md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface-2"
              >
                {l.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {user ? (
              <form action={logoutAction}>
                <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-danger hover:bg-surface-2">
                  <LogoutIcon width={17} height={17} /> تسجيل الخروج
                </button>
              </form>
            ) : (
              <div className="flex gap-2 px-1">
                <Link href="/login" className="btn btn-outline btn-sm flex-1">
                  تسجيل الدخول
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm flex-1">
                  إنشاء حساب
                </Link>
              </div>
            )}
            <div className="flex items-center justify-between px-3 pt-2">
              <span className="text-sm text-muted">المظهر</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
