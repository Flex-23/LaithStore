"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { adminOnly } from "@/lib/permissions";
import { agentCode, STAFF_ROLE_LABELS } from "@/lib/agent";
import {
  createAgentSchema,
  fieldErrors,
  updateAgentSchema,
} from "@/lib/zod-schemas";
import type { AdminState } from "./admin";

const DB_ERROR = "خطأ في قاعدة البيانات. تأكد من تشغيل MySQL وتطبيق المخطط.";
const UNAUTHORIZED = "هذا الإجراء متاح للمدير فقط";

function refreshAgents() {
  revalidatePath("/admin/agents");
  revalidatePath("/admin/agents/reports");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/follow-up");
  revalidatePath("/admin/expenses");
}

function readAgentForm(formData: FormData) {
  return {
    name: formData.get("name"),
    phone: formData.get("phone"),
    governorate: formData.get("governorate"),
    password: formData.get("password") ?? "",
    role: formData.get("role"),
    commissionPerOrder: formData.get("commissionPerOrder") || "0",
    canManageProducts: formData.get("canManageProducts") === "on",
    canManageOrders: formData.get("canManageOrders") === "on",
    canViewDashboard: formData.get("canViewDashboard") === "on",
    canManageHome: formData.get("canManageHome") === "on",
  };
}

/**
 * Creates an agent with the next sequential number. The number is allocated
 * inside a serializable transaction so two admins can't get the same one.
 */
export async function createAgentAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await adminOnly())) return { error: UNAUTHORIZED };

  const parsed = createAgentSchema.safeParse(readAgentForm(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const password = await hashPassword(d.password);

  try {
    const agent = await prisma.$transaction(
      async (tx) => {
        const last = await tx.user.aggregate({ _max: { agentNumber: true } });
        return tx.user.create({
          data: {
            name: d.name,
            phone: d.phone,
            governorate: d.governorate,
            password,
            role: d.role,
            agentNumber: (last._max.agentNumber ?? 0) + 1,
            // Only entry staff earn a per-order fee.
            commissionPerOrder: d.role === "AGENT" ? d.commissionPerOrder : 0,
            canManageProducts: d.canManageProducts,
            canManageOrders: d.canManageOrders,
            canViewDashboard: d.canViewDashboard,
            canManageHome: d.canManageHome,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    refreshAgents();
    return {
      success: `تمت إضافة ${STAFF_ROLE_LABELS[d.role]} ${agent.name} برقم ${agentCode(agent.agentNumber)}`,
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { phone: "هذا الرقم مسجّل مسبقاً" } };
    }
    return { error: DB_ERROR };
  }
}

export async function updateAgentAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await adminOnly())) return { error: UNAUTHORIZED };

  const parsed = updateAgentSchema.safeParse({
    id: formData.get("id"),
    ...readAgentForm(formData),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;

  try {
    await prisma.user.update({
      where: { id: d.id, role: { in: ["AGENT", "FOLLOWUP", "ACCOUNTANT"] } },
      data: {
        role: d.role,
        name: d.name,
        phone: d.phone,
        governorate: d.governorate,
        ...(d.password ? { password: await hashPassword(d.password) } : {}),
        commissionPerOrder: d.role === "AGENT" ? d.commissionPerOrder : 0,
        canManageProducts: d.canManageProducts,
        canManageOrders: d.canManageOrders,
        canViewDashboard: d.canViewDashboard,
        canManageHome: d.canManageHome,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { phone: "هذا الرقم مسجّل مسبقاً" } };
    }
    return { error: DB_ERROR };
  }
  refreshAgents();
  return { success: "تم تحديث بيانات الموظف" };
}

/** Create when there's no `id`, otherwise update. Used by the agents form. */
export async function saveAgentAction(
  prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  return String(formData.get("id") ?? "")
    ? updateAgentAction(prev, formData)
    : createAgentAction(prev, formData);
}

/** Suspend / reactivate an agent (suspended agents can't sign in). */
export async function toggleAgentActiveAction(formData: FormData) {
  if (!(await adminOnly())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  if (id) {
    try {
      await prisma.user.update({
        where: { id, role: { in: ["AGENT", "FOLLOWUP", "ACCOUNTANT"] } },
        data: { isActive: active },
      });
    } catch {
      /* ignore */
    }
    refreshAgents();
  }
  redirect("/admin/agents");
}

/** Deletes an agent; their orders and expenses keep the history (agent set to null). */
export async function deleteAgentAction(formData: FormData) {
  if (!(await adminOnly())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  if (id) {
    try {
      await prisma.user.delete({ where: { id, role: { in: ["AGENT", "FOLLOWUP", "ACCOUNTANT"] } } });
    } catch {
      /* ignore */
    }
    refreshAgents();
  }
  redirect("/admin/agents");
}
