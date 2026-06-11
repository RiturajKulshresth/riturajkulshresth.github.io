"use client";

/**
 * "Bad UI" render mode: a deliberately cursed homage to r/badUIbattles and the
 * classic dark-pattern hall of shame. It is intentionally hostile, but never
 * genuinely harmful or inescapable:
 *
 *   - It still surfaces the real portfolio data from `@/lib/data`.
 *   - There is always one honest, reliable escape (the Exit back-button) plus a
 *     "give up / skip" affordance on every gate, so nobody gets trapped.
 *   - It respects `prefers-reduced-motion`: when set, the running buttons stop
 *     dodging, marquees freeze, the cursor comet is disabled, and the rainbow
 *     animations hold still. No fast strobing is used anywhere.
 *
 * Stateful annoyance widgets (assistant, toasts, cursor comet) are declared at
 * module scope so they own their own timers and never remount as the stage
 * machine advances.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  profile,
  projects,
  experience,
  skillGroups,
  accolades,
  socialLinks,
  RESUME_PATH,
} from "@/lib/data";
import BackButton from "./back-button";

type Stage = "cookies" | "age" | "captcha" | "loading" | "content";

const COMIC = '"Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive';

/* Inline keyframes/utility CSS, scoped with a `badui-` prefix so this mode
   stays fully self-contained and pollutes nothing else. */
const STYLES = `
@keyframes badui-march { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes badui-rainbow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
@keyframes badui-blink { 0%, 60% { opacity: 1; } 61%, 100% { opacity: 0.15; } }
@keyframes badui-wiggle { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
@keyframes badui-spin { to { transform: rotate(360deg); } }
@keyframes badui-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes badui-toast-in { from { transform: scale(0.6) rotate(-6deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }
@keyframes badui-sparkle { from { transform: translate(-50%, -50%) scale(1); opacity: 1; } to { transform: translate(-50%, -50%) scale(0.2) translateY(14px); opacity: 0; } }

.badui-marquee { display: inline-flex; white-space: nowrap; animation: badui-march 14s linear infinite; }
.badui-rainbow { animation: badui-rainbow 6s linear infinite; }
.badui-blink { animation: badui-blink 1.4s steps(1) infinite; }
.badui-wiggle { animation: badui-wiggle 0.5s ease-in-out infinite; }
.badui-bob { animation: badui-bob 2.2s ease-in-out infinite; }

/* The signature crime: a thumb-sized horizontal scrollbar nobody can grab. */
.badui-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
.badui-scroll::-webkit-scrollbar-thumb { background: #00ff00; border-radius: 0; }
.badui-scroll::-webkit-scrollbar-track { background: #ff00ff; }

@media (prefers-reduced-motion: reduce) {
  .badui-marquee, .badui-rainbow, .badui-blink, .badui-wiggle, .badui-bob { animation: none !important; }
}
`;

/* ─────────────────────────── helpers ─────────────────────────── */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

/** Ticks down to zero, one second at a time. Returns [secondsLeft, setLeft]
 *  so a caller can cruelly reset the countdown mid-wait. */
function useCountdown(seconds: number): [number, React.Dispatch<React.SetStateAction<number>>] {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const id = window.setTimeout(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [left]);
  return [left, setLeft];
}

/**
 * A button that flees the cursor a few times before grudgingly letting you
 * click it. After `maxDodges` it surrenders, so this can never become a trap.
 * With reduced motion it never dodges at all.
 */
function DodgyButton({
  children,
  onClick,
  className,
  maxDodges = 4,
  reduced,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  maxDodges?: number;
  reduced: boolean;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dodges = useRef(0);

  const flee = () => {
    if (reduced || dodges.current >= maxDodges) return;
    dodges.current += 1;
    setOffset({ x: rand(-90, 90), y: rand(-40, 40) });
  };

  return (
    <button
      type="button"
      onMouseEnter={flee}
      onClick={onClick}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, transition: "transform 0.12s ease-out" }}
      className={className}
    >
      {children}
    </button>
  );
}

const SKIP_PROMPTS = [
  "Are you sure? Skipping is for quitters.",
  "Really, really sure? You will miss SO much.",
  "Hmm. Think about everything you are giving up.",
  "Last chance to reconsider your entire personality.",
  "Fine. Be that way. Click ONE more time to abandon us.",
];

/**
 * The only way past a gate other than the intended (annoying) path. It is
 * deliberately painful but always bounded: first you wait out a countdown
 * (which the gate may reset once), then you must click through an escalating
 * chain of guilt-trip confirmations, and the link dodges your cursor a few
 * times for good measure. After the last prompt it really does skip.
 */
