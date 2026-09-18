import { ShieldIcon } from "@/components/icons";

export const metadata = { title: "لا توجد صلاحيات" };

export default function NoAccessPage() {
  return (
    <div className="card mx-auto mt-10 flex max-w-lg flex-col items-center gap-4 p-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full surface-2 text-muted">
        <ShieldIcon width={26} height={26} />
      </span>
      <h1 className="text-2xl">لا توجد صلاحيات مفعّلة لحسابك</h1>
      <p className="max-w-sm text-sm text-muted">
        لم يمنحك المدير أي صلاحية بعد. تواصل معه لتفعيل الصفحات التي تحتاجها.
      </p>
    </div>
  );
}
