/** Small label/value tile used in profile-like summaries. */
export function DetailItem({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  /** Force left-to-right (phone numbers, codes). */
  ltr?: boolean;
}) {
  return (
    <div className="rounded-xl surface-2 px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 font-medium ${ltr ? "ltr text-start" : ""}`}>{value}</p>
    </div>
  );
}
