import Link from "next/link";
import { SmartImage } from "./smart-image";
import { ProductCard, type ProductCardData } from "./product-card";
import { ArrowRightIcon, PackageIcon } from "./icons";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatNumber, formatPrice } from "@/lib/format";

export function SectionHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="mt-2 text-3xl sm:text-4xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-lg text-muted">{description}</p>
        )}
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="link-underline inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          {actionLabel} <ArrowRightIcon width={16} height={16} />
        </Link>
      )}
    </div>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 5} />
      ))}
    </div>
  );
}

export function CategoryTile({
  category,
}: {
  category: { id: string; name: string; image: string; count?: number };
}) {
  return (
    <Link
      href={`/category/${category.id}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-border"
    >
      <SmartImage
        src={category.image}
        alt={category.name}
        sizes="(max-width:768px) 50vw, 25vw"
        className="h-full w-full transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
        <div>
          <h3 className="font-serif text-lg">{category.name}</h3>
          {category.count != null && (
            <p className="text-xs text-white/75">
              {formatNumber(category.count)} منتج
            </p>
          )}
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5">
          <ArrowRightIcon width={17} height={17} />
        </span>
      </div>
    </Link>
  );
}

export function EmptyState({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full surface-2 text-muted">
        <PackageIcon width={28} height={28} />
      </div>
      <div>
        <h3 className="font-serif text-xl">{title}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">{message}</p>
      </div>
      {children}
    </div>
  );
}

/** Shown when the catalog is empty — usually means the DB isn't seeded yet. */
export function SetupNotice() {
  const steps: { text: string; code?: string }[] = [
    { text: "شغّل MySQL من لوحة تحكم XAMPP." },
    { text: "أنشئ المخطط:", code: "npm run db:push" },
    { text: "حمّل البيانات التجريبية:", code: "npm run db:seed" },
  ];
  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-2xl p-8">
        <span className="eyebrow">خطوة أخيرة</span>
        <h2 className="mt-3 text-2xl">لا توجد منتجات بعد</h2>
        <p className="mt-2 text-muted">
          اربط قاعدة البيانات وحمّل الكتالوج التجريبي لترى المتجر ينبض بالحياة.
        </p>
        <ol className="mt-6 space-y-3 text-sm">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-foreground">
                {step.text}{" "}
                {step.code && (
                  <code className="ltr rounded bg-surface-2 px-1.5 py-0.5 font-mono text-brand">
                    {step.code}
                  </code>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function TrustMarquee() {
  const items = [
    `توصيل مجاني للطلبات فوق ${formatPrice(FREE_SHIPPING_THRESHOLD)}`,
    "إرجاع خلال 30 يوماً",
    "الدفع عند الاستلام",
    "جودة مختارة بعناية",
    "توصيل سريع لكل المحافظات",
    "عروض حصرية للأعضاء",
  ];
  return (
    <div className="overflow-hidden border-y border-border bg-surface py-4">
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
        {[...items, ...items].map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-3 text-sm font-medium text-muted"
          >
            {t}
            <span className="text-accent">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
