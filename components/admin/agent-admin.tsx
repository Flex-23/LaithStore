"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, SelectField } from "@/components/field";
import { MoneyInput } from "@/components/money-input";
import { useToast } from "@/components/providers/toast";
import {
  CloseIcon,
  EditIcon,
  EyeIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
} from "@/components/icons";
import {
  saveAgentAction,
  toggleAgentActiveAction,
  deleteAgentAction,
} from "@/app/actions/agents";
import type { AdminState } from "@/app/actions/admin";
import type { AgentRecord } from "@/lib/data";
import { CURRENCY, GOVERNORATES } from "@/lib/constants";
import { formatNumber, formatPrice } from "@/lib/format";
import {
  agentCode,
  STAFF_ROLES,
  STAFF_ROLE_LABELS,
  isStaffRole,
  type StaffRole,
} from "@/lib/agent";

type AgentRow = AgentRecord;

export function AgentAdmin({ agents }: { agents: AgentRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<AgentRow | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  // Job title drives which fields apply (only entry staff earn a per-order fee).
  const [role, setRole] = useState<StaffRole>("AGENT");
  const [state, submit, pending] = useActionState<AdminState, FormData>(
    saveAgentAction,
    {},
  );

  useEffect(() => {
    if (state.success) {
      toast(state.success);
      router.refresh();
      setEditing(null);
      setRole("AGENT");
      setFormVersion((v) => v + 1);
    } else if (state.error) {
      toast(state.error, "error");
    }
  }, [state, router, toast]);

  function startEdit(a: AgentRow) {
    setEditing(a);
    setRole(isStaffRole(a.role) ? a.role : "AGENT");
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
                {editing ? "تعديل الموظف" : "موظف جديد"}
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
            <div>
              <label className="field-label" htmlFor="role">
                المسمى الوظيفي
              </label>
              <select
                id="role"
                name="role"
                className="field-input"
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {STAFF_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                {role === "AGENT"
                  ? "يجهّز الطلبات ويسجلها فقط، ويُحتسب له أجر عن كل طلب."
                  : role === "FOLLOWUP"
                    ? "يتابع جميع الطلبات ويغيّر حالتها، بدون ظهور أي مبالغ."
                    : "يرى كل الصفحات المالية (التقارير، الصرفيات) ويُصدر كشوفات المندوبين PDF."}
              </p>
            </div>
            <Field
              label="الاسم"
              name="name"
              placeholder="اسم الموظف"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={editing ? "كلمة مرور جديدة" : "كلمة المرور"}
                name="password"
                type="password"
                placeholder={editing ? "اتركه فارغاً للإبقاء" : "6 أحرف على الأقل"}
                autoComplete="new-password"
                error={state.fieldErrors?.password}
              />
              {role === "AGENT" && (
                <MoneyInput
                  label={`الأجر لكل طلب (${CURRENCY})`}
                  name="commissionPerOrder"
                  placeholder="2,000"
                  defaultValue={editing?.commissionPerOrder ?? 0}
                  hint="يُحتسب لكل طلب يُخرجه (تم الشحن أو التوصيل)"
                  error={state.fieldErrors?.commissionPerOrder}
                />
              )}
            </div>

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

      {/* List — essentials only; everything else lives on the detail page. */}
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
            <table className="table-cards w-full text-sm">
              {/* The actions column shrinks to one row of buttons (w-px = min
                  content); the four data columns share the remaining width equally. */}
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="w-1/5 px-4 py-3 font-medium">الاسم</th>
                  <th className="w-1/5 px-4 py-3 font-medium">المسمى</th>
                  <th className="w-1/5 px-4 py-3 font-medium">الرقم</th>
                  <th className="w-1/5 px-4 py-3 font-medium">الأجر لكل طلب</th>
                  <th className="w-1/5 px-4 py-3 font-medium">الحالة</th>
                  <th className="w-px whitespace-nowrap px-4 py-3 text-end font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agents.map((a) => (
                  <tr key={a.id} className={`hover:bg-surface-2/60 ${a.isActive ? "" : "opacity-60"}`}>
                    <td className="truncate px-4 py-3 font-medium">{a.name}</td>
                    {/* `font-mono` cells are LTR + end-aligned globally, so the code
                        sits flush with its RTL header. */}
                    <td className="px-4 py-3 text-sm">
                      {STAFF_ROLE_LABELS[isStaffRole(a.role) ? a.role : "AGENT"]}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{agentCode(a.agentNumber)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {a.role === "AGENT" ? formatPrice(a.commissionPerOrder) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          a.isActive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                        }`}
                      >
                        {a.isActive ? "نشط" : "موقوف"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {a.role === "AGENT" && (
                        <Link
                          href={`/admin/agents/${a.id}`}
                          className="btn btn-primary btn-sm"
                          title="عرض التفاصيل"
                        >
                          <EyeIcon width={15} height={15} /> تفاصيل
                        </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => startEdit(a)}
                          className="btn-icon"
                          title="تعديل"
                          aria-label={`تعديل ${a.name}`}
                        >
                          <EditIcon width={16} height={16} />
                        </button>
                        <form action={toggleAgentActiveAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="active" value={a.isActive ? "0" : "1"} />
                          <button
                            className="btn-icon"
                            title={a.isActive ? "إيقاف الحساب" : "تفعيل الحساب"}
                            aria-label={a.isActive ? `إيقاف ${a.name}` : `تفعيل ${a.name}`}
                          >
                            {a.isActive ? (
                              <PauseIcon width={16} height={16} />
                            ) : (
                              <PlayIcon width={14} height={14} />
                            )}
                          </button>
                        </form>
                        <form action={deleteAgentAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <button
                            className="btn-icon btn-icon-danger"
                            title="حذف"
                            aria-label={`حذف ${a.name}`}
                          >
                            <TrashIcon width={16} height={16} />
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
