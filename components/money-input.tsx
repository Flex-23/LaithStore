"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";

/** Digits only, from whatever the user typed or pasted. */
function digitsOf(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/**
 * Amount field that shows thousands separators as you type (2,000) while
 * submitting the plain number under `name` through a hidden input.
 */
export function MoneyInput({
  label,
  name,
  defaultValue,
  placeholder = "0",
  hint,
  error,
  required,
  onValueChange,
}: {
  label: string;
  name: string;
  defaultValue?: number | null;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Called with the plain number as the user types (0 when empty). */
  onValueChange?: (value: number) => void;
}) {
  const [digits, setDigits] = useState(
    defaultValue != null ? String(Math.round(defaultValue)) : "",
  );

  return (
    <div>
      <label htmlFor={`${name}-display`} className="field-label">
        {label}
      </label>
      <input
        id={`${name}-display`}
        type="text"
        inputMode="numeric"
        dir="ltr"
        className="field-input"
        placeholder={placeholder}
        value={digits ? formatNumber(Number(digits)) : ""}
        onChange={(e) => {
          const next = digitsOf(e.target.value);
          setDigits(next);
          onValueChange?.(Number(next || 0));
        }}
        aria-invalid={!!error}
        required={required}
        autoComplete="off"
      />
      <input type="hidden" name={name} value={digits} />
      {error ? (
        <p className="field-error">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
