import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

// Uploaded images live in public/uploads and are served at /uploads/<name>.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export class UploadError extends Error {}

/** Persists an uploaded image and returns its public path (`/uploads/…`). */
export async function saveImageUpload(file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new UploadError("نوع الملف غير مدعوم (JPG، PNG، WebP، GIF، AVIF)");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("حجم الصورة يجب ألا يتجاوز 4 ميغابايت");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(
    path.join(UPLOAD_DIR, name),
    Buffer.from(await file.arrayBuffer()),
  );
  return `/uploads/${name}`;
}
