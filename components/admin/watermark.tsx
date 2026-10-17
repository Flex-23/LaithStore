import { GlobeMark } from "@/components/logo";
import { APP_NAME } from "@/lib/constants";

/** Faint brand watermark: inside the card on screen, on every page when printed. */
export function Watermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 grid place-items-center overflow-hidden text-brand opacity-[0.07] print:fixed print:opacity-[0.08]"
    >
      <div className="flex -rotate-[24deg] flex-col items-center gap-4">
        <GlobeMark size={260} />
        <span className="font-serif text-[120px] font-black leading-none">{APP_NAME}</span>
      </div>
    </div>
  );
}
