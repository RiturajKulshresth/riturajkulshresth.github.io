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
    let last = 0;
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      const s = document.createElement("span");
      s.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
      s.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;font-size:${rand(10, 22)}px;pointer-events:none;z-index:2147483000;animation:badui-sparkle 0.7s ease-out forwards;`;
      layer.appendChild(s);
      window.setTimeout(() => s.remove(), 720);
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
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
];

/** Toasts that pop into a random corner and pile up. Capped, and each has a
 *  working (if tiny) close. */
function ToastSpawner({ active }: { active: boolean }) {
  const [items, setItems] = useState<{ id: number; emoji: string; text: string; corner: number }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setItems((prev) => {
        if (prev.length >= 4) return prev;
        const t = TOASTS[Math.floor(Math.random() * TOASTS.length)];
        return [...prev, { id: nextId.current++, emoji: t.emoji, text: t.text, corner: Math.floor(Math.random() * 4) }];
      });
    }, 5200);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;
  const corners = [
    "top-16 left-3",
    "top-16 right-3",
    "bottom-3 left-3",
    "bottom-3 right-3",
  ];

  return (
    <>
      {items.map((it, i) => (
        <div
          key={it.id}
          className={`fixed z-[120] max-w-[230px] border-2 border-yellow-300 bg-[#000080] p-2 text-[11px] text-white shadow-[4px_4px_0_#ff00ff] ${corners[it.corner]}`}
          style={{ marginTop: `${(i % 2) * 64}px`, fontFamily: COMIC, animation: "badui-toast-in 0.25s ease-out" }}
        >
          <div className="flex items-start gap-1.5">
            <span className="text-base leading-none">{it.emoji}</span>
            <span className="leading-tight">{it.text}</span>
            <button
              onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
              className="ml-auto h-3 w-3 shrink-0 bg-red-600 text-[8px] leading-3 text-white hover:bg-red-500"
              aria-label="Close (we doubt it)"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </>
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
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hidden) return;
    const id = window.setTimeout(() => setHidden(false), 4500);
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

