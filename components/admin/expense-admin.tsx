"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, TextareaField } from "@/components/field";
import { MoneyInput } from "@/components/money-input";
import { useToast } from "@/components/providers/toast";
import { TrashIcon } from "@/components/icons";
import { addExpenseAction, deleteExpenseAction } from "@/app/actions/expenses";
import type { AdminState } from "@/app/actions/admin";
import { CURRENCY } from "@/lib/constants";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { agentCode } from "@/lib/agent";
import type { ExpenseRecord } from "@/lib/data";

type AgentOption = { id: string; name: string; agentNumber: number | null };

const OTHER = "__other__";

export function ExpenseAdmin({
  agents,
  expenses,
  periodLabel,
}: {
  agents: AgentOption[];
  /** Expenses of the selected period only. */
  expenses: ExpenseRecord[];
  periodLabel: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [recipient, setRecipient] = useState<string>(agents[0]?.id ?? OTHER);
  const [formVersion, setFormVersion] = useState(0);
  const [state, submit, pending] = useActionState<AdminState, FormData>(
    addExpenseAction,
    {},
  );

  useEffect(() => {
    if (state.success) {
      toast(state.success);
      router.refresh();
      setFormVersion((v) => v + 1);
    } else if (state.error) {
      toast(state.error, "error");
    }
  }, [state, router, toast]);

  const total = expenses.reduce((n, e) => n + e.amount, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Form */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="card p-6">
          <h2 className="font-serif text-xl">تسجيل صرف</h2>
          <form key={formVersion} action={submit} className="mt-5 space-y-4">
            <MoneyInput
              label={`المبلغ (${CURRENCY})`}
              name="amount"
              placeholder="50,000"
              error={state.fieldErrors?.amount}
            />

            <div>
              <label className="field-label" htmlFor="recipient">
                لمن تم الصرف
              </label>
              <select
                id="recipient"
                className="field-input"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {agentCode(a.agentNumber)}
                  </option>
                ))}
                <option value={OTHER}>جهة أخرى (اكتب الاسم)</option>
              </select>
              {/* The server reads agentId; empty means free-text recipient. */}
              <input
                type="hidden"
                name="agentId"
                value={recipient === OTHER ? "" : recipient}
              />
              {state.fieldErrors?.agentId && (
                <p className="field-error">{state.fieldErrors.agentId}</p>
              )}
            </div>

            {recipient === OTHER && (
              <Field
                label="اسم الجهة المستلمة"
                name="recipientName"
                placeholder="مثال: شركة التوصيل"
                error={state.fieldErrors?.recipientName}
              />
            )}

            <TextareaField
              label="ملاحظة (اختياري)"
              name="note"
              rows={2}
              placeholder="سبب الصرف"
              error={state.fieldErrors?.note}
            />

            <button className="btn btn-primary w-full" disabled={pending}>
              {pending ? "جارٍ الحفظ…" : "تسجيل الصرف"}
            </button>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-serif text-xl">سجل الصرفيات</h2>
            <p className="text-sm text-muted">{periodLabel} · {formatNumber(expenses.length)} عملية</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-muted">الإجمالي</p>
            <p className="font-serif text-xl">{formatPrice(total)}</p>
          </div>
        </div>
        {expenses.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            لا توجد صرفيات في هذه الفترة.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">التاريخ</th>
                  <th className="px-5 py-3 font-medium">المستلم</th>
                  <th className="px-5 py-3 font-medium">المبلغ</th>
                  <th className="px-5 py-3 font-medium">ملاحظة</th>
                  <th className="px-5 py-3 text-end font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-2/60">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      {formatDate(e.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{e.recipientName}</p>
                      {e.agent ? (
                        <p className="ltr text-start text-xs text-muted">
                          {agentCode(e.agent.agentNumber)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted">جهة أخرى</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-semibold">
                      {formatPrice(e.amount)}
                    </td>
                    <td className="max-w-xs px-5 py-3 text-muted">{e.note ?? "—"}</td>
                    <td className="px-5 py-3">
                      <form action={deleteExpenseAction} className="flex justify-end">
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          className="btn-icon btn-icon-danger"
                          aria-label="حذف"
                        >
                          <TrashIcon width={17} height={17} />
                        </button>
                      </form>
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
