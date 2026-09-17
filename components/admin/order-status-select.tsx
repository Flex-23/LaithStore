"use client";

import { updateOrderStatusAction } from "@/app/actions/admin";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  return (
    <form action={updateOrderStatusAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="field-input !w-auto !py-1.5 !pe-8 text-sm"
        aria-label="تحديث حالة الطلب"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
