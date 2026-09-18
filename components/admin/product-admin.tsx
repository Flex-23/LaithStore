"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SmartImage } from "@/components/smart-image";
import { Field, TextareaField } from "@/components/field";
import { MoneyInput } from "@/components/money-input";
import { ImagePicker } from "@/components/admin/image-picker";
import { useToast } from "@/components/providers/toast";
import { CloseIcon, TrashIcon } from "@/components/icons";
import {
  saveProductAction,
  deleteProductAction,
  type AdminState,
} from "@/app/actions/admin";
import { formatNumber, formatPrice } from "@/lib/format";
import { CURRENCY } from "@/lib/constants";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice: number | null;
  isDiscounted: boolean;
  image: string;
  stockQuantity: number;
  categoryId: string;
  category: { name: string };
};

type Category = { id: string; name: string };

export function ProductAdmin({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Product | null>(null);
  const [discountOn, setDiscountOn] = useState(false);
  // Bumped after every successful save so the form (and the image picker's
  // internal state) remounts clean.
  const [formVersion, setFormVersion] = useState(0);
  const [state, submit, pending] = useActionState<AdminState, FormData>(
    saveProductAction,
    {},
  );

  useEffect(() => {
    if (state.success) {
      toast(state.success);
      router.refresh();
      setEditing(null);
      setDiscountOn(false);
      setFormVersion((v) => v + 1);
    } else if (state.error) {
      toast(state.error, "error");
    }
  }, [state, router, toast]);

  function startEdit(p: Product) {
    setEditing(p);
    setDiscountOn(p.isDiscounted);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setDiscountOn(false);
  }

  const formKey = `${editing?.id ?? "new"}-${formVersion}`;
  const noCategories = categories.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Form */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl">
              {editing ? "تعديل المنتج" : "منتج جديد"}
            </h2>
            {editing && (
              <button
                onClick={cancelEdit}
                className="btn-ghost grid h-8 w-8 place-items-center rounded-full text-muted"
                aria-label="إلغاء التعديل"
              >
                <CloseIcon width={17} height={17} />
              </button>
            )}
          </div>

          {noCategories ? (
            <p className="mt-4 text-sm text-muted">
              أنشئ فئة أولاً قبل إضافة المنتجات.
            </p>
          ) : (
            <form key={formKey} action={submit} className="mt-5 space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <Field
                label="الاسم"
                name="name"
                placeholder="اسم المنتج"
                defaultValue={editing?.name}
                error={state.fieldErrors?.name}
              />
              {/* Category select (value = id) */}
              <div>
                <label className="field-label" htmlFor="categoryId">
                  الفئة
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className="field-input"
                  defaultValue={editing?.categoryId ?? ""}
                >
                  <option value="" disabled>
                    اختر الفئة
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.categoryId && (
                  <p className="field-error">{state.fieldErrors.categoryId}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MoneyInput
                  label={`السعر (${CURRENCY})`}
                  name="price"
                  placeholder="25,000"
                  defaultValue={editing?.price}
                  error={state.fieldErrors?.price}
                />
                <Field
                  label="المخزون"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  defaultValue={editing?.stockQuantity}
                  error={state.fieldErrors?.stockQuantity}
                />
              </div>

              <ImagePicker
                label="صورة المنتج"
                defaultValue={editing?.image}
                error={state.fieldErrors?.image}
              />

              <TextareaField
                label="الوصف"
                name="description"
                rows={3}
                placeholder="وصف مختصر"
                defaultValue={editing?.description}
                error={state.fieldErrors?.description}
              />

              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="isDiscounted"
                  checked={discountOn}
                  onChange={(e) => setDiscountOn(e.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                تفعيل الخصم
              </label>

              {discountOn && (
                <MoneyInput
                  label={`السعر بعد الخصم (${CURRENCY})`}
                  name="discountedPrice"
                  placeholder="20,000"
                  defaultValue={editing?.discountedPrice}
                  error={state.fieldErrors?.discountedPrice}
                />
              )}

              <div className="flex gap-2 pt-1">
                <button className="btn btn-primary flex-1" disabled={pending}>
                  {pending
                    ? "جارٍ الحفظ…"
                    : editing
                      ? "حفظ التغييرات"
                      : "إضافة المنتج"}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn btn-outline"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-serif text-xl">المخزون</h2>
          <span className="badge">{formatNumber(products.length)} منتج</span>
        </div>
        {products.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            لا توجد منتجات بعد. استخدم النموذج لإضافة أول منتج.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-start text-xs text-muted">
                  <th className="px-5 py-3 font-medium">المنتج</th>
                  <th className="px-5 py-3 font-medium">السعر</th>
                  <th className="px-5 py-3 font-medium">المخزون</th>
                  <th className="px-5 py-3 text-end font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-2/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <SmartImage
                          src={p.image}
                          alt={p.name}
                          sizes="48px"
                          className="h-12 w-12 shrink-0 rounded-lg border border-border"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-muted">{p.category.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      {p.isDiscounted && p.discountedPrice != null ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-brand">
                            {formatPrice(p.discountedPrice)}
                          </span>
                          <span className="text-xs text-muted line-through">
                            {formatPrice(p.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium">{formatPrice(p.price)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          p.stockQuantity <= 5
                            ? "font-semibold text-danger"
                            : p.stockQuantity <= 10
                              ? "font-semibold text-brand-strong"
                              : ""
                        }
                      >
                        {formatNumber(p.stockQuantity)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(p)}
                          className="btn btn-outline btn-sm"
                        >
                          تعديل
                        </button>
                        <form action={deleteProductAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            className="btn-icon btn-icon-danger"
                            aria-label={`حذف ${p.name}`}
                          >
                            <TrashIcon width={17} height={17} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
