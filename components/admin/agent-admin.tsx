"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, SelectField } from "@/components/field";
import { useToast } from "@/components/providers/toast";
import { CloseIcon, TrashIcon } from "@/components/icons";
import {
  saveAgentAction,
  toggleAgentActiveAction,
  deleteAgentAction,
} from "@/app/actions/agents";
import type { AdminState } from "@/app/actions/admin";
import { GOVERNORATES } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import {
  agentCode,
  PERMISSIONS,
  PERMISSION_FIELDS,
  PERMISSION_LABELS,
} from "@/lib/agent";

export type AgentRow = {
  id: string;
  name: string;
  phone: string;
  governorate: string;
  agentNumber: number | null;
  commissionPercent: number;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canViewDashboard: boolean;
  canManageHome: boolean;
  isActive: boolean;
};

export function AgentAdmin({ agents }: { agents: AgentRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<AgentRow | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [state, submit, pending] = useActionState<AdminState, FormData>(
    saveAgentAction,
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

  function startEdit(a: AgentRow) {
    setEditing(a);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      {/* Form */}
      <div className="xl:sticky xl:top-6 xl:h-fit">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl">
                {editing ? "تعديل المندوب" : "مندوب جديد"}
              </h2>
              {editing ? (
                <p className="text-xs text-muted">
                  الرقم <span className="ltr">{agentCode(editing.agentNumber)}</span>
                </p>
              ) : (
                <p className="text-xs text-muted">يُمنح رقماً تسلسلياً تلقائياً</p>
              )}
            </div>
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
              placeholder="اسم المندوب"
              defaultValue={editing?.name}
              error={state.fieldErrors?.name}
            />
            <Field
              label="رقم الهاتف (لتسجيل الدخول)"
              name="phone"
              type="tel"
              placeholder="07XXXXXXXXX"
              defaultValue={editing?.phone}
              error={state.fieldErrors?.phone}
            />
            <SelectField
              label="المحافظة"
              name="governorate"
              placeholder="اختر المحافظة"
              options={GOVERNORATES}
              defaultValue={editing?.governorate ?? ""}
              error={state.fieldErrors?.governorate}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={editing ? "كلمة مرور جديدة" : "كلمة المرور"}
                name="password"
                type="password"
                placeholder={editing ? "اتركه فارغاً للإبقاء" : "6 أحرف على الأقل"}
                autoComplete="new-password"
                error={state.fieldErrors?.password}
              />
              <Field
                label="النسبة من كل طلب (%)"
                name="commissionPercent"
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="0"
                defaultValue={editing?.commissionPercent ?? 0}
                error={state.fieldErrors?.commissionPercent}
              />
            </div>

            <fieldset>
              <legend className="field-label">الصلاحيات</legend>
              <div className="space-y-2 rounded-xl border border-border p-3">
                {PERMISSIONS.map((perm) => {
                  const field = PERMISSION_FIELDS[perm] as keyof AgentRow;
                  return (
                    <label key={perm} className="flex items-center gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        name={PERMISSION_FIELDS[perm]}
                        defaultChecked={editing ? Boolean(editing[field]) : false}
                        className="h-4 w-4 accent-[var(--brand)]"
                      />
                      {PERMISSION_LABELS[perm]}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex gap-2 pt-1">
              <button className="btn btn-primary flex-1" disabled={pending}>
                {pending ? "جارٍ الحفظ…" : editing ? "حفظ التغييرات" : "إضافة المندوب"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-outline"
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-serif text-xl">المندوبون</h2>
          <span className="badge">{formatNumber(agents.length)} مندوب</span>
        </div>
        {agents.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            لا يوجد مندوبون بعد. استخدم النموذج لإضافة أول مندوب.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">الرقم</th>
                  <th className="px-5 py-3 font-medium">المندوب</th>
                  <th className="px-5 py-3 font-medium">النسبة</th>
                  <th className="px-5 py-3 font-medium">الصلاحيات</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                  <th className="px-5 py-3 text-end font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agents.map((a) => {
                  const granted = PERMISSIONS.filter((p) =>
                    Boolean(a[PERMISSION_FIELDS[p] as keyof AgentRow]),
                  );
                  return (
                    <tr key={a.id} className={`hover:bg-surface-2/60 ${a.isActive ? "" : "opacity-60"}`}>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs">{agentCode(a.agentNumber)}</td>
                      <td className="px-5 py-3">
                        <p className="whitespace-nowrap font-medium">{a.name}</p>
                        <p className="ltr text-start text-xs text-muted">{a.phone}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-medium">
                        {formatNumber(a.commissionPercent)}%
                      </td>
                      <td className="px-5 py-3">
                        {granted.length === 0 ? (
                          <span className="text-xs text-muted">بلا صلاحيات</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {granted.map((p) => (
                              <span key={p} className="badge">
                                {PERMISSION_LABELS[p].split(" (")[0]}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            a.isActive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                          }`}
                        >
                          {a.isActive ? "نشط" : "موقوف"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => startEdit(a)} className="btn btn-outline btn-sm">
                            تعديل
                          </button>
                          <form action={toggleAgentActiveAction}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="active" value={a.isActive ? "0" : "1"} />
                            <button className="btn btn-ghost btn-sm">
                              {a.isActive ? "إيقاف" : "تفعيل"}
                            </button>
                          </form>
                          <form action={deleteAgentAction}>
                            <input type="hidden" name="id" value={a.id} />
                            <button
                              className="btn-ghost grid h-9 w-9 place-items-center rounded-full text-muted hover:text-danger"
                              aria-label={`حذف ${a.name}`}
                            >
                              <TrashIcon width={17} height={17} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
