import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const columns = [
  {
    title: "المتجر",
    links: [
      { label: "كل المنتجات", href: "/products" },
      { label: "وصل حديثاً", href: "/products" },
      { label: "العروض", href: "/products" },
    ],
  },
  {
    title: "الحساب",
    links: [
      { label: "تسجيل الدخول", href: "/login" },
      { label: "إنشاء حساب", href: "/register" },
      { label: "سلة التسوق", href: "/cart" },
    ],
  },
  {
    title: "الشركة",
    links: [
      { label: "من نحن", href: "/" },
      { label: "اتصل بنا", href: "/" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background font-serif text-lg">
                ل
              </span>
              <span className="font-serif text-xl">{APP_NAME}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              منتجات مختارة بعناية لحياة أجمل — مصممة لتدوم، وتصلك بكل اهتمام.
            </p>
            <div className="mt-6 flex gap-2">
              {["الدفع عند الاستلام", "توصيل لكل المحافظات"].map((p) => (
                <span
                  key={p}
                  className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-serif text-sm font-semibold">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. جميع الحقوق محفوظة.
          </p>
          <p>صُنع بعناية.</p>
        </div>
      </div>
    </footer>
  );
}
