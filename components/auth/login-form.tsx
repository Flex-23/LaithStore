"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthState } from "@/app/actions/auth";
import { Field } from "@/components/field";

/** Customer sign-in form. Admins use /admin/login instead. */
export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    loginAction,
    {},
  );
  const registerHref = next
    ? `/register?next=${encodeURIComponent(next)}`
    : "/register";

  return (
    <div className="animate-fade-up">
      <span className="eyebrow">أهلاً بعودتك</span>
      <h1 className="mt-3 text-4xl">تسجيل الدخول</h1>
      <p className="mt-2 text-muted">
        جديد هنا؟{" "}
        <Link href={registerHref} className="font-medium text-brand hover:underline">
          أنشئ حساباً
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
          label="رقم الهاتف"
          name="phone"
          type="tel"
          placeholder="07XXXXXXXXX"
          autoComplete="tel"
          error={state.fieldErrors?.phone}
        />
        <Field
          label="كلمة المرور"
          name="password"
          type="password"
          placeholder="كلمة المرور"
          autoComplete="current-password"
          error={state.fieldErrors?.password}
        />
        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
        </button>
      </form>
    </div>
  );
}
