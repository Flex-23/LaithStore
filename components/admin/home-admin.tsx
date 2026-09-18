"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, TextareaField } from "@/components/field";
import { ImagePicker } from "@/components/admin/image-picker";
import { useToast } from "@/components/providers/toast";
import { saveHomeContentAction } from "@/app/actions/home";
import type { AdminState } from "@/app/actions/admin";
import type { HomeContentData } from "@/lib/home-content";

export function HomeAdmin({ content }: { content: HomeContentData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, submit, pending] = useActionState<AdminState, FormData>(
    saveHomeContentAction,
    {},
  );

  useEffect(() => {
    if (state.success) {
      toast(state.success);
      router.refresh();
    } else if (state.error) {
      toast(state.error, "error");
    }
  }, [state, router, toast]);

  const err = state.fieldErrors ?? {};

  return (
    <form action={submit} className="grid gap-6 lg:grid-cols-2">
      {/* Hero */}
      <section className="card space-y-4 p-6">
        <div>
          <h2 className="font-serif text-xl">القسم الرئيسي (الهيرو)</h2>
          <p className="text-sm text-muted">أول ما يراه الزائر عند فتح المتجر.</p>
        </div>
        <Field
          label="السطر العلوي"
          name="heroEyebrow"
          defaultValue={content.heroEyebrow}
          error={err.heroEyebrow}
        />
        <TextareaField
          label="العنوان الرئيسي"
          name="heroTitle"
          rows={2}
          defaultValue={content.heroTitle}
          error={err.heroTitle}
        />
        <Field
          label="كلمة مميزة باللون الذهبي (اختياري)"
          name="heroHighlight"
          defaultValue={content.heroHighlight}
          hint="تُلوَّن أول كلمة مطابقة داخل العنوان"
          error={err.heroHighlight}
        />
        <TextareaField
          label="النص الفرعي"
          name="heroSubtitle"
          rows={3}
          defaultValue={content.heroSubtitle}
          error={err.heroSubtitle}
        />
        <Field
          label="نص الزر"
          name="heroCta"
          defaultValue={content.heroCta}
          error={err.heroCta}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ImagePicker
            label="الصورة الكبيرة"
            fieldName="heroImage1"
            defaultValue={content.heroImage1}
            error={err.heroImage1}
          />
          <ImagePicker
            label="الصورة الصغيرة"
            fieldName="heroImage2"
            defaultValue={content.heroImage2}
            error={err.heroImage2}
          />
        </div>
      </section>

      {/* Promo banner */}
      <section className="card space-y-4 p-6">
        <div>
          <h2 className="font-serif text-xl">البانر الترويجي</h2>
          <p className="text-sm text-muted">الشريط العريض أسفل المنتجات.</p>
        </div>
        <Field
          label="السطر العلوي"
          name="promoEyebrow"
          defaultValue={content.promoEyebrow}
          error={err.promoEyebrow}
        />
        <Field
          label="العنوان"
          name="promoTitle"
          defaultValue={content.promoTitle}
          error={err.promoTitle}
        />
        <TextareaField
          label="النص"
          name="promoText"
          rows={3}
          defaultValue={content.promoText}
          error={err.promoText}
        />
        <Field
          label="نص الزر"
          name="promoCta"
          defaultValue={content.promoCta}
          error={err.promoCta}
        />
        <ImagePicker
          label="صورة البانر"
          fieldName="promoImage"
          defaultValue={content.promoImage}
          error={err.promoImage}
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button className="btn btn-primary" disabled={pending}>
            {pending ? "جارٍ الحفظ…" : "حفظ التغييرات"}
          </button>
          <Link href="/" target="_blank" className="btn btn-outline">
            معاينة المتجر
          </Link>
        </div>
      </section>
    </form>
  );
}
