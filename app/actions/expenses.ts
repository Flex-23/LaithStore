"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { accountsOnly } from "@/lib/permissions";
import { expenseSchema, fieldErrors } from "@/lib/zod-schemas";
import type { AdminState } from "./admin";

const DB_ERROR = "خطأ في قاعدة البيانات. تأكد من تشغيل MySQL وتطبيق المخطط.";
const UNAUTHORIZED = "هذا الإجراء متاح للمدير وموظف الحسابات فقط";

function refreshExpenses() {
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/agents/reports");
}

/** Records money paid out — to an agent (from the list) or anyone by name. */
export async function addExpenseAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await accountsOnly())) return { error: UNAUTHORIZED };

  const parsed = expenseSchema.safeParse({
    amount: formData.get("amount"),
    agentId: formData.get("agentId") ?? "",
    recipientName: formData.get("recipientName") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;

  try {
    let agentId: string | null = null;
    let recipientName = d.recipientName;

    if (d.agentId) {
      const agent = await prisma.user.findFirst({
        where: { id: d.agentId, role: "AGENT" },
        select: { id: true, name: true },
      });
      if (!agent) return { fieldErrors: { agentId: "المندوب غير موجود" } };
      agentId = agent.id;
      recipientName = agent.name;
    } else if (!recipientName) {
      return { fieldErrors: { recipientName: "اكتب اسم الجهة المستلمة" } };
    }

    await prisma.expense.create({
      data: {
        amount: d.amount,
        agentId,
        recipientName,
        note: d.note || null,
      },
    });
  } catch {
    return { error: DB_ERROR };
  }
  refreshExpenses();
  return { success: "تم تسجيل الصرف" };
}

export async function deleteExpenseAction(formData: FormData) {
  if (!(await accountsOnly())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  if (id) {
    try {
      await prisma.expense.delete({ where: { id } });
    } catch {
      /* ignore */
    }
    refreshExpenses();
  }
  redirect("/admin/expenses");
}
