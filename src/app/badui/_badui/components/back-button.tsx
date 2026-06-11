"use client";

/**
 * Navigation control for the Bad UI mode. Everything else on this page is
 * cursed, so the Escape button gets a taste of it too: it dodges your cursor a
 * few times, then guilt-trips you through a confirm-shaming modal with a giant
 * decoy "STAY" button and a tiny, fleeing "leave anyway" link.
 *
 * It is still deliberately *bounded*, though, so nobody can actually be
 * trapped: the dodges are capped, the guilt chain terminates, and after a
 * handful of clicks it really does navigate home. Dodging is also disabled
 * under `prefers-reduced-motion` (the confirm chain still applies, but without
 * motion), and keyboard users can Tab + Enter straight through without any
 * hover-dodging at all.
 */
import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

const COMIC = '"Comic Sans MS", "Comic Sans", cursive';
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const GUILT = [
  "Are you SURE? You've barely suffered. There is so much more bad UI to endure.",
  "Wow, really? Think of all the pop-ups you would be missing.",
  "Clip-Evil™ the paperclip will be DEVASTATED. Still leaving?",
  "Final answer? You can never un-see this website.",
];

export default function BackButton() {
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 });
  const btnDodges = useRef(0);
  const [leaveOffset, setLeaveOffset] = useState({ x: 0, y: 0 });
  const leaveDodges = useRef(0);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const fleeBtn = () => {
    if (reduced || btnDodges.current >= 3) return;
    btnDodges.current += 1;
    setBtnOffset({ x: rand(-44, 44), y: rand(0, 38) });
  };
  const fleeLeave = () => {
    if (reduced || leaveDodges.current >= 3) return;
    leaveDodges.current += 1;
    setLeaveOffset({ x: rand(-60, 60), y: rand(-18, 18) });
  };

  const leave = () => {
    if (step >= GUILT.length - 1) {
      window.location.href = "/";
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Back to home"
        onMouseEnter={fleeBtn}
        onClick={() => {
          setStep(0);
          leaveDodges.current = 0;
          setLeaveOffset({ x: 0, y: 0 });
          setOpen(true);
        }}
        style={{
          transform: `translate(${btnOffset.x}px, ${btnOffset.y}px)`,
          transition: "transform 0.12s ease-out",
          fontFamily: COMIC,
        }}
        className="group inline-flex items-center gap-1.5 border-2 border-black bg-lime-300 px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide text-black shadow-[3px_3px_0_#000] hover:bg-lime-200"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        <span>Escape?</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4"
          style={{ fontFamily: COMIC }}
        >
          <div className="w-full max-w-sm border-4 border-fuchsia-600 bg-white p-5 text-center text-black shadow-[8px_8px_0_#000]">
            <div className="text-5xl">😢</div>
            <h2 className="mt-1 text-xl font-black text-fuchsia-700">Wait! Don&apos;t leave us!</h2>
            <p className="mt-2 min-h-[2.75rem] text-[12px] leading-snug text-gray-700">
              {GUILT[Math.min(step, GUILT.length - 1)]}
            </p>

            {/* The giant decoy: staying is always one easy click. */}
            <button
              onClick={() => setOpen(false)}
              className="mt-2 w-full rounded border-2 border-green-800 bg-green-500 py-3 text-lg font-black text-white hover:bg-green-400"
            >
              STAY (smart choice!) 🎉
            </button>

            {/* The real exit: tiny, fleeing, and guilt-tripping, but bounded. */}
            <div className="mt-3">
              <button
                type="button"
                onMouseEnter={fleeLeave}
                onClick={leave}
                style={{
                  transform: `translate(${leaveOffset.x}px, ${leaveOffset.y}px)`,
                  transition: "transform 0.12s ease-out",
                }}
                className="text-[10px] text-gray-400 underline hover:text-gray-500"
              >
                {step >= GUILT.length - 1 ? "fine, escape for real »" : "no thanks, leave anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