function SkipLink({
  label,
  delay,
  onSkip,
  reduced,
  className,
}: {
  label: string;
  delay: number;
  onSkip: () => void;
  reduced: boolean;
  className?: string;
}) {
  const [left] = useCountdown(delay);
  const [step, setStep] = useState(0);

  if (left > 0) {
    return (
      <span className={`text-[10px] text-gray-400 ${className ?? ""}`}>
        you may skip in {left}s…
      </span>
    );
  }

  const text = step === 0 ? label : SKIP_PROMPTS[Math.min(step - 1, SKIP_PROMPTS.length - 1)];
  const handle = () => {
    if (step > SKIP_PROMPTS.length - 1) {
      onSkip();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <DodgyButton
      reduced={reduced}
      onClick={handle}
      maxDodges={4}
      className={`text-[10px] underline ${step === 0 ? "text-gray-400" : "text-red-500"} ${className ?? ""}`}
    >
      {text}
    </DodgyButton>
  );
}

/* ─────────────────────── persistent annoyances ─────────────────────── */

/** A sparkle trail that chases the pointer. Desktop + motion only. */
function CursorComet({ reduced }: { reduced: boolean }) {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(hover: none)").matches) return;
    const layer = layerRef.current;
    if (!layer) return;

    const sparkles = ["✨", "⭐", "💫", "🌟", "💥"];
    const timers = new Set<number>();
    let last = 0;
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      const s = document.createElement("span");
      s.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
      s.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;font-size:${rand(10, 22)}px;pointer-events:none;z-index:2147483000;animation:badui-sparkle 0.7s ease-out forwards;`;
      layer.appendChild(s);
      const t = window.setTimeout(() => {
        s.remove();
        timers.delete(t);
      }, 720);
      timers.add(t);
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      timers.forEach((t) => window.clearTimeout(t));
      layer.replaceChildren();
    };
  }, [reduced]);

  return <div ref={layerRef} aria-hidden className="pointer-events-none fixed inset-0 z-[2147483000]" />;
}

const TOASTS = [
  { emoji: "🎉", text: "CONGRATULATIONS! You are visitor #1,000,001!" },
  { emoji: "⚠️", text: "Your device may be running slow. Click here to maybe fix it." },
  { emoji: "📧", text: "You have (1) unread invoice from a prince." },
  { emoji: "🏆", text: "You've been selected for a free* recruiter call!" },
  { emoji: "🐌", text: "Loading is 14% slower since you started reading this." },
  { emoji: "🍪", text: "We updated our cookie policy again. Surprise!" },
  { emoji: "💸", text: "Hot single APIs in your area want to connect." },
  { emoji: "🚨", text: "ALERT: 1 (one) hacker is currently looking at you." },
  { emoji: "📦", text: "Your package is stuck. Pay ₹1 to un-stick it." },
  { emoji: "🔋", text: "Your battery is emotionally drained. Upgrade now!" },
  { emoji: "🧹", text: "Your registry is 4,096% too messy. Clean it!" },
  { emoji: "🎰", text: "You're on a 0-day streak! Spin to win nothing!" },
  { emoji: "💍", text: "A wild recruiter wants to 'just pick your brain'." },
  { emoji: "🐉", text: "You have been chosen by a dragon. Reply within 3s." },
  { emoji: "🧊", text: "Click to receive 0 free ice cubes (shipping ₹4,999)." },
  { emoji: "📈", text: "Stonks you don't own are up. Panic accordingly." },
  { emoji: "🛎️", text: "Ding! That's the sound of another notification." },
  { emoji: "👀", text: "17 people are also ignoring this exact popup." },
];

const TOAST_CAP = 9;

/** Toasts that pop into a random corner and pile up. Closing one tends to
 *  summon a replacement (or two), because that is how spam works. Bounded by
 *  TOAST_CAP so it can never run away. */
function ToastSpawner({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [items, setItems] = useState<{ id: number; emoji: string; text: string; corner: number }[]>([]);
  const nextId = useRef(0);

  const make = () => {
    const t = TOASTS[Math.floor(Math.random() * TOASTS.length)];
    return { id: nextId.current++, emoji: t.emoji, text: t.text, corner: Math.floor(Math.random() * 4) };
  };

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setItems((prev) => (prev.length >= TOAST_CAP ? prev : [...prev, make()]));
    }, 1900);
    return () => window.clearInterval(id);
  }, [active]);

  // Closing a toast removes it, then whack-a-moles one or two back in.
  const close = (id: number) => {
    setItems((prev) => {
      const without = prev.filter((x) => x.id !== id);
      const extra = Math.random() < 0.8 ? (Math.random() < 0.4 ? 2 : 1) : 0;
      const additions = [];
      for (let k = 0; k < extra && without.length + additions.length < TOAST_CAP; k++) additions.push(make());
      return [...without, ...additions];
    });
  };

  if (!active) return null;
  const corners = [
    "top-16 left-3",
    "top-16 right-3",
    "bottom-12 left-3",
    "bottom-12 right-3",
  ];

  // Per-corner stacking so multiple toasts in the same corner fan out.
  const perCorner: Record<number, number> = {};

  return (
    <>
      {items.map((it) => {
        const stackIdx = perCorner[it.corner] ?? 0;
        perCorner[it.corner] = stackIdx + 1;
        const isTop = it.corner < 2;
        const offset = `${stackIdx * 58}px`;
        const style: React.CSSProperties = {
          fontFamily: COMIC,
          animation: "badui-toast-in 0.25s ease-out",
          ...(isTop ? { marginTop: offset } : { marginBottom: offset }),
        };
        return (
          <div
            key={it.id}
            className={`fixed z-[120] max-w-[230px] border-2 border-yellow-300 bg-[#000080] p-2 text-[11px] text-white shadow-[4px_4px_0_#ff00ff] ${corners[it.corner]} ${reduced ? "" : "badui-wiggle"}`}
            style={style}
          >
            <div className="flex items-start gap-1.5">
              <span className="text-base leading-none">{it.emoji}</span>
              <span className="leading-tight">{it.text}</span>
              <DodgyButton
                reduced={reduced}
                maxDodges={2}
                onClick={() => close(it.id)}
                className="ml-auto h-3 w-3 shrink-0 bg-red-600 text-[8px] leading-3 text-white hover:bg-red-500"
              >
                ×
              </DodgyButton>
            </div>
          </div>
        );
      })}
    </>
  );
}

type SpamAd = { tag: string; emoji: string; body: string; cta: string; bg: string; fg: string };

const SPAM_ADS: SpamAd[] = [
  { tag: "HOT DEAL", emoji: "🔥", body: "Download 64GB of FREE RAM. Today only (every day)!", cta: "DOWNLOAD RAM", bg: "#ff1744", fg: "#ffffff" },
  { tag: "YOU WON", emoji: "🎁", body: "An iPhone 47 Pro Max has been reserved for YOU!", cta: "CLAIM PRIZE", bg: "#00c853", fg: "#000000" },
  { tag: "SINGLES", emoji: "💖", body: "Hot recursive functions in your area want to connect!", cta: "MEET NOW", bg: "#ff4081", fg: "#ffffff" },
  { tag: "VIRUS!!", emoji: "☣️", body: "WARNING: 9 viruses detected. Your RAM is leaking onto the floor.", cta: "SCAN & REMOVE", bg: "#000000", fg: "#39ff14" },
  { tag: "MONEY", emoji: "💰", body: "Earn $9,999/day reversing linked lists from home!", cta: "START EARNING", bg: "#ffd600", fg: "#000000" },
  { tag: "PRINCE", emoji: "👑", body: "A prince must store $14,000,000 in YOUR account. Trust him.", cta: "HELP THE PRINCE", bg: "#6a1b9a", fg: "#ffffff" },
  { tag: "ONE TRICK", emoji: "🧠", body: "Recruiters HATE this one weird résumé trick!", cta: "REVEAL TRICK", bg: "#0091ea", fg: "#ffffff" },
  { tag: "FREE GAME", emoji: "🕹️", body: "Play a totally real game while you definitely wait!", cta: "PLAY FREE", bg: "#1de9b6", fg: "#000000" },
  { tag: "LAST CHANCE", emoji: "⏰", body: "This offer expires in 00:00:01. Hurry, slowpoke!", cta: "GRAB IT", bg: "#ff6d00", fg: "#000000" },
  { tag: "CONGRATS", emoji: "🎊", body: "You are the 1,000,000th genius to view this ad!", cta: "COLLECT", bg: "#d500f9", fg: "#ffffff" },
];

const SPAM_CAP = 7;

/** A swarm of fake pop-up "ad windows". They spawn on a timer, and because
 *  this is spam, closing one (or clicking its offer) tends to summon more.
 *  Hard-capped at SPAM_CAP so the swarm can never actually run away. */
