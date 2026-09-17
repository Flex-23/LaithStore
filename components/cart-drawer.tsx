"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./providers/cart-context";
import { SmartImage } from "./smart-image";
import {
  ArrowRightIcon,
  CartIcon,
  CloseIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "./icons";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, updateQty, removeItem, count } =
    useCart();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-[90] ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      {/* Overlay */}
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel — slides in from the inline-end edge (left in RTL). */}
      <aside
        className={`absolute inset-e-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
        }`}
        role="dialog"
        aria-label="سلة التسوق"
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2">
            <CartIcon width={20} height={20} />
            <h2 className="font-serif text-xl">سلتك</h2>
            <span className="badge">{count}</span>
          </div>
          <button
            onClick={closeCart}
            className="btn-ghost grid h-9 w-9 place-items-center rounded-full"
            aria-label="إغلاق السلة"
          >
            <CloseIcon />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full surface-2 text-muted">
              <CartIcon width={26} height={26} />
            </div>
            <div>
              <p className="font-serif text-lg">سلتك فارغة</p>
              <p className="mt-1 text-sm text-muted">
                أضف شيئاً جميلاً لتبدأ.
              </p>
            </div>
            <button onClick={closeCart} className="btn btn-outline btn-sm">
              متابعة التسوق
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <SmartImage
                    src={item.image}
                    alt={item.name}
                    sizes="80px"
                    className="h-24 w-20 shrink-0 rounded-xl border border-border"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium leading-snug">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted transition-colors hover:text-danger"
                        aria-label={`إزالة ${item.name}`}
                      >
                        <TrashIcon width={16} height={16} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatPrice(item.price)}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border-strong">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-foreground"
                          aria-label="تقليل الكمية"
                        >
                          <MinusIcon width={15} height={15} />
                        </button>
                        <span className="w-7 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-foreground disabled:opacity-40"
                          aria-label="زيادة الكمية"
                        >
                          <PlusIcon width={15} height={15} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="border-t border-border px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted">المجموع الفرعي</span>
                <span className="font-serif text-xl">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mb-4 text-xs text-muted">
                تُحتسب تكلفة التوصيل عند إتمام الطلب.
              </p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn btn-brand w-full"
              >
                إتمام الطلب <ArrowRightIcon width={18} height={18} />
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
