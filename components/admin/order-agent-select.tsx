"use client";

import { assignOrderAgentAction } from "@/app/actions/admin";
import { agentCode } from "@/lib/agent";

type AgentOption = { id: string; name: string; agentNumber: number | null };

/** Admin-only: assign (or clear) the agent responsible for an order. */
export function OrderAgentSelect({
  orderId,
  agentId,
  agents,
}: {
  orderId: string;
  agentId: string | null;
  agents: AgentOption[];
}) {
  return (
    <form action={assignOrderAgentAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <select
        name="agentId"
        defaultValue={agentId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="field-input !w-auto !py-1.5 !pe-8 text-sm"
        aria-label="تعيين مندوب"
      >
        <option value="">بدون مندوب</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} · {agentCode(a.agentNumber)}
          </option>
        ))}
      </select>
    </form>
  );
}
