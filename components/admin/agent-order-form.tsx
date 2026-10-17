"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Field, SelectField, TextareaField } from "@/components/field";
import { MoneyInput } from "@/components/money-input";
import { useToast } from "@/components/providers/toast";
import { TrashIcon } from "@/components/icons";
import { registerAgentOrderAction } from "@/app/actions/agent-orders";
import type { AdminState } from "@/app/actions/admin";
import { CURRENCY, GOVERNORATES } from "@/lib/constants";
import { formatNumber, formatPrice } from "@/lib/format";

export type OrderProduct = {
  id: string;
  name: string;
  /** Price the customer pays (discount already applied). */
  price: number;
  stock: number;
  category: string;
};

type Line = { productId: string; quantity: number };

export function AgentOrderForm({
  products,
  companies,
}: {
  products: OrderProduct[];
  /** Previously used delivery companies, offered as suggestions. */
  companies: string[];
}) {
  const { toast } = useToast();
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState("");
  const [fee, setFee] = useState(0);
  const [state, submit, pending] = useActionState<AdminState, FormData>(
    registerAgentOrderAction,
    {},
  );

  useEffect(() => {
    if (state.error) toast(state.error, "error");
  }, [state, toast]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const available = products.filter((p) => !lines.some((l) => l.productId === p.id));
  const total = lines.reduce((n, l) => n + (byId.get(l.productId)?.price ?? 0) * l.quantity, 0);

  function addLine() {
    if (!pick) return;
    setLines((cur) => [...cur, { productId: pick, quantity: 1 }]);
    setPick("");
  }

  function setQty(productId: string, quantity: number) {
    const max = byId.get(productId)?.stock ?? 1;
    const q = Math.min(Math.max(1, Math.floor(quantity) || 1), max);
    setLines((cur) => cur.map((l) => (l.productId === productId ? { ...l, quantity: q } : l)));
  }

  return (
    <form action={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="items" value={JSON.stringify(lines)} />

      {/* 1. Products */}
      <section className="card h-fit p-6">
        <h2 className="font-serif text-xl">١. المنتجات</h2>

        <div className="mt-4 flex gap-2">
          <select
            className="field-input"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            aria-label="اختر منتجاً"
          >
            <option value="">اختر المنتج…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatPrice(p.price)} (متوفر {formatNumber(p.stock)})
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-outline" onClick={addLine} disabled={!pick}>
            إضافة
          </button>
        </div>
        {state.fieldErrors?.items && <p className="field-error">{state.fieldErrors.items}</p>}

        {lines.length === 0 ? (
          <p className="mt-6 rounded-xl surface-2 px-4 py-8 text-center text-sm text-muted">
            لم تضف أي منتج بعد.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {lines.map((l) => {
              const p = byId.get(l.productId)!;
              return (
                <li key={l.productId} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted">
                      {formatPrice(p.price)} للقطعة · المتوفر {formatNumber(p.stock)}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={p.stock}
                    value={l.quantity}
                    onChange={(e) => setQty(l.productId, Number(e.target.value))}
                    className="field-input !w-20 text-center"
                    aria-label={`الكمية: ${p.name}`}
                  />
                  <span className="w-28 text-end text-sm font-medium">
                    {formatPrice(p.price * l.quantity)}
                  </span>
                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-full text-danger hover:bg-surface-2"
                    onClick={() => setLines((cur) => cur.filter((x) => x.productId !== l.productId))}
                    aria-label={`حذف ${p.name}`}
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-muted">إجمالي المواد</span>
          <span className="font-medium">{formatPrice(total)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-muted">أجور النقل</span>
          <span className="font-medium">{formatPrice(fee)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <span className="font-medium">المبلغ الكلي</span>
          <span className="font-serif text-2xl">{formatPrice(total + fee)}</span>
        </div>
      </section>

      {/* 2 + 3. Customer + delivery company */}
      <section className="card h-fit space-y-4 p-6 lg:sticky lg:top-6">
        <h2 className="font-serif text-xl">٢. معلومات الزبون</h2>
        <Field
          label="اسم الزبون"
          name="customerName"
          error={state.fieldErrors?.customerName}
          autoComplete="off"
        />
        <Field
          label="رقم الهاتف"
          name="customerPhone"
          inputMode="numeric"
          dir="ltr"
          placeholder="07XXXXXXXXX"
          error={state.fieldErrors?.customerPhone}
          autoComplete="off"
        />
        <SelectField
          label="المحافظة"
          name="customerGovernorate"
          options={GOVERNORATES}
          placeholder="اختر المحافظة"
          error={state.fieldErrors?.customerGovernorate}
        />
        <TextareaField
          label="العنوان (اختياري)"
          name="customerAddress"
          rows={2}
          error={state.fieldErrors?.customerAddress}
        />

        <h2 className="pt-2 font-serif text-xl">٣. شركة التوصيل</h2>
        <Field
          label="شركة التوصيل"
          name="deliveryCompany"
          list="delivery-companies"
          error={state.fieldErrors?.deliveryCompany}
          autoComplete="off"
        />
        <MoneyInput
          label={`أجور النقل (${CURRENCY})`}
          name="deliveryFee"
          placeholder="5,000"
          onValueChange={setFee}
          error={state.fieldErrors?.deliveryFee}
        />
        <datalist id="delivery-companies">
          {companies.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <button className="btn btn-primary w-full" disabled={pending || lines.length === 0}>
          {pending ? "جارٍ التسجيل…" : "تم — تسجيل الطلب"}
        </button>
      </section>
    </form>
  );
}
