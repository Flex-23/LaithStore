"use client";

import { useActionState } from "react";
import Link from "next/link";
import { adminLoginAction, type AuthState } from "@/app/actions/auth";
import { Field } from "@/components/field";
import { ShieldIcon } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    adminLoginAction,
    {},
  );

  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-6 py-10">
      <div className="grid-hero pointer-events-none fixed inset-0 opacity-40" />
      <div className="animate-fade-up relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-foreground text-background">
            <ShieldIcon width={26} height={26} />
          </span>
          <h1 className="mt-4 text-3xl">دخول الإدارة</h1>
          <p className="mt-1 text-sm text-muted">المدير والمندوبون · لوحة إدارة {APP_NAME}</p>
        </div>

        <div className="card p-6 sm:p-8">
          {state.error && (
            <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
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
              {pending ? "جارٍ التحقق…" : "دخول لوحة التحكم"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/" className="link-underline">
            العودة إلى المتجر
          </Link>
        </p>
      </div>
    </div>
  );
}