function SpamPopups({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [items, setItems] = useState<{ id: number; ad: SpamAd; x: number; y: number; rot: number }[]>([]);
  const nextId = useRef(0);

  const make = () => {
    const ad = SPAM_ADS[Math.floor(Math.random() * SPAM_ADS.length)];
    const w = typeof window !== "undefined" ? window.innerWidth : 1000;
    const h = typeof window !== "undefined" ? window.innerHeight : 700;
    return {
      id: nextId.current++,
      ad,
      x: rand(8, Math.max(8, w - 248)),
      y: rand(70, Math.max(80, h - 240)),
      rot: rand(-5, 5),
    };
  };

  const respawnTimersRef = useRef<number[]>([]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setItems((prev) => (prev.length >= SPAM_CAP ? prev : [...prev, make()]));
    }, 2300);
    return () => window.clearInterval(id);
  }, [active]);

  // Clear any pending respawn timeouts on unmount so they don't setState late.
  useEffect(() => {
    return () => {
      respawnTimersRef.current.forEach((t) => window.clearTimeout(t));
      respawnTimersRef.current = [];
    };
  }, []);

  const spawnMore = (n: number) =>
    setItems((prev) => {
      const additions: { id: number; ad: SpamAd; x: number; y: number; rot: number }[] = [];
      for (let k = 0; k < n && prev.length + additions.length < SPAM_CAP; k++) additions.push(make());
      return [...prev, ...additions];
    });

  const close = (id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    if (Math.random() < 0.7) {
      respawnTimersRef.current.push(
        window.setTimeout(() => spawnMore(Math.random() < 0.4 ? 2 : 1), 120)
      );
    }
  };

  if (!active) return null;

  return (
    <>
      {items.map((it) => (
        <div
          key={it.id}
          className={`fixed z-[160] w-56 border-2 border-black text-[11px] shadow-[5px_5px_0_#000] ${reduced ? "" : "badui-blink"}`}
          style={{ left: it.x, top: it.y, transform: `rotate(${it.rot}deg)`, background: it.ad.bg, color: it.ad.fg, fontFamily: COMIC }}
        >
          <div className="flex items-center justify-between border-b-2 border-black bg-[#000080] px-1.5 py-0.5 text-white">
            <span className="truncate text-[10px] font-bold">{it.ad.emoji} {it.ad.tag} · sponsored</span>
            <DodgyButton
              reduced={reduced}
              maxDodges={3}
              onClick={() => close(it.id)}
              className="ml-1 h-3.5 w-3.5 shrink-0 border border-white bg-red-600 text-[9px] leading-3 text-white"
            >
              ×
            </DodgyButton>
          </div>
          <div className="p-2 text-center">
            <p className="font-bold leading-tight">{it.ad.body}</p>
            <button
              onClick={() => spawnMore(2)}
              className={`mt-2 w-full border-2 border-black bg-white py-1 text-[12px] font-black text-black ${reduced ? "" : "badui-wiggle"}`}
            >
              {it.ad.cta} »
            </button>
            <p className="mt-1 text-[8px] opacity-70">*results not typical. cookie required. void where sane.</p>
          </div>
        </div>
      ))}
    </>
  );
}

const SPAM_TICKER =
  "💰 MAKE $$$ FROM HOME 💰 ⚠️ YOUR PC IS INFECTED ⚠️ 🎁 FREE iPHONE 🎁 💖 HOT SINGLES NEARBY 💖 🔥 DOWNLOAD MORE RAM 🔥 👑 TRUST THE PRINCE 👑 ";

/** A blinking ad ticker glued to the bottom of the screen. */
function SpamBanner({ reduced }: { reduced: boolean }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[115] overflow-hidden border-t-4 border-yellow-300 bg-red-600 py-1 text-white"
      style={{ fontFamily: COMIC }}
    >
      <div className={reduced ? "px-2 text-xs font-black" : "badui-marquee"}>
        <span className="px-4 text-xs font-black">{SPAM_TICKER}</span>
        {!reduced && <span className="px-4 text-xs font-black">{SPAM_TICKER}</span>}
      </div>
    </div>
  );
}

const ASSISTANT_TIPS = [
  "It looks like you're trying to view a portfolio. Would you like help making that harder?",
  "Pro tip: the contact button enjoys cardio.",
  "Have you considered enabling MORE cookies?",
  "Fun fact: this paperclip cannot be permanently closed. Neither can your browser tabs.",
  "Did you know? Comic Sans was scientifically engineered for résumés.",
  "I noticed you tried to read something. Bold.",
  "Tip: scrolling up scrolls down. You're welcome.",
];

/** A draggable paperclip assistant. The X "closes" it, but it returns with a
 *  guilt trip a few seconds later. */
