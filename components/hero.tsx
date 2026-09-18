import Link from "next/link";
import { SmartImage } from "./smart-image";
import { ArrowRightIcon, ShieldIcon, SparkleIcon, TruckIcon } from "./icons";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { HomeContentData } from "@/lib/home-content";

/**
 * Renders the headline with line breaks preserved and the first occurrence of
 * `highlight` coloured in the brand tone.
 */
function Headline({ title, highlight }: { title: string; highlight: string }) {
  const lines = title.split(/\r?\n/);
  // Only the first line containing the highlight gets it coloured.
  const hitLine = highlight ? lines.findIndex((l) => l.includes(highlight)) : -1;
  return (
    <>
      {lines.map((line, i) => {
        const at = i === hitLine ? line.indexOf(highlight) : -1;
        return (
          <span key={i}>
            {at === -1 ? (
              line
            ) : (
              <>
                {line.slice(0, at)}
                <span className="text-brand">{highlight}</span>
                {line.slice(at + highlight.length)}
              </>
            )}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

export function Hero({ content }: { content: HomeContentData }) {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-hero pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      <div className="pointer-events-none absolute -inset-s-24 -top-24 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -inset-e-24 top-40 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />

      <div className="container-page relative grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
        {/* Copy */}
        <div className="max-w-xl">
          <span className="eyebrow animate-fade-up">
            <SparkleIcon width={15} height={15} /> {content.heroEyebrow}
          </span>
          <h1
            className="animate-fade-up mt-5 text-balance text-5xl leading-[1.15] sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            <Headline title={content.heroTitle} highlight={content.heroHighlight} />
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-md text-lg leading-relaxed text-muted"
            style={{ animationDelay: "160ms" }}
          >
            {content.heroSubtitle}
          </p>
          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link href="/products" className="btn btn-brand">
              {content.heroCta} <ArrowRightIcon width={18} height={18} />
            </Link>
            <Link href="/register" className="btn btn-outline">
              إنشاء حساب
            </Link>
          </div>

          <div
            className="animate-fade-up mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted"
            style={{ animationDelay: "320ms" }}
          >
            <span className="flex items-center gap-2">
              <TruckIcon width={17} height={17} className="text-brand" /> توصيل
              مجاني للطلبات فوق {formatPrice(FREE_SHIPPING_THRESHOLD)}
            </span>
            <span className="flex items-center gap-2">
              <ShieldIcon width={17} height={17} className="text-brand" /> دفع
              آمن عند الاستلام
            </span>
          </div>
        </div>

        {/* Imagery */}
        <div className="relative h-[380px] sm:h-[460px] lg:h-[540px]">
          <div className="animate-fade-up absolute inset-e-0 top-0 h-[74%] w-[62%] overflow-hidden rounded-[2rem] border border-border shadow-2xl">
            <SmartImage
              src={content.heroImage1}
              alt="صورة رئيسية"
              sizes="40vw"
              priority
              className="h-full w-full"
            />
          </div>
          <div
            className="animate-fade-up absolute bottom-0 inset-s-0 h-[56%] w-[50%] overflow-hidden rounded-[2rem] border border-border shadow-2xl"
            style={{ animationDelay: "160ms" }}
          >
            <SmartImage
              src={content.heroImage2}
              alt="صورة ثانوية"
              sizes="30vw"
              className="h-full w-full"
            />
          </div>
          <div
            className="animate-float absolute inset-s-4 top-6 hidden rounded-2xl border border-border bg-surface/90 px-4 py-3 shadow-xl backdrop-blur sm:block"
          >
            <p className="text-xs text-muted">يثق بنا</p>
            <p className="font-serif text-2xl">
              <span className="ltr">+12,000</span> متسوّق
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
