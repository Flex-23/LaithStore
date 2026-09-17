import type { ReactNode } from "react";
import { statusLabel } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`card p-5 ${
        accent ? "bg-foreground text-background" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-sm ${accent ? "text-background/70" : "text-muted"}`}
        >
          {label}
        </p>
        {icon && (
          <span
            className={`grid h-9 w-9 place-items-center rounded-full ${
              accent ? "bg-background/15" : "surface-2 text-brand"
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-serif text-3xl">{value}</p>
      {sub && (
        <p className={`mt-1 text-xs ${accent ? "text-background/60" : "text-muted"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-brand-soft text-brand-strong",
  SHIPPED: "bg-blue-500/15 text-blue-500",
  DELIVERED: "bg-success/15 text-success",
  CANCELLED: "bg-danger/15 text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] ?? "surface-2 text-muted"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function BarRow({
  label,
  value,
  max,
  hint,
}: {
  label: string;
  value: number;
  max: number;
  hint?: string;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, 4) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="truncate pe-3 font-medium">{label}</span>
        <span className="shrink-0 text-muted">{hint ?? formatNumber(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full surface-2">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