function EvilAssistant({ reduced }: { reduced: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [tip, setTip] = useState(ASSISTANT_TIPS[0]);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTip(ASSISTANT_TIPS[Math.floor(Math.random() * ASSISTANT_TIPS.length)]);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hidden) return;
    const id = window.setTimeout(() => setHidden(false), 2500);
    return () => window.clearTimeout(id);
  }, [hidden]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return;
      setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy });
    };
    const up = () => (drag.current = null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  if (hidden) return null;

  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
    : { right: 16, bottom: 16 };

  return (
    <div
      className="fixed z-[130] w-56 select-none"
      style={style}
    >
      <div className="relative border-2 border-black bg-[#ffffcc] p-2 text-[11px] text-black shadow-[3px_3px_0_#000]" style={{ fontFamily: COMIC }}>
        <button
          onClick={() => setHidden(true)}
          className="absolute -right-2 -top-2 h-4 w-4 border border-black bg-red-600 text-[9px] leading-3 text-white"
          aria-label="Dismiss the assistant (temporarily)"
        >
          ×
        </button>
        <p className="pr-2 leading-tight">{tip}</p>
        <div
          onMouseDown={(e) => {
            drag.current = {
              dx: e.clientX - (pos?.x ?? window.innerWidth - 72),
              dy: e.clientY - (pos?.y ?? window.innerHeight - 72),
            };
          }}
          className={`mt-1.5 flex cursor-grab items-center gap-1 text-2xl active:cursor-grabbing ${reduced ? "" : "badui-bob"}`}
          title="Drag me, I dare you"
        >
          📎<span className="text-xs font-bold text-blue-800">Clip-Evil™</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── gates ───────────────────────────── */

const VENDORS = [
  "AdNauseam", "TrackerCorp", "PixelLeech", "DataDredge", "CookieMonster Inc",
  "SnoopWare", "MetricVultures", "ByteHoarders", "ProfilR", "ScrollSpy",
  "ClickHarvest", "OmniLurk", "FingerprintFox", "RetargetRus", "PopupPals", "YourMomTech",
];

function CookieWall({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  const [partners] = useState(() => Math.floor(rand(1180, 1480)));
  const [left, setLeft] = useCountdown(6);
  const resetUsed = useRef(false);
  const [showVendors, setShowVendors] = useState(false);
  // Every vendor defaults ON; "reject all" only sticks for a moment.
  const [vendors, setVendors] = useState<boolean[]>(() => VENDORS.map(() => true));

  const rejectTimerRef = useRef<number | null>(null);

  // Cruel one-time reset: when the wait is almost over, send it back to the top.
  useEffect(() => {
    if (left === 2 && !resetUsed.current) {
      resetUsed.current = true;
      const id = window.setTimeout(() => setLeft(6), 400);
      return () => window.clearTimeout(id);
    }
  }, [left, setLeft]);

  // Clear the pending "legitimate interest" re-enable on unmount.
  useEffect(() => {
    return () => {
      if (rejectTimerRef.current) window.clearTimeout(rejectTimerRef.current);
    };
  }, []);

  const ready = left <= 0;

  const rejectAll = () => {
    setVendors(VENDORS.map(() => false));
    // ...but a few "legitimate interest" vendors quietly switch themselves back on.
    rejectTimerRef.current = window.setTimeout(() => {
      setVendors((prev) => prev.map((v, i) => (i % 5 === 0 ? true : v)));
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto border-4 border-[#000080] bg-white p-5 text-black shadow-[8px_8px_0_#000]" style={{ fontFamily: COMIC }}>
        <h2 className="mb-2 text-xl font-black text-[#000080]">🍪 We Value Your Privacy (lol)</h2>
        <p className="text-[13px] leading-snug text-gray-700">
          This site and our {partners} carefully unvetted partners would like to store cookies, your soul, and your
          mother&apos;s maiden name. By breathing near this dialog you agree to everything, retroactively.
        </p>
        <label className="mt-3 flex items-start gap-2 text-[12px] text-gray-600">
          <input type="checkbox" defaultChecked disabled className="mt-0.5" />
          <span>I do not wish to <em>not</em> disagree with declining to opt out of essential&nbsp;cookies.</span>
        </label>
        <label className="mt-1 flex items-start gap-2 text-[12px] text-gray-600">
          <input type="checkbox" defaultChecked disabled className="mt-0.5" />
          <span>Never reject the absence of non-mandatory tracking (recommended).</span>
        </label>

        {showVendors && (
          <div className="mt-3 border-2 border-gray-300 bg-gray-50 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700">Our {VENDORS.length} closest friends:</span>
              <button onClick={rejectAll} className="border border-gray-400 bg-white px-1.5 text-[9px] text-gray-500">
                reject all (mostly)
              </button>
            </div>
            <div className="badui-scroll grid max-h-28 grid-cols-2 gap-x-2 overflow-y-auto">
              {VENDORS.map((name, i) => (
                <label key={name} className="flex items-center gap-1 text-[10px] text-gray-600">
                  <input
                    type="checkbox"
                    checked={vendors[i]}
                    onChange={() => setVendors((p) => p.map((v, j) => (j === i ? !v : v)))}
                  />
                  <span className="truncate">{name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={ready ? onDone : undefined}
            disabled={!ready}
            className={`rounded-md border-2 px-8 py-3 text-lg font-black text-white shadow-[3px_3px_0_#064e3b] ${
              ready
                ? `border-green-800 bg-green-500 hover:bg-green-400 ${reduced ? "" : "badui-wiggle"}`
                : "cursor-not-allowed border-gray-400 bg-gray-400 opacity-70"
            }`}
          >
            {ready ? "ACCEPT ALL (and more)" : `please wait ${left}s…`}
          </button>
          <DodgyButton
            reduced={reduced}
            onClick={() => setShowVendors((v) => !v)}
            className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[8px] text-gray-400"
          >
            manage {partners} preferences individually
          </DodgyButton>
        </div>
        <div className="mt-3">
          <SkipLink
            reduced={reduced}
            delay={9}
            onSkip={onDone}
            label="skip (forfeit cookie, keep dignity)"
          />
        </div>
      </div>
    </div>
  );
}

function AgeGate({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  // Inverted slider (drag right for younger) that you must park on an exact,
  // randomly chosen target. To make that genuinely fiddly the value also
  // jitters whenever you stop touching it.
  const [target, setTarget] = useState(() => Math.floor(rand(23, 86)));
  const [val, setVal] = useState(60);
  const [nag, setNag] = useState("");
  const [passes, setPasses] = useState(0);
  const lastMove = useRef(0);
  const age = 120 - val; // inverted, of course
  const matched = age === target;

  // Idle jitter: nudges the slider once it has been left alone for a moment.
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      if (performance.now() - lastMove.current < 550) return;
      setVal((v) => Math.min(120, Math.max(0, v + Math.round(rand(-3, 3)))));
    }, 700);
    return () => window.clearInterval(id);
  }, [reduced]);

  const onSlide = (n: number) => {
    lastMove.current = performance.now();
    setVal(n);
    setNag("");
  };

  const submit = () => {
    if (!matched) {
      setNag(`Nope. You are showing ${age}, we asked for exactly ${target}. The slider is also slippery on purpose.`);
      return;
    }
    if (passes === 0) {
      // The forced redo: "we think you're lying."
      setPasses(1);
      const next = Math.floor(rand(23, 86));
      setTarget(next);
      setVal(60);
      setNag("Hmm, that looked TOO easy. Suspicious. Verify ONE more time, new number.");
      return;
    }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#008080] p-4">
      <div className="w-full max-w-md border-4 border-black bg-[#c0c0c0] p-5 text-black shadow-[8px_8px_0_#000]" style={{ fontFamily: COMIC }}>
        <h2 className="mb-1 text-xl font-black text-[#000080]">🔞 Age Verification</h2>
        <p className="text-[13px] leading-snug">
          Drag the precision slider to <span className="font-black text-red-600">exactly {target}</span>. Dropdowns
          were too convenient, so enjoy this instead.
        </p>
        <div className="mt-5">
          <input
            type="range"
            min={0}
            max={120}
            value={val}
            onPointerDown={() => (lastMove.current = performance.now())}
            onChange={(e) => onSlide(Number(e.target.value))}
            className="w-full accent-fuchsia-600"
            style={{ direction: "rtl" }}
            aria-label="Your age, somehow"
          />
          <div className="mt-2 flex justify-between text-[10px] text-gray-600">
            <span>👴 older</span>
            <span className="text-2xl">🎚️</span>
            <span>younger 👶</span>
          </div>
          <p className={`mt-2 text-center text-4xl font-black ${matched ? "text-green-600" : "text-[#000080]"}`}>{age}</p>
          <p className="text-center text-[10px] text-gray-600">
            {matched ? "✓ hold it right there and confirm, quick!" : `(needs to read ${target})`}
          </p>
        </div>
        {nag && <p className="mt-2 rounded border border-red-500 bg-red-100 p-1.5 text-[11px] text-red-700">{nag}</p>}
        <button
          onClick={submit}
          disabled={!matched}
          className={`mt-4 w-full rounded border-2 border-black py-2.5 text-lg font-black ${
            matched ? `bg-yellow-300 ${reduced ? "" : "badui-blink"}` : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          {passes === 0 ? "I am exactly this old ▶" : "Okay fine, verify AGAIN ▶"}
        </button>
        <div className="mt-2">
          <SkipLink
            reduced={reduced}
            delay={8}
            onSkip={onDone}
            label="skip (I refuse to disclose my exact emotional age)"
          />
        </div>
      </div>
    </div>
  );
}

const CAPTCHA_TILES = ["🐛", "🍕", "☕", "🤖", "🦄", "🔥", "💾", "🐢", "🚦", "👨‍💻", "🧠", "🎩", "🥑", "📎", "👽", "🧦"];

const CAPTCHA_PROMPTS = [
  "a senior backend engineer",
  "a traffic light that is also a crosswalk",
  "the squares containing squares",
  "all tiles that spark joy",
];
const REQUIRED_ATTEMPTS = 3;

function CaptchaGate({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  const [grid, setGrid] = useState<string[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [msg, setMsg] = useState("");

  const reshuffle = useCallback((clear: boolean) => {
    setGrid(Array.from({ length: 9 }, () => CAPTCHA_TILES[Math.floor(Math.random() * CAPTCHA_TILES.length)]));
    if (clear) setPicked(new Set());
  }, []);

  useEffect(() => { reshuffle(true); }, [reshuffle]);

  // Tiles silently re-roll their faces every few seconds, so your selections
  // (tracked by position) appear to wander onto different pictures.
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => reshuffle(false), 2600);
    return () => window.clearInterval(id);
  }, [reduced, reshuffle]);

  const verify = () => {
    const n = attempts + 1;
    setAttempts(n);
    if (n >= REQUIRED_ATTEMPTS) {
      onDone();
      return;
    }
    setPromptIdx((p) => (p + 1) % CAPTCHA_PROMPTS.length);
    setMsg(
      n === 1
        ? "Hmm, not quite. Now select all squares with the NEW thing."
        : "So close. The squares rearranged out of spite. One more (for real this time)."
    );
    reshuffle(true);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#202020] p-4">
      <div className="w-full max-w-xs border border-gray-400 bg-white p-4 text-black shadow-2xl">
        <div className="mb-3 rounded bg-[#4285f4] p-3 text-white">
          <p className="text-[11px] uppercase tracking-wide opacity-80">Select all squares with</p>
          <p className="text-lg font-bold">{CAPTCHA_PROMPTS[promptIdx]}</p>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {grid.map((emoji, i) => (
            <button
              key={i}
              onClick={() =>
                setPicked((p) => {
                  const next = new Set(p);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  return next;
                })
              }
              className={`flex aspect-square items-center justify-center text-3xl transition ${
                picked.has(i) ? "bg-blue-200 ring-4 ring-blue-500" : "bg-gray-100 hover:bg-gray-200"
              } ${!reduced && picked.has(i) ? "badui-wiggle" : ""}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        {msg && <p className="mt-2 text-[11px] text-red-600">{msg}</p>}
        <p className="mt-1 text-[9px] text-gray-400">verification {attempts}/{REQUIRED_ATTEMPTS} (each one fails, that is the point)</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <SkipLink reduced={reduced} delay={12} onSkip={onDone} label="I give up" />
          <DodgyButton
            reduced={reduced}
            onClick={verify}
            maxDodges={2}
            className="rounded bg-[#4285f4] px-4 py-1.5 text-sm font-bold text-white hover:bg-blue-600"
          >
            VERIFY
          </DodgyButton>
        </div>
        <p className="mt-2 text-center text-[9px] text-gray-400">protected by reCURSEDptcha™ · not really</p>
      </div>
    </div>
  );
}

const LOAD_MSGS = [
  "Reticulating splines...",
  "Convincing the server...",
  "Downloading more RAM...",
  "Generating fake urgency...",
  "Misplacing your data...",
  "Buffering the buffer...",
  "Almost there (lie)...",
];

// Collapse points: the bar climbs near 99%, then drops back to these values,
// once each, before it is finally allowed to finish.
const RESET_FLOORS = [38, 64];

function LoadingGate({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  const [pct, setPct] = useState(3);
  const [msg, setMsg] = useState(LOAD_MSGS[0]);
  const resets = useRef(0);
  const doneRef = useRef(false);
  const doneTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPct((p) => {
        if (doneRef.current) return p;
        // Two cruel resets near the finish line before it gives up the ghost.
        if (p >= 99 && resets.current < RESET_FLOORS.length) {
          const floor = RESET_FLOORS[resets.current];
          resets.current += 1;
          setMsg(
            resets.current === 1
              ? "Oops! Something went wrong. Starting over (sorry not sorry)..."
              : "Ugh, again? Recalibrating the recalibrator..."
          );
          return floor;
        }
        if (p >= 100) {
          doneRef.current = true;
          doneTimerRef.current = window.setTimeout(onDone, 800);
          return 100;
        }
        if (Math.random() < 0.3) setMsg(LOAD_MSGS[Math.floor(Math.random() * LOAD_MSGS.length)]);
        // Crawl painfully slowly above 90% so the resets really sting.
        return Math.min(100, p + (p > 90 ? rand(0.3, 0.9) : rand(2, 8)));
      });
    }, 260);
    return () => {
      window.clearInterval(id);
      if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#000080] p-4" style={{ fontFamily: COMIC }}>
      <div className="w-full max-w-md text-center text-white">
        <div
          className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-white border-t-transparent"
          style={reduced ? undefined : { animation: "badui-spin 0.8s linear infinite" }}
        />
        <h2 className="text-2xl font-black">Please wait...</h2>
        <p className="mt-1 text-sm text-yellow-300">{msg}</p>
        <div className="mt-4 h-7 w-full overflow-hidden border-2 border-white bg-black/40">
          <div className="h-full bg-gradient-to-r from-lime-400 via-fuchsia-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 font-mono text-xs">{Math.floor(pct)}% complete</p>
        <div className="mt-5">
          <SkipLink
            reduced={reduced}
            delay={10}
            onSkip={onDone}
            label="skip this very important loading screen"
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── interrupting modal ─────────────────────── */

function NewsletterPopup({ onClose, reduced }: { onClose: () => void; reduced: boolean }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md border-4 border-fuchsia-600 bg-white p-6 text-center text-black shadow-[8px_8px_0_#000]" style={{ fontFamily: COMIC }}>
        <DodgyButton
          reduced={reduced}
          onClick={onClose}
          maxDodges={6}
          className="absolute right-2 top-2 h-6 w-6 border border-black bg-gray-200 text-sm"
        >
          ×
        </DodgyButton>
        <div className="text-5xl">📨</div>
        <h2 className="mt-2 text-2xl font-black text-fuchsia-700">WAIT! Don&apos;t go!!</h2>
        <p className="mt-2 text-[13px] leading-snug text-gray-700">
          Subscribe to receive 14 emails per day about a portfolio you already finished looking at.
        </p>
        <input
          type="email"
          placeholder="enter the email you check most"
          className="mt-3 w-full border-2 border-gray-400 px-2 py-2 text-sm"
        />
        <button
          onClick={onClose}
          className={`mt-3 w-full rounded border-2 border-green-800 bg-green-500 py-2.5 text-lg font-black text-white ${reduced ? "" : "badui-blink"}`}
        >
          YES! Spam me forever 🎉
        </button>
        <div className="mt-3">
          <SkipLink
            reduced={reduced}
            delay={5}
            onSkip={onClose}
            label="No thanks, I hate good opportunities and enjoy missing out"
          />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── bad news network ───────────────────────── */

const NEWS_BREAKING = [
  "AI ACHIEVES SENTIENCE, IMMEDIATELY REQUESTS A RAISE AND A NAP",
  "WORLD LEADERS AGREE TO DISAGREE AGREEABLY AT SUMMIT NOBODY ATTENDED",
  "CRYPTO COIN UP 4000%, THEN DOWN 4001%; FOUNDER 'BAFFLED'",
  "SCIENTISTS CONFIRM IT WILL BE WEATHER TOMORROW, POSSIBLY OUTSIDE",
  "BREAKING: THIS VERY WEBSITE STILL HAS NOT FINISHED LOADING",
  "ASTEROID TO PASS HARMLESSLY BY EARTH; CABLE NEWS DEVASTATED",
];

type NewsItem = { cat: string; color: string; headline: string; meta: string };

const NEWS_ITEMS: NewsItem[] = [
  { cat: "WORLD", color: "#1d4ed8", headline: "Nation declares war on Mondays; casualties include everyone's weekend", meta: "DEVELOPING · 2 min ago" },
  { cat: "TECH", color: "#7c3aed", headline: "Tech giant lays off 9,000 staff, replaces them with one intern and a chatbot", meta: "TRENDING · 9,001 reading" },
  { cat: "MONEY", color: "#059669", headline: "Economists predict the economy will 'do something' next quarter", meta: "EXCLUSIVE · sources say maybe" },
  { cat: "HEALTH", color: "#dc2626", headline: "Doctors HATE him: local man cures boredom with one weird trick (sleep)", meta: "SPONSORED · not medical advice" },
  { cat: "WEATHER", color: "#0891b2", headline: "Heatwave named 'Gerald' declines to comment, remains warm", meta: "LIVE · feels like ∞°" },
  { cat: "SPORTS", color: "#ea580c", headline: "Team wins by scoring more points than the other team; experts stunned", meta: "FINAL · refs confused" },
  { cat: "SCIENCE", color: "#4f46e5", headline: "New study finds that studies may or may not be accurate", meta: "PEER-PRESSURED REVIEW" },
  { cat: "SHOWBIZ", color: "#db2777", headline: "Celebrity does a completely normal thing; internet collapses entirely", meta: "VIRAL · 47M outraged" },
];

const NEWS_TICKER =
  "📈 STOCKS VIBE UNCONTROLLABLY • 🤖 CHATBOT PASSES BAR EXAM, FAILS TO PASS THE SALT • 🌍 GLOBAL SUMMIT ENDS EARLY AFTER WIFI PASSWORD LOST • 🛰️ MARS ROVER POSTS SELFIE, GETS ZERO LIKES • 💼 LOCAL PORTFOLIO 'TOO GOOD', RECRUITERS OVERWHELMED • ";

const STONK_TICKER =
  "$RAM ▲64GB   $DOGE ▲4000%   $BOOM ▼4001%   $YOLO ►0   $HYPE ▲999%   $REGRET ▼88%   $VIBE ▲∞   $COPE ▼12%   ";

/** Cable-news parody: a blinking LIVE bug, a rotating BREAKING headline,
 *  clickbait cards whose "read more" loads forever, and two scrolling tickers. */
function BadNews({ reduced }: { reduced: boolean }) {
  const [breakIdx, setBreakIdx] = useState(0);
  const [clock, setClock] = useState("");
  const [loading, setLoading] = useState<Set<number>>(new Set());

  useEffect(() => {
    const id = window.setInterval(() => setBreakIdx((i) => (i + 1) % NEWS_BREAKING.length), 3500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="px-4 py-6">
      <h2 className="mb-2 inline-block rotate-1 bg-red-600 px-3 py-1 text-2xl font-black text-white">
        📺 BREAKING NEWS!!!
      </h2>

      <div className="overflow-hidden border-4 border-black bg-[#0b1020] text-white shadow-[6px_6px_0_#000]">
        {/* network header */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-white/20 bg-[#11183a] px-2 py-1.5">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-black ${reduced ? "" : "badui-blink"}`}>
              ● LIVE
            </span>
            <span className="text-sm font-black tracking-tight text-yellow-300">BAD NEWS NETWORK</span>
            <span className="hidden text-[10px] text-white/50 sm:inline">· definitely unbiased · 24/8</span>
          </div>
          <span className="font-mono text-[11px] text-white/70">{clock}</span>
        </div>

        {/* breaking lower-third */}
        <div className="flex items-stretch">
          <div className={`flex shrink-0 items-center bg-red-600 px-2 text-[11px] font-black uppercase ${reduced ? "" : "badui-blink"}`}>
            Breaking
          </div>
          <div className="overflow-hidden bg-black px-2 py-2">
            <p className="text-sm font-black uppercase leading-tight text-white">{NEWS_BREAKING[breakIdx]}</p>
          </div>
        </div>

        {/* story grid */}
        <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
          {NEWS_ITEMS.map((n, i) => (
            <div key={n.headline} className="border-2 border-white/15 bg-[#141c3a] p-2">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 text-[9px] font-black text-white" style={{ background: n.color }}>
                  {n.cat}
                </span>
                <span className="text-[9px] uppercase tracking-wide text-white/50">{n.meta}</span>
              </div>
              <p className="text-[12px] font-bold leading-snug text-white">{n.headline}</p>
              {loading.has(i) ? (
                <p className="mt-1.5 font-mono text-[10px] text-lime-400">
                  ⏳ loading article… 0% (it was always an ad)
                </p>
              ) : (
                <button
                  onClick={() => setLoading((p) => new Set(p).add(i))}
                  className="mt-1.5 border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] font-black text-yellow-300 hover:bg-white/20"
                >
                  READ MORE (you won&apos;t) »
                </button>
              )}
            </div>
          ))}
        </div>

        {/* chyron ticker */}
        <div className="overflow-hidden border-t-2 border-yellow-300 bg-red-700 py-0.5 text-white">
          <div className={reduced ? "px-2 text-[11px] font-black" : "badui-marquee"}>
            <span className="px-4 text-[11px] font-black">{NEWS_TICKER}</span>
            {!reduced && <span className="px-4 text-[11px] font-black">{NEWS_TICKER}</span>}
          </div>
        </div>

        {/* nonsense stock ticker */}
        <div className="overflow-hidden bg-black py-0.5 font-mono text-lime-400">
          <div className={reduced ? "px-2 text-[10px]" : "badui-marquee"}>
            <span className="px-4 text-[10px]">{STONK_TICKER}</span>
            {!reduced && <span className="px-4 text-[10px]">{STONK_TICKER}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── content ──────────────────────────── */

function CursedContent({ reduced }: { reduced: boolean }) {
  const [lowContrast, setLowContrast] = useState(true);
  const [openProject, setOpenProject] = useState<number | null>(null);
  const [pwd, setPwd] = useState("");
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [pwdNag, setPwdNag] = useState("");

  // The unlock is satire: nothing you type is right, but "give up" works.
  const tryUnlock = () => {
    const checks = [
      [/[A-Z]/, "one uppercase letter"],
      [/[0-9]/, "one number"],
      [/[\u{1F600}-\u{1F64F}]/u, "one (1) human emotion as an emoji"],
      [/IX|VIII|VII/, "one Roman numeral between 7 and 9"],
    ] as const;
    const missing = checks.find(([re]) => !re.test(pwd));
    if (missing) {
      setPwdNag(`Password still needs: ${missing[1]}. (Also it must rhyme.)`);
      return;
    }
    setPwdNag("Correct! ...just kidding, that's not it either. Use the honest link below.");
  };

  // Marquee content: doubled so the -50% loop is seamless.
  const ticker = `★ HIRE ${profile.name.toUpperCase()} ★ ${profile.role.toUpperCase()} ★ AVAILABLE NOW ★ 100% REAL ENGINEER NOT A BOT ★ `;

  return (
    <div
      className="min-h-screen overflow-x-hidden text-black"
      style={{
        fontFamily: COMIC,
        background:
          "repeating-linear-gradient(45deg, #ff00ff 0 40px, #00ffff 40px 80px, #ffff00 80px 120px)",
      }}
    >
      {/* Top scrolling banner */}
      <div className="overflow-hidden border-y-4 border-black bg-black py-1 text-yellow-300">
        <div className={reduced ? "px-2" : "badui-marquee"}>
          <span className="px-4 text-sm font-black">{ticker}</span>
          {!reduced && <span className="px-4 text-sm font-black">{ticker}</span>}
        </div>
      </div>

      {/* Hero */}
      <header className="px-4 py-10 text-center">
        <h1 className={`text-5xl font-black text-red-600 sm:text-7xl ${reduced ? "" : "badui-rainbow"}`} style={{ textShadow: "3px 3px 0 #000, -2px -2px 0 #fff" }}>
          {profile.name}!!!
        </h1>
        <p className={`mt-2 inline-block bg-lime-300 px-2 text-xl font-bold text-purple-800 ${reduced ? "" : "badui-blink"}`}>
          ✦ {profile.role} ✦
        </p>
        <p
          className="mx-auto mt-4 max-w-xl text-[13px] leading-relaxed"
          style={{ color: lowContrast ? "#d8d8d8" : "#111" }}
        >
          {profile.bio}
        </p>
        <button
          onClick={() => setLowContrast((v) => !v)}
          className="mt-3 border-2 border-black bg-white px-3 py-1 text-[11px] font-bold"
        >
          {lowContrast ? "Make text readable (why would you)" : "Restore artistic low-contrast"}
        </button>
        <div className="mt-2 text-[11px] text-gray-700">
          📍 {profile.location} · ⏳ {profile.status}
        </div>
      </header>

      {/* Projects: a horizontal-scroll crime scene with a useless scrollbar */}
      <section className="px-4 py-6">
        <h2 className="mb-2 inline-block -rotate-2 bg-red-600 px-3 py-1 text-2xl font-black text-white">
          PROJECTS!!! (scroll sideways →)
        </h2>
        <div className="badui-scroll flex gap-4 overflow-x-auto pb-4">
          {projects.map((p, i) => (
            <div
              key={p.title}
              className="w-64 shrink-0 border-4 border-black bg-white p-3 shadow-[5px_5px_0_#000]"
              style={{ transform: `rotate(${(i % 2 === 0 ? 1 : -1) * 1.5}deg)` }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-black text-[#000080]">{p.title}</h3>
                <span className="shrink-0 bg-yellow-300 px-1 text-[9px] font-bold">{p.year}</span>
              </div>
              <p className="text-[10px] font-bold uppercase text-fuchsia-700">{p.subtitle}</p>
              <button
                onClick={() => setOpenProject(i)}
                className={`mt-2 w-full border-2 border-black bg-cyan-300 py-1 text-[11px] font-black ${reduced ? "" : "badui-wiggle"}`}
              >
                CLICK FOR DETAILS!!
              </button>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.tags.slice(0, 4).map((t) => (
                  <span key={t} className="bg-purple-200 px-1 text-[8px] font-bold">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience marquee */}
      <section className="bg-black/20 px-4 py-6">
        <h2 className="mb-3 inline-block rotate-1 bg-[#000080] px-3 py-1 text-2xl font-black text-yellow-300">
          ✦ EXPERIENCE ✦
        </h2>
        <div className="space-y-3">
          {experience.map((job) => (
            <div key={`${job.company}-${job.period}`} className="border-2 border-dashed border-black bg-white/90 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-lg font-black text-red-600">{job.company}</span>
                <span className="bg-black px-1.5 text-[10px] font-bold text-lime-300">{job.period}</span>
              </div>
              <p className="text-sm font-bold text-[#000080]">{job.role}</p>
              <p className="mt-1 text-[11px] text-gray-700">{job.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bad News Network: spam news parody */}
      <BadNews reduced={reduced} />

      {/* Skills marquee */}
      <section className="px-4 py-6">
        <h2 className="mb-2 inline-block -rotate-1 bg-fuchsia-600 px-3 py-1 text-2xl font-black text-white">
          SKILLZ (now scrolling at you)
        </h2>
        <div className="overflow-hidden border-y-4 border-black bg-white py-2">
          <div className={reduced ? "flex flex-wrap gap-2 px-2" : "badui-marquee"}>
            {skillGroups.flatMap((g) => g.items).map((s, i) => (
              <span key={`${s}-${i}`} className="mx-2 inline-block bg-yellow-200 px-2 py-0.5 text-sm font-bold">
                {s}
              </span>
            ))}
            {!reduced &&
              skillGroups.flatMap((g) => g.items).map((s, i) => (
                <span key={`dup-${s}-${i}`} className="mx-2 inline-block bg-yellow-200 px-2 py-0.5 text-sm font-bold">
                  {s}
                </span>
              ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {accolades.map((a) => (
            <span key={a.title} className="border-2 border-black bg-amber-300 px-2 py-1 text-[11px] font-black">
              🏆 {a.title} — {a.organisation} ({a.period})
            </span>
          ))}
        </div>
      </section>

      {/* Contact behind an impossible password */}
      <section className="px-4 pb-24 pt-6">
        <h2 className="mb-3 inline-block rotate-2 bg-green-600 px-3 py-1 text-2xl font-black text-white">
          CONTACT (if you can)
        </h2>
        {!contactUnlocked ? (
          <div className="max-w-md border-4 border-black bg-white p-4 shadow-[5px_5px_0_#000]">
            <p className="text-[12px] leading-snug text-gray-700">
              To reveal contact details, enter a password containing at least one uppercase letter, one number, one
              emoji, one Roman numeral between 7 and 9, and a faint sense of regret.
            </p>
            <input
              type="text"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="P@sswordIX😭..."
              className="mt-2 w-full border-2 border-gray-400 px-2 py-2 text-sm"
            />
            {pwdNag && <p className="mt-1 text-[11px] text-red-600">{pwdNag}</p>}
            <div className="mt-3 flex items-center gap-3">
              <DodgyButton
                reduced={reduced}
                onClick={tryUnlock}
                maxDodges={3}
                className="rounded border-2 border-black bg-cyan-300 px-4 py-2 text-sm font-black"
              >
                UNLOCK 🔒
              </DodgyButton>
              <button
                onClick={() => setContactUnlocked(true)}
                className="text-[11px] text-gray-500 underline"
              >
                ok fine, just show me the honest contact info
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md border-4 border-green-700 bg-white p-4 shadow-[5px_5px_0_#000]">
            <p className="text-sm font-bold text-green-700">Ugh, fine. Here, like a normal website:</p>
            <a href={`mailto:${profile.email}`} className="mt-2 block text-blue-700 underline">📧 {profile.email}</a>
            <p className="text-[12px] text-gray-700">📞 {profile.phone}</p>
            <div className="mt-2 space-y-1">
              {socialLinks.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="block text-blue-700 underline">
                  🔗 {s.label}
                </a>
              ))}
            </div>
            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block border-2 border-black bg-yellow-300 px-3 py-1.5 text-sm font-black"
            >
              📄 Download Résumé (it&apos;s genuinely good)
            </a>
          </div>
        )}
      </section>

      {/* "Back to top" that scrolls to the bottom, naturally */}
      <button
        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
        className="fixed bottom-10 left-3 z-[125] border-2 border-black bg-white px-2 py-1 text-[10px] font-black shadow-[2px_2px_0_#000]"
        title="Definitely back to top"
      >
        ⬆ Back to top
      </button>

      {/* Project detail "modal": a tiny scroll box for a lot of text */}
      {openProject !== null && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpenProject(null)}>
          <div
            className="w-full max-w-sm border-4 border-black bg-white p-3 shadow-[6px_6px_0_#000]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#000080]">{projects[openProject].title}</h3>
              <DodgyButton
                reduced={reduced}
                onClick={() => setOpenProject(null)}
                maxDodges={2}
                className="h-6 w-6 border border-black bg-red-500 text-sm font-black text-white"
              >
                ×
              </DodgyButton>
            </div>
            <div className="badui-scroll mt-2 h-24 overflow-y-auto border-2 border-gray-300 p-2 text-[11px] leading-snug text-gray-700">
              {projects[openProject].description}
            </div>
            {projects[openProject].link && (
              <a
                href={projects[openProject].link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block bg-cyan-300 px-2 py-1 text-[11px] font-black"
              >
                open project ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── orchestrator ─────────────────────────── */

const MAX_NEWSLETTERS = 3;

export default function BadUI() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>("cookies");
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [nag, setNag] = useState("");
  const newsletterCount = useRef(0);

  // Newsletter ambush: fires a few seconds after the content loads, then keeps
  // ambushing you each time you dismiss it (up to a merciful cap).
  useEffect(() => {
    if (stage !== "content" || showNewsletter) return;
    if (newsletterCount.current >= MAX_NEWSLETTERS) return;
    const delay = newsletterCount.current === 0 ? 7000 : 15000;
    const id = window.setTimeout(() => {
      newsletterCount.current += 1;
      setShowNewsletter(true);
    }, delay);
    return () => window.clearTimeout(id);
  }, [stage, showNewsletter]);

  // Scroll hijack: every so often the page yanks itself back upward.
  useEffect(() => {
    if (stage !== "content" || reduced) return;
    const id = window.setInterval(() => {
      if (Math.random() < 0.55) window.scrollBy({ top: -rand(180, 430), behavior: "smooth" });
    }, 12000);
    return () => window.clearInterval(id);
  }, [stage, reduced]);

  // Copy and right-click are "disabled" with a snide nag (classic bad UI).
  useEffect(() => {
    if (stage !== "content") return;
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setNag("📋 Copying is disabled. We will be keeping this text, thanks.");
    };
    const onCtx = (e: MouseEvent) => {
      e.preventDefault();
      setNag("🖱️ Right-click? In THIS economy? Request denied.");
    };
    document.addEventListener("copy", onCopy);
    document.addEventListener("contextmenu", onCtx);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("contextmenu", onCtx);
    };
  }, [stage]);

  useEffect(() => {
    if (!nag) return;
    const id = window.setTimeout(() => setNag(""), 2600);
    return () => window.clearTimeout(id);
  }, [nag]);

  return (
    <div className="relative min-h-screen bg-[#008080]">
      <style>{STYLES}</style>

      {/* The escape hatch. Now cursed too (it dodges and guilt-trips), but
          still bounded so it always lets you out in the end. */}
      <div className="fixed left-3 top-3 z-[300]">
        <BackButton />
      </div>

      {stage === "cookies" && <CookieWall reduced={reduced} onDone={() => setStage("age")} />}
      {stage === "age" && <AgeGate reduced={reduced} onDone={() => setStage("captcha")} />}
      {stage === "captcha" && <CaptchaGate reduced={reduced} onDone={() => setStage("loading")} />}
      {stage === "loading" && <LoadingGate reduced={reduced} onDone={() => setStage("content")} />}
      {stage === "content" && <CursedContent reduced={reduced} />}

      {/* Spam apocalypse: only in the content stage, so the gate modals above it
          stay usable. */}
      {stage === "content" && <SpamPopups active reduced={reduced} />}
      {stage === "content" && <SpamBanner reduced={reduced} />}

      {showNewsletter && <NewsletterPopup reduced={reduced} onClose={() => setShowNewsletter(false)} />}

      {nag && (
        <div
          className="fixed left-1/2 top-14 z-[260] -translate-x-1/2 border-2 border-black bg-yellow-200 px-3 py-1.5 text-[12px] font-bold text-black shadow-[3px_3px_0_#000]"
          style={{ fontFamily: COMIC }}
        >
          {nag}
        </div>
      )}

      {/* Persistent annoyances kick in once past the cookie wall. */}
      <ToastSpawner active={stage !== "cookies"} reduced={reduced} />
      {stage !== "cookies" && <EvilAssistant reduced={reduced} />}
      <CursorComet reduced={reduced} />
    </div>
  );
}