function CookieWall({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  const [partners] = useState(() => Math.floor(rand(1180, 1480)));
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg border-4 border-[#000080] bg-white p-5 text-black shadow-[8px_8px_0_#000]" style={{ fontFamily: COMIC }}>
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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={onDone}
            className={`rounded-md border-2 border-green-800 bg-green-500 px-8 py-3 text-lg font-black text-white shadow-[3px_3px_0_#064e3b] hover:bg-green-400 ${reduced ? "" : "badui-wiggle"}`}
          >
            ACCEPT ALL (and more)
          </button>
          <DodgyButton
            reduced={reduced}
            onClick={onDone}
            className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[8px] text-gray-400"
          >
            manage 1,400 preferences individually
          </DodgyButton>
        </div>
        <button onClick={onDone} className="mt-3 text-[10px] text-gray-300 underline hover:text-gray-400">
          skip (forfeit cookie, keep dignity)
        </button>
      </div>
    </div>
  );
}

function AgeGate({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  // Inverted slider with a giant thumb and no labels: drag right for younger.
  const [val, setVal] = useState(50);
  const [nag, setNag] = useState("");
  const age = 120 - val; // inverted, of course

  const submit = () => {
    if (age < 18) {
      setNag(`You appear to be ${age}. Bold of you. Click again to legally become 18.`);
      setVal(0);
      return;
    }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#008080] p-4">
      <div className="w-full max-w-md border-4 border-black bg-[#c0c0c0] p-5 text-black shadow-[8px_8px_0_#000]" style={{ fontFamily: COMIC }}>
        <h2 className="mb-1 text-xl font-black text-[#000080]">🔞 Age Verification</h2>
        <p className="text-[13px] leading-snug">
          Confirm your exact age using the precision slider below. Numbers would have been too easy.
        </p>
        <div className="mt-5">
          <input
            type="range"
            min={0}
            max={120}
            value={val}
            onChange={(e) => { setVal(Number(e.target.value)); setNag(""); }}
            className="w-full accent-fuchsia-600"
            style={{ direction: "rtl" }}
            aria-label="Your age, somehow"
          />
          <div className="mt-2 flex justify-between text-[10px] text-gray-600">
            <span>👴 older</span>
            <span className="text-2xl">🎚️</span>
            <span>younger 👶</span>
          </div>
          <p className="mt-2 text-center text-3xl font-black text-[#000080]">{age}</p>
          <p className="text-center text-[10px] text-gray-600">(probably your age)</p>
        </div>
        {nag && <p className="mt-2 rounded border border-red-500 bg-red-100 p-1.5 text-[11px] text-red-700">{nag}</p>}
        <button
          onClick={submit}
          className={`mt-4 w-full rounded border-2 border-black bg-yellow-300 py-2.5 text-lg font-black ${reduced ? "" : "badui-blink"}`}
        >
          I am exactly this old ▶
        </button>
        <button onClick={onDone} className="mt-2 block text-[10px] text-gray-500 underline">
          skip (I refuse to disclose my exact emotional age)
        </button>
      </div>
    </div>
  );
}

const CAPTCHA_TILES = ["🐛", "🍕", "☕", "🤖", "🦄", "🔥", "💾", "🐢", "🚦", "👨‍💻", "🧠", "🎩", "🥑", "📎", "👽", "🧦"];

function CaptchaGate({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  const [grid, setGrid] = useState<string[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [msg, setMsg] = useState("");

  const shuffle = useCallback(() => {
    const next = Array.from({ length: 9 }, () => CAPTCHA_TILES[Math.floor(Math.random() * CAPTCHA_TILES.length)]);
    setGrid(next);
    setPicked(new Set());
  }, []);

  useEffect(() => { shuffle(); }, [shuffle]);

  const verify = () => {
    const n = attempts + 1;
    setAttempts(n);
    if (n >= 2) { onDone(); return; }
    setMsg("Hmm, that's not quite right. The squares have rearranged out of spite. Try again.");
    shuffle();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#202020] p-4">
      <div className="w-full max-w-xs border border-gray-400 bg-white p-4 text-black shadow-2xl">
        <div className="mb-3 rounded bg-[#4285f4] p-3 text-white">
          <p className="text-[11px] uppercase tracking-wide opacity-80">Select all squares with</p>
          <p className="text-lg font-bold">a senior backend engineer</p>
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
        <div className="mt-3 flex items-center justify-between">
          <button onClick={onDone} className="text-[10px] text-gray-400 underline">I give up</button>
          <button onClick={verify} className="rounded bg-[#4285f4] px-4 py-1.5 text-sm font-bold text-white hover:bg-blue-600">
            VERIFY
          </button>
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

function LoadingGate({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(3);
  const [msg, setMsg] = useState(LOAD_MSGS[0]);
  const resetUsed = useRef(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPct((p) => {
        if (doneRef.current) return p;
        // The cruel reset: hit 99%, then collapse back to 41% exactly once.
        if (p >= 99 && !resetUsed.current) {
          resetUsed.current = true;
          setMsg("Oops! Something went wrong. Starting over (sorry not sorry)...");
          return 41;
        }
        if (p >= 100) {
          doneRef.current = true;
          window.setTimeout(onDone, 700);
          return 100;
        }
        if (Math.random() < 0.3) setMsg(LOAD_MSGS[Math.floor(Math.random() * LOAD_MSGS.length)]);
        return Math.min(100, p + (p > 90 ? rand(0.4, 1.4) : rand(3, 13)));
      });
    }, 240);
    return () => window.clearInterval(id);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#000080] p-4" style={{ fontFamily: COMIC }}>
      <div className="w-full max-w-md text-center text-white">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-white border-t-transparent" style={{ animation: "badui-spin 0.8s linear infinite" }} />
        <h2 className="text-2xl font-black">Please wait...</h2>
        <p className="mt-1 text-sm text-yellow-300">{msg}</p>
        <div className="mt-4 h-7 w-full overflow-hidden border-2 border-white bg-black/40">
          <div className="h-full bg-gradient-to-r from-lime-400 via-fuchsia-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 font-mono text-xs">{Math.floor(pct)}% complete</p>
        <button onClick={onDone} className="mt-5 text-[11px] text-sky-200 underline hover:text-white">
          skip this very important loading screen
        </button>
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
          maxDodges={3}
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
        <button onClick={onClose} className="mt-3 block w-full text-[11px] text-gray-400 underline">
          No thanks, I hate good opportunities and enjoy missing out
        </button>
      </div>
    </div>
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
        className="fixed bottom-3 left-3 z-[110] border-2 border-black bg-white px-2 py-1 text-[10px] font-black shadow-[2px_2px_0_#000]"
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

export default function BadUI() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>("cookies");
  const [showNewsletter, setShowNewsletter] = useState(false);

  // Newsletter ambush: fires once, a few seconds after the content loads.
  useEffect(() => {
    if (stage !== "content") return;
    const id = window.setTimeout(() => setShowNewsletter(true), 7000);
    return () => window.clearTimeout(id);
  }, [stage]);

  return (
    <div className="relative min-h-screen bg-[#008080]">
      <style>{STYLES}</style>

      {/* The one honest, always-reachable escape. */}
      <div className="fixed left-3 top-3 z-[300]">
        <BackButton />
      </div>

      {stage === "cookies" && <CookieWall reduced={reduced} onDone={() => setStage("age")} />}
      {stage === "age" && <AgeGate reduced={reduced} onDone={() => setStage("captcha")} />}
      {stage === "captcha" && <CaptchaGate reduced={reduced} onDone={() => setStage("loading")} />}
      {stage === "loading" && <LoadingGate onDone={() => setStage("content")} />}
      {stage === "content" && <CursedContent reduced={reduced} />}

      {showNewsletter && <NewsletterPopup reduced={reduced} onClose={() => setShowNewsletter(false)} />}

      {/* Persistent annoyances kick in once past the cookie wall. */}
      <ToastSpawner active={stage !== "cookies"} />
      {stage !== "cookies" && <EvilAssistant reduced={reduced} />}
      <CursorComet reduced={reduced} />
    </div>
  );
}
