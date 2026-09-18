"use client";

import { useRouter } from "next/navigation";
import { ALL_PERIODS, formatMonthKey } from "@/lib/business-day";

/**
 * Month selector for pages that "reset" monthly but keep an archive: the
 * current month is the default; older months are listed as the archive.
 * Navigates to `${basePath}?month=<key>` (plus any extra params).
 */
export function MonthPicker({
  months,
  value,
  basePath,
  params = {},
  allowAll = true,
}: {
  /** Available month keys (YYYY-MM), newest first; the first is the current month. */
  months: string[];
  /** Selected month key, or "all". */
  value: string;
  basePath: string;
  params?: Record<string, string>;
  allowAll?: boolean;
}) {
  const router = useRouter();
  const [current, ...archive] = months;

  function go(month: string) {
    const q = new URLSearchParams(params);
    q.set("month", month);
    router.push(`${basePath}?${q.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">الفترة</span>
      <select
        value={value}
        onChange={(e) => go(e.target.value)}
        className="field-input !w-auto !py-1.5 !pe-8"
        aria-label="اختيار الشهر"
      >
        <option value={current}>الشهر الحالي · {formatMonthKey(current)}</option>
        {archive.length > 0 && (
          <optgroup label="الأرشيف">
            {archive.map((m) => (
              <option key={m} value={m}>
                {formatMonthKey(m)}
              </option>
            ))}
          </optgroup>
        )}
        {allowAll && <option value={ALL_PERIODS}>كل الفترات</option>}
      </select>
    </label>
  );
}
