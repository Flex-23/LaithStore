"use client";

import Link from "next/link";
import { useCart } from "./providers/cart-context";
import { SmartImage } from "./smart-image";
import {
  ArrowRightIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
} from "./icons";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from "@/lib/constants";

export function CartView() {
  const { items, subtotal, updateQty, removeItem, ready } = useCart();

  if (!ready) {
    return (
      <div className="container-page py-16">
        <div className="shimmer h-64 rounded-2xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
          <h1 className="text-3xl">سلتك فارغة</h1>
          <p className="text-muted">يبدو أنك لم تضف أي شيء بعد.</p>
          <Link href="/products" className="btn btn-brand">
            ابدأ التسوق <ArrowRightIcon width={18} height={18} />
          </Link>
        </div>
      </div>
    );
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;
  const toFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="container-page py-12 lg:py-16">
      <h1 className="text-4xl">سلة التسوق</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex gap-5 py-6 first:pt-0">
              <SmartImage
                src={item.image}
                alt={item.name}
                sizes="112px"
                className="h-32 w-28 shrink-0 rounded-xl border border-border"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-lg leading-tight">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {formatPrice(item.price)} للقطعة
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="btn-icon btn-icon-danger"
                    aria-label={`إزالة ${item.name}`}
                  >
                    <TrashIcon width={17} height={17} />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center rounded-full border border-border-strong">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="grid h-9 w-9 place-items-center rounded-full text-muted hover:text-foreground"
                      aria-label="تقليل"
                    >
                      <MinusIcon width={16} height={16} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="grid h-9 w-9 place-items-center rounded-full text-muted hover:text-foreground disabled:opacity-40"
                      aria-label="زيادة"
                    >
                      <PlusIcon width={16} height={16} />
                    </button>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="card p-6">
            <h2 className="font-serif text-xl">ملخص الطلب</h2>
            {toFree > 0 ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-sm text-brand-strong">
                <TruckIcon width={17} height={17} />
                <span>أضف {formatPrice(toFree)} للحصول على توصيل مجاني</span>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-sm text-brand-strong">
                <TruckIcon width={17} height={17} />
                <span>حصلت على توصيل مجاني</span>
              </div>
            )}
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">المجموع الفرعي</dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">التوصيل</dt>
                <dd className="font-medium">
                  {shipping === 0 ? "مجاني" : formatPrice(shipping)}
                </dd>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-serif text-lg">الإجمالي</dt>
                <dd className="font-serif text-lg">{formatPrice(total)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn btn-brand mt-6 w-full">
              إتمام الطلب <ArrowRightIcon width={18} height={18} />
            </Link>
            <Link
              href="/products"
              className="btn btn-ghost mt-2 w-full text-muted"
            >
              متابعة التسوق
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
