"use client";

import { useEffect, useState } from "react";
import { SmartImage } from "@/components/smart-image";
import { LinkIcon, UploadIcon } from "@/components/icons";

type Mode = "url" | "upload";

/**
 * Image input for admin forms. Submits either:
 *  - `image`     → an http(s) URL (URL mode), or the existing path (upload mode)
 *  - `imageFile` → a file from the device (upload mode); the server prefers it
 *                  over `image` when present.
 */
export function ImagePicker({
  label = "الصورة",
  defaultValue,
  error,
}: {
  label?: string;
  defaultValue?: string;
  error?: string;
}) {
  const isLocal = !!defaultValue?.startsWith("/uploads/");
  const [mode, setMode] = useState<Mode>(isLocal ? "upload" : "url");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Release object URLs when the preview changes or the picker unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onFile(file: File | null) {
    setPreview(file ? URL.createObjectURL(file) : null);
    setFileName(file?.name ?? null);
  }

  const shown = preview ?? (mode === "upload" ? defaultValue : undefined);

  return (
    <div>
      <span className="field-label">{label}</span>

      {/* Source toggle */}
      <div className="mb-3 grid grid-cols-2 rounded-full surface-2 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center justify-center gap-1.5 rounded-full py-1.5 transition-colors ${
            mode === "url" ? "bg-surface shadow-sm" : "text-muted"
          }`}
        >
          <LinkIcon width={15} height={15} /> رابط
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center justify-center gap-1.5 rounded-full py-1.5 transition-colors ${
            mode === "upload" ? "bg-surface shadow-sm" : "text-muted"
          }`}
        >
          <UploadIcon width={15} height={15} /> رفع من الجهاز
        </button>
      </div>

      {mode === "url" ? (
        <input
          name="image"
          type="url"
          className="field-input"
          placeholder="https://…"
          defaultValue={isLocal ? "" : defaultValue}
          aria-invalid={!!error}
          dir="ltr"
        />
      ) : (
        <>
          {/* Keep the existing image when editing without choosing a new file. */}
          <input type="hidden" name="image" value={isLocal ? defaultValue : ""} />
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border-strong px-4 py-3 text-sm transition-colors hover:border-brand">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <UploadIcon width={17} height={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {fileName ?? "اختر صورة من جهازك"}
              </span>
              <span className="block text-xs text-muted">
                JPG، PNG، WebP · حتى 4 ميغابايت
              </span>
            </span>
            <input
              type="file"
              name="imageFile"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </>
      )}

      {shown && (
        <SmartImage
          key={shown}
          src={shown}
          alt="معاينة الصورة"
          sizes="160px"
          className="mt-3 h-28 w-24 rounded-xl border border-border"
        />
      )}

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
