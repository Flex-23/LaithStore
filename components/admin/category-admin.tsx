"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SmartImage } from "@/components/smart-image";
import { Field, TextareaField } from "@/components/field";
import { ImagePicker } from "@/components/admin/image-picker";
import { useToast } from "@/components/providers/toast";
import { CloseIcon, TrashIcon } from "@/components/icons";
import {
  saveCategoryAction,
  deleteCategoryAction,
  type AdminState,
} from "@/app/actions/admin";
import { formatNumber } from "@/lib/format";

type Category = {
  id: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
};

export function CategoryAdmin({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  // Bumped after every successful save so the form (and the image picker's
  // internal state) remounts clean.
  const [formVersion, setFormVersion] = useState(0);
  const [state, submit, pending] = useActionState<AdminState, FormData>(
    saveCategoryAction,
    {},
  );

  useEffect(() => {
    if (state.success) {
      toast(state.success);
      router.refresh();
      setEditing(null);
      setFormVersion((v) => v + 1);
    } else if (state.error) {
      toast(state.error, "error");
    }
  }, [state, router, toast]);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Form */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl">
              {editing ? "تعديل الفئة" : "فئة جديدة"}
            </h2>
            {editing && (
              <button
                onClick={() => setEditing(null)}
                className="btn-ghost grid h-8 w-8 place-items-center rounded-full text-muted"
                aria-label="إلغاء التعديل"
              >
                <CloseIcon width={17} height={17} />
              </button>
            )}
          </div>

          <form
            key={`${editing?.id ?? "new"}-${formVersion}`}
            action={submit}
            className="mt-5 space-y-4"
          >
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field
              label="الاسم"
              name="name"
              placeholder="اسم الفئة"
              defaultValue={editing?.name}
              error={state.fieldErrors?.name}
            />
            <TextareaField
              label="الوصف"
              name="description"
              rows={3}
              placeholder="وصف مختصر"
              defaultValue={editing?.description}
              error={state.fieldErrors?.description}
            />
            <ImagePicker
              label="صورة الفئة"
              defaultValue={editing?.image}
              error={state.fieldErrors?.image}
            />
            <button className="btn btn-primary w-full" disabled={pending}>
              {pending
                ? "جارٍ الحفظ…"
                : editing
                  ? "حفظ التغييرات"
                  : "إضافة الفئة"}
            </button>
          </form>
        </div>
      </div>

      {/* List */}
      <div>
        {categories.length === 0 ? (
          <div className="card px-6 py-12 text-center text-sm text-muted">
            لا توجد فئات بعد. أنشئ أول فئة.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((c) => (
              <div key={c.id} className="card overflow-hidden">
                <div className="relative">
                  <SmartImage
                    src={c.image}
                    alt={c.name}
                    sizes="(max-width:640px) 100vw, 33vw"
                    className="h-36 w-full"
                  />
                  <span className="absolute inset-e-3 top-3 badge bg-black/50 text-white">
                    {formatNumber(c.productCount)} منتج
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-lg">{c.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {c.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => setEditing(c)}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      تعديل
                    </button>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        className="btn-ghost grid h-9 w-9 place-items-center rounded-full text-muted hover:text-danger"
                        aria-label={`حذف ${c.name}`}
                      >
                        <TrashIcon width={17} height={17} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
