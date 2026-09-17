import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <p className="eyebrow justify-center">خطأ 404</p>
        <h1 className="mt-3 text-6xl">الصفحة غير موجودة</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <Link href="/" className="btn btn-brand mt-8">
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
