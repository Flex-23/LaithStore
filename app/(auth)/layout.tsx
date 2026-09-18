import Link from "next/link";
import { Logo } from "@/components/logo";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SmartImage } from "@/components/smart-image";
import { ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/** Customer sign-in / sign-up shell. Signed-in visitors are sent away. */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect(session.role === "USER" ? "/" : "/admin");

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <Logo href="/" size="sm" />
          <Link
            href="/"
            className="link-underline inline-flex items-center gap-1.5 text-sm text-muted"
          >
            العودة إلى المتجر <ArrowRightIcon width={15} height={15} />
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>

      {/* Brand side */}
      <aside className="relative hidden overflow-hidden lg:block">
        <SmartImage
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
          alt="منتجات مختارة"
          sizes="50vw"
          priority
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/40" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <p className="font-serif text-3xl leading-snug">
            «التفاصيل ليست مجرد تفاصيل، هي التي تصنع التصميم.»
          </p>
          <p className="mt-4 text-sm text-white/70">تجارة بعناية</p>
        </div>
      </aside>
    </div>
  );
}
