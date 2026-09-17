"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./providers/cart-context";
import { useToast } from "./providers/toast";
import { SmartImage } from "./smart-image";
import { ArrowRightIcon, CheckIcon, UserIcon } from "./icons";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from "@/lib/constants";
import { placeOrder } from "@/app/actions/orders";

type Profile = { name: string; phone: string; governorate: string };

export function CheckoutForm({ profile }: { profile: Profile | null }) {
  const { items, subtotal, clear, ready } = useCart();
  const { toast } = useToast();
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<{ orderId: string; total: number } | null>(
    null,
  );

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  async function handlePlace() {
    if (!items.length || placing) return;
    setPlacing(true);
    const res = await placeOrder(
      items.map((i) => ({ productId: i.id, quantity: i.quantity })),
    );
    setPlacing(false);
    if (res.ok) {
      clear();
      setDone({ orderId: res.orderId, total: res.total });
      toast("تم إرسال طلبك بنجاح");
    } else {
      toast(res.error, "error");
    }
  }

  // --- Success ---
  if (done) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-5 text-center">
          <span className="animate-scale-in grid h-20 w-20 place-items-center rounded-full bg-success text-white">
            <CheckIcon width={38} height={38} />
          </span>
          <h1 className="text-4xl">شكراً لك</h1>
          <p className="text-muted">تم استلام طلبك وهو الآن قيد التجهيز.</p>
          <div className="card w-full p-5 text-start">
            <div className="flex justify-between text-sm">
              <span className="text-muted">رقم الطلب</span>
              <span className="font-mono font-medium">
                #{done.orderId.slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted">قيمة المنتجات</span>
              <span className="font-semibold">{formatPrice(done.total)}</span>
            </div>
          </div>
          <Link href="/products" className="btn btn-brand">
            متابعة التسوق <ArrowRightIcon width={18} height={18} />
          </Link>
        </div>
      </div>
    );
  }

  // --- Empty cart ---
  if (ready && items.length === 0) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
          <h1 className="text-3xl">لا يوجد ما تدفعه</h1>
          <p className="text-muted">سلتك فارغة.</p>
          <Link href="/products" className="btn btn-brand">
            تصفّح المنتجات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <h1 className="text-4xl">إتمام الطلب</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Delivery details from profile */}
        <div className="space-y-8">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">بيانات التوصيل</h2>
              <span className="badge">
                <UserIcon width={13} height={13} /> من ملفك الشخصي
              </span>
            </div>
            {profile ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail label="الاسم" value={profile.name} />
                <Detail label="الهاتف" value={profile.phone} ltr />
                <Detail label="المحافظة" value={profile.governorate} />
                <Detail label="طريقة الدفع" value="الدفع عند الاستلام" />
              </div>
            ) : (
              <p className="mt-4 text-sm text-danger">
                تعذّر تحميل ملفك الشخصي. يرجى تسجيل الدخول مجدداً.
              </p>
            )}
            <p className="mt-5 text-xs text-muted">
              تريد تعديل هذه البيانات؟ حدّث ملفك الشخصي قبل الطلب.
            </p>
          </section>

          {/* Review items */}
          <section className="card p-6">
            <h2 className="font-serif text-xl">مراجعة الطلب</h2>
            <div className="mt-5 divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <SmartImage
                    src={item.image}
                    alt={item.name}
                    sizes="64px"
                    className="h-16 w-14 shrink-0 rounded-lg border border-border"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted">
                      الكمية {item.quantity} · {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Summary + place order */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="card p-6">
            <h2 className="font-serif text-xl">الملخص</h2>
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
              <div className="mt-3 flex justify-between border-t border-border pt-3">
                <dt className="font-serif text-lg">الإجمالي</dt>
                <dd className="font-serif text-lg">{formatPrice(total)}</dd>
              </div>
            </dl>
            <button
              onClick={handlePlace}
              disabled={placing || !profile || items.length === 0}
              className="btn btn-brand mt-6 w-full"
            >
              {placing ? "جارٍ إرسال الطلب…" : "تأكيد الطلب"}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              بتأكيد الطلب فإنك توافق على شروط الاستخدام.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-xl surface-2 px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 font-medium ${ltr ? "ltr text-start" : ""}`}>{value}</p>
    </div>
  );
}
