"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthState } from "@/app/actions/auth";
import { Field, SelectField } from "@/components/field";
import { GOVERNORATES } from "@/lib/constants";

/** Customer sign-up form. Admin accounts are never created from here. */
export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    registerAction,
    {},
  );
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <div className="animate-fade-up">
      <span className="eyebrow">انضم إلينا</span>
      <h1 className="mt-3 text-4xl">إنشاء حساب</h1>
      <p className="mt-2 text-muted">
        لديك حساب بالفعل؟{" "}
        <Link href={loginHref} className="font-medium text-brand hover:underline">
          سجّل الدخول
        </Link>
      </p>

      {state.error && (
        <div className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <form action={action} className="mt-6 space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <Field
          label="الاسم"
          name="name"
          placeholder="الاسم الكامل"
          autoComplete="name"
          error={state.fieldErrors?.name}
        />
        <Field
          label="رقم الهاتف"
          name="phone"
          type="tel"
          placeholder="07XXXXXXXXX"
          autoComplete="tel"
          error={state.fieldErrors?.phone}
        />
        <SelectField
          label="المحافظة"
          name="governorate"
          placeholder="اختر المحافظة"
          options={GOVERNORATES}
          error={state.fieldErrors?.governorate}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="كلمة المرور"
            name="password"
            type="password"
            placeholder="كلمة المرور"
            autoComplete="new-password"
            error={state.fieldErrors?.password}
          />
          <Field
            label="تأكيد كلمة المرور"
            name="confirmPassword"
            type="password"
            placeholder="التأكيد"
            autoComplete="new-password"
            error={state.fieldErrors?.confirmPassword}
          />
        </div>
        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "جارٍ إنشاء الحساب…" : "إنشاء حساب"}
        </button>
      </form>
    </div>
  );
}
