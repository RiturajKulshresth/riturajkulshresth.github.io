/**
 * Munchkin Cat render mode. A side-scrolling platformer where the cat explores
 * rooms and inspects furniture stations that surface portfolio content from
 * `@/lib/data`. Yarn collection and reaching the front door trigger victory.
 */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gamepad2,
  Volume2,
  VolumeX,
  Tv,
  Cat,
  X,
  Mail,
  ExternalLink,
} from "lucide-react";
import {
  profile,
  experience,
  projects,
  skillGroups,
  socialLinks,
  RESUME_PATH,
} from "@/lib/data";
import BackButton from "./back-button";

type StationKind = "desk" | "shelf" | "pc" | "toolbox" | "mailbox";

interface Station {
  id: string;
  label: string;
  emoji: string;
  kind: StationKind;
  x: number;
  accent: string;
  title: string;
  content: React.ReactNode;
}

interface Marker {
  id: string;
  label: string;
  emoji: string;
  kind: StationKind;
  x: number;
  accent: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
  maxLife: number;
}

const WORLD_WIDTH = 3000;
const GROUND_Y = 360;
const GOAL_X = 2900;

export default function MunchkinCat() {
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [crtOn, setCrtOn] = useState(true);
  const [score, setScore] = useState(0);
  const [victory, setVictory] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [visited, setVisited] = useState<Set<string>>(new Set());

  const mutedRef = useRef(isMuted);
  const crtRef = useRef(crtOn);
  mutedRef.current = isMuted;
  crtRef.current = crtOn;

  const stations: Station[] = [
    {
      id: "about",
      label: "Writing Desk",
      emoji: "🪑",
      kind: "desk",
      x: 360,
      accent: "#d97706",
      title: "About the Cat's Human",
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-amber-100/90">
          <p className="font-bold text-amber-300">{profile.role}</p>
          <p>{profile.bio}</p>
          <div className="flex flex-wrap gap-3 pt-1 font-mono text-[11px] text-amber-200/60">
            <span>📍 {profile.location}</span>
            <span>✉️ {profile.email}</span>
            <span>🟢 {profile.status}</span>
          </div>
        </div>
      ),
    },
    {
      id: "experience",
      label: "Bookshelf",
      emoji: "📚",
      kind: "shelf",
      x: 980,
      accent: "#7c3aed",
      title: "Career Bookshelf",
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-violet-100/90">
          {experience.map((job) => (
            <div
              key={`${job.company}-${job.period}`}
              className="rounded border border-violet-900/50 bg-violet-950/20 p-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-violet-200">{job.company}</span>
                <span className="shrink-0 font-mono text-[10px] text-violet-300/50">
                  {job.period}
                </span>
              </div>
              <p className="text-[11px] text-violet-300/90">{job.role}</p>
              <p className="mt-1 text-[11px] text-violet-100/60">{job.summary}</p>
              <ul className="mt-1.5 space-y-1">
                {job.highlights.map((h, i) => (
                  <li key={i} className="flex gap-1.5 text-[10.5px] text-violet-100/70">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "projects",
      label: "Workstation",
      emoji: "🖥️",
      kind: "pc",
      x: 1620,
      accent: "#0ea5e9",
      title: "Project Workstation",
      content: (
        <div className="space-y-2.5 text-xs leading-relaxed text-sky-100/90">
          {projects.map((p) => (
            <div
              key={p.title}
              className="rounded border border-sky-900/50 bg-sky-950/20 p-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-sky-200">{p.title}</span>
                <span className="shrink-0 font-mono text-[10px] text-sky-300/50">{p.year}</span>
              </div>
              <p className="text-[10px] uppercase tracking-wide text-sky-300/70">{p.subtitle}</p>
              <p className="mt-0.5 text-[11px] text-sky-100/60">{p.description}</p>
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-sky-300 hover:underline"
                >
                  open <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "skills",
      label: "Toolbox",
      emoji: "🧰",
      kind: "toolbox",
      x: 2240,
      accent: "#16a34a",
      title: "The Toolbox",
      content: (
        <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
          {skillGroups.map((g) => (
            <div
              key={g.title}
              className="rounded border border-emerald-900/50 bg-emerald-950/20 p-2.5"
            >
              <span className="block font-bold text-emerald-300">{g.title}</span>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/60">
                {g.items.join(" · ")}
              </p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "contact",
      label: "Mailbox",
      emoji: "📮",
      kind: "mailbox",
      x: 2760,
      accent: "#db2777",
      title: "The Mailbox",
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-pink-100/90">
          <a
            href={`mailto:${profile.email}`}
            className="flex items-center gap-2 font-mono text-pink-300 transition hover:text-pink-100"
          >
            <Mail className="h-4 w-4" /> {profile.email}
          </a>
          <p className="font-mono text-[11px] text-pink-200/60">{profile.phone}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {socialLinks.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wide text-pink-200/70 transition hover:text-pink-300"
              >
                {s.label} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
          <a
            href={RESUME_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block rounded bg-pink-500 px-3.5 py-2 font-bold uppercase tracking-wider text-slate-950 transition hover:bg-pink-400"
          >
            Download Resume
          </a>
        </div>
      ),
    },
  ];

  const markers: Marker[] = stations.map(({ id, label, emoji, kind, x, accent }) => ({
    id,
    label,
    emoji,
    kind,
    x,
    accent,
  }));

  const activeStation = stations.find((s) => s.id === activeStationId);

  const replay = () => {
    setScore(0);
    setVictory(false);
    setActiveStationId(null);
    setVisited(new Set());
    setGameKey((k) => k + 1); // remount the game → fresh crystals/player
  };

  const handleInteract = (id: string) => {
    setActiveStationId(id);
    setVisited((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <div className="relative flex h-screen min-h-screen w-full select-none flex-col overflow-hidden bg-[#2a1c12] pb-3 text-amber-50">
      {/* HUD */}
      <header className="z-10 flex select-none flex-col gap-3 border-b border-amber-950/60 bg-[#241710]/90 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <Cat className="h-5 w-5 animate-pulse text-amber-400" />
            <div>
              <h1 className="font-mono text-xs font-black uppercase tracking-widest text-white">
                Munchkin Cat · House Tour
              </h1>
              <p className="font-mono text-[9px] tracking-wide text-amber-200/50">
                Hop the little cat around the house and visit each object
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs font-bold text-amber-300">
          <span className="rounded-lg border border-amber-900/60 bg-amber-950/40 px-2.5 py-1">
            EXPLORED <span className="font-black text-[#fbbf24]">{visited.size}/{stations.length}</span>
          </span>
          <span className="rounded-lg border border-amber-900/60 bg-amber-950/40 px-2.5 py-1">
            YARN <span className="font-black text-[#fbbf24]">{score}</span>
          </span>
          <button
            onClick={() => setCrtOn((v) => !v)}
            className={`rounded-lg border p-1.5 transition ${
              crtOn
                ? "border-amber-800 bg-amber-950 text-amber-400"
                : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300"
            }`}
            title="Toggle CRT"
          >
            <Tv className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMuted((v) => !v)}
            className="rounded-lg border border-amber-950 bg-[#1a1009] p-1.5 transition hover:bg-amber-950"
            title="Toggle sound"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Canvas stage (keyed so Replay remounts and resets the game) */}
      <main className="relative z-10 flex flex-grow flex-col overflow-hidden px-3 py-3">
        <Game
          key={gameKey}
          markers={markers}
          mutedRef={mutedRef}
          crtRef={crtRef}
          onInteract={handleInteract}
          onScore={(d) => setScore((s) => Math.max(0, s + d))}
          onVictory={() => setVictory(true)}
        />
      </main>

      {/* Station dialog */}
      <AnimatePresence>
        {activeStation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex select-none items-center justify-center p-4 backdrop-blur-md"
            style={{ background: "rgba(0,0,0,0.85)" }}
            onClick={() => setActiveStationId(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 24 }}
              transition={{ type: "spring", stiffness: 130, damping: 17 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-[#1a1009] p-6 shadow-[0_0_50px_rgba(217,119,6,0.25)]"
              style={{ borderColor: `${activeStation.accent}55` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: activeStation.accent }} />
              <header className="mb-4 flex items-start justify-between border-b border-white/10 pb-3 pl-3">
                <div>
                  <h2 className="flex items-center gap-2 font-mono text-base font-black uppercase tracking-wide text-white">
                    <span>{activeStation.emoji}</span> {activeStation.title}
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: activeStation.accent }}>
                    {activeStation.label}
                  </p>
                </div>
                <button
                  onClick={() => setActiveStationId(null)}
                  className="rounded-lg border border-amber-950 bg-[#241710] p-1 text-amber-200/70 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="max-h-[55vh] overflow-y-auto pl-3 pr-1 custom-scrollbar">{activeStation.content}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory */}
      <AnimatePresence>
        {victory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex select-none items-center justify-center p-4 backdrop-blur-md"
            style={{ background: "rgba(0,0,0,0.92)" }}
          >
            <motion.div
              initial={{ scale: 0.9, rotate: -2 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 110, damping: 14 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-amber-500 bg-[#1a1009] p-8 text-center shadow-[0_0_80px_rgba(217,119,6,0.4)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500 bg-amber-950 text-3xl">
                🐱
              </div>
              <h2 className="font-mono text-2xl font-black uppercase tracking-wider text-white">Home Sweet Home</h2>
              <p className="mt-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-amber-300">
                The munchkin cat made it to the door
              </p>
              <div className="my-6 rounded-xl border border-amber-950 bg-zinc-950 p-4 font-mono text-xs">
                <div className="flex justify-between text-amber-200/70">
                  <span>Yarn collected</span>
                  <span className="font-black text-yellow-400">{score} pts</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={replay}
                  className="flex-grow rounded-xl bg-gradient-to-r from-amber-600 to-amber-400 py-3 font-mono text-xs font-black uppercase text-slate-950 transition hover:brightness-110"
                >
                  Replay 🧶
                </button>
                <button
                  onClick={() => setVictory(false)}
                  className="rounded-xl border border-amber-950 bg-[#241710] px-4 py-3 font-mono text-xs font-extrabold uppercase text-white transition hover:bg-amber-950"
                >
                  Free roam
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * The game itself. Lives in its own component so a `key` change from the
 * parent fully remounts it, giving Replay a clean reset (crystals, player,
 * goal flag) without any imperative teardown.
 * ──────────────────────────────────────────────────────────────────────── */
function Game({
  markers,
  mutedRef,
  crtRef,
  onInteract,
  onScore,
  onVictory,
}: {
  markers: Marker[];
  mutedRef: React.MutableRefObject<boolean>;
  crtRef: React.MutableRefObject<boolean>;
  onInteract: (id: string) => void;
  onScore: (delta: number) => void;
  onVictory: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const padRef = useRef<(action: string, down: boolean) => void>(() => {});
  // Label of the object the cat is currently standing next to (null = nothing
  // inspectable in range), surfaced so the Inspect pad button can disable.
  const [nearLabel, setNearLabel] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Pixel-art sprite kit ──────────────────────────────────────────────
    // Decoded asynchronously; until each image is ready we fall back to the
    // original canvas vector art so there is never a blank frame.
    const SB = "/munchkin-sprites";
    const mk = (p: string) => {
      const i = new Image();
      i.src = `${SB}/${p}.png`;
      return i;
    };
    const S = {
      idle: [1, 2, 3, 4].map((n) => mk(`cat/idle_${n}`)),
      walk: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => mk(`cat/walk_${n}`)),
      jump1: mk("cat/jump_1"),
      jump2: mk("cat/jump_2"),
      fall1: mk("cat/fall_1"),
      fall2: mk("cat/fall_2"),
      land1: mk("cat/land_1"),
      ball: [1, 2, 3, 4, 5, 6, 7].map((n) => mk(`items/ball_${n}`)),
      door: mk("objects/front_door"),
    };
    const furnImg: Record<StationKind, HTMLImageElement> = {
      desk: mk("objects/desk_lamp"),
      shelf: mk("objects/bookshelf"),
      pc: mk("objects/computer"),
      toolbox: mk("objects/toolbox"),
      mailbox: mk("objects/mailbox"),
    };
    const ready = (img?: HTMLImageElement) =>
      !!img && img.complete && img.naturalWidth > 0;
    // Draw a sprite anchored at (cx, bottomY), centred horizontally, with an
    // optional horizontal flip and per-axis squash/stretch.
    const blit = (
      img: HTMLImageElement | undefined,
      cx: number,
      bottomY: number,
      scale: number,
      flip = false,
      sxz = 1,
      syz = 1
    ) => {
      if (!ready(img)) return false;
      const w = img!.naturalWidth * scale * sxz;
      const h = img!.naturalHeight * scale * syz;
      ctx.save();
      ctx.translate(cx, bottomY);
      ctx.scale(flip ? -1 : 1, 1);
      ctx.drawImage(img!, -w / 2, -h, w, h);
      ctx.restore();
      return true;
    };
    const CAT_SCALE = 1.3;
    const FURN_SCALE = 1.25;
    const DOOR_SCALE = 1.7;
    const BALL_SCALE = 1.4;

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent?.clientWidth || 800;
      canvas.height = parent?.clientHeight || 420;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const playSound = (type: "coin" | "jump" | "victory") => {
      if (mutedRef.current) return;
      if (!audioCtxRef.current) {
        try {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtxRef.current = new Ctx();
        } catch {
          return;
        }
      }
      const actx = audioCtxRef.current;
      if (!actx) return;
      if (actx.state === "suspended") actx.resume();
      try {
        if (type === "victory") {
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            const o = actx.createOscillator();
            const g = actx.createGain();
            o.connect(g);
            g.connect(actx.destination);
            o.type = "triangle";
            o.frequency.setValueAtTime(f, actx.currentTime + i * 0.1);
            g.gain.setValueAtTime(0.02, actx.currentTime + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.5 + i * 0.1);
            o.start(actx.currentTime + i * 0.1);
            o.stop(actx.currentTime + 0.5 + i * 0.1);
          });
          return;
        }
        const o = actx.createOscillator();
        const g = actx.createGain();
        o.connect(g);
        g.connect(actx.destination);
        if (type === "coin") {
          o.type = "sine";
          o.frequency.setValueAtTime(880, actx.currentTime);
          o.frequency.setValueAtTime(1318, actx.currentTime + 0.08);
          g.gain.setValueAtTime(0.02, actx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.2);
          o.start();
          o.stop(actx.currentTime + 0.2);
        } else {
          o.type = "sine";
          o.frequency.setValueAtTime(320, actx.currentTime);
          o.frequency.exponentialRampToValueAtTime(620, actx.currentTime + 0.12);
          g.gain.setValueAtTime(0.015, actx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.14);
          o.start();
          o.stop(actx.currentTime + 0.14);
        }
      } catch {
        /* ignore */
      }
    };

    // Floor + furniture platforms.
    const platforms = [
      { x: 0, y: GROUND_Y, w: WORLD_WIDTH, h: 80 },
      { x: 250, y: 280, w: 120, h: 12 },
      { x: 540, y: 235, w: 120, h: 12 },
      { x: 820, y: 265, w: 150, h: 12 },
      { x: 1120, y: 215, w: 130, h: 12 },
      { x: 1400, y: 260, w: 120, h: 12 },
      { x: 1720, y: 220, w: 150, h: 12 },
      { x: 2020, y: 255, w: 140, h: 12 },
      { x: 2320, y: 210, w: 150, h: 12 },
      { x: 2580, y: 255, w: 130, h: 12 },
    ];

    // Yarn balls to collect.
    const yarns = [
      230, 320, 560, 850, 1000, 1150, 1430, 1740, 1900, 2050, 2340, 2440, 2600,
    ].map((x, i) => ({ x, y: i % 2 === 0 ? 230 : 305, collected: false }));

    // Framed pictures on the wall (parallax mid layer).
    const frames = Array.from({ length: 8 }, (_, i) => ({
      x: 180 + i * 360,
      y: 90 + (i % 2) * 30,
      w: 54,
      h: 42,
    }));

    const player = {
      x: 90,
      y: 300,
      vx: 0,
      vy: 0,
      w: 26,
      h: 24,
      grounded: false,
      facing: 1,
      anim: 0,
      blink: 0,
      earTwitch: 0,
      idle: 0,
      land: 0,
      jumpsLeft: 2,
    };

    const keys: Record<string, boolean> = {};
    let particles: Particle[] = [];
    let wasJumpDown = false;
    let goalReached = false;
    let lastNear: string | null = null;

    const addParticles = (
      x: number,
      y: number,
      n: number,
      colors: string[],
      spread: number,
      life: number
    ) => {
      for (let i = 0; i < n; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * spread,
          vy: (Math.random() - 0.7) * spread,
          r: Math.random() * 2.5 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          life,
          maxLife: life,
        });
      }
    };

    const interact = () => {
      const near = markers.find((s) => Math.abs(player.x + 13 - s.x) <= 70);
      if (near) {
        onInteract(near.id);
        playSound("coin");
      }
    };

    const jumpKeyDown = () => keys["w"] || keys[" "] || keys["arrowup"] || keys["jump"];

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      keys[k] = true;
      if (k === "e") interact();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Direct canvas tap: inspect a nearby station, otherwise hop. Gives touch
    // players a way to act without hunting for the pad, and works for mouse too.
    const onCanvasPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const near = markers.find((s) => Math.abs(player.x + 13 - s.x) <= 70);
      if (near) {
        interact();
      } else {
        keys["jump"] = true;
      }
    };
    const onCanvasPointerUp = () => {
      keys["jump"] = false;
    };
    canvas.addEventListener("pointerdown", onCanvasPointerDown);
    window.addEventListener("pointerup", onCanvasPointerUp);
    window.addEventListener("pointercancel", onCanvasPointerUp);

    padRef.current = (action: string, down: boolean) => {
      if (action === "left") keys["a"] = down;
      else if (action === "right") keys["d"] = down;
      else if (action === "jump") keys["jump"] = down;
      else if (action === "interact" && down) interact();
    };

    const gravity = 0.62;
    const speed = 4.2;
    const JUMP_V = 11.6;
    let raf = 0;

    const loop = () => {
      const W = canvas.width;
      const H = canvas.height;
      const t = Date.now() / 1000;
      // Centre the cat in the viewport; clamp so we never show empty space past world edges.
      const cameraX = Math.max(0, Math.min(WORLD_WIDTH - W, player.x - W / 2 + 13));
      // Keep pixel art crisp (canvas resize resets this, so set it each frame).
      ctx.imageSmoothingEnabled = false;

      // ── Background: cozy room ──
      const wall = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      wall.addColorStop(0, "#3a2a3f");
      wall.addColorStop(1, "#2e2031");
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, W, GROUND_Y);

      // Wallpaper stripes (slow parallax)
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "#f5e6c8";
      const stripeOff = -((cameraX * 0.1) % 48);
      for (let sx = stripeOff; sx < W; sx += 48) ctx.fillRect(sx, 0, 22, GROUND_Y);
      ctx.restore();

      // Big sunny window
      const winX = 720 - cameraX * 0.25;
      const winY = 70;
      const winW = 220;
      const winH = 150;
      const sky = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      sky.addColorStop(0, "#9fd3ff");
      sky.addColorStop(1, "#d8f0ff");
      ctx.fillStyle = sky;
      ctx.fillRect(winX, winY, winW, winH);
      // sun + hills
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(winX + winW - 50, winY + 44, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#86c98a";
      ctx.beginPath();
      ctx.moveTo(winX, winY + winH);
      ctx.quadraticCurveTo(winX + winW * 0.4, winY + winH - 46, winX + winW * 0.8, winY + winH - 8);
      ctx.lineTo(winX + winW, winY + winH);
      ctx.closePath();
      ctx.fill();
      // window frame
      ctx.strokeStyle = "#e7d3b3";
      ctx.lineWidth = 8;
      ctx.strokeRect(winX, winY, winW, winH);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(winX + winW / 2, winY);
      ctx.lineTo(winX + winW / 2, winY + winH);
      ctx.moveTo(winX, winY + winH / 2);
      ctx.lineTo(winX + winW, winY + winH / 2);
      ctx.stroke();

      // Framed pictures
      frames.forEach((f) => {
        const fx = f.x - cameraX * 0.4;
        if (fx < -80 || fx > W + 80) return;
        ctx.fillStyle = "#8a6d3b";
        ctx.fillRect(fx - 3, f.y - 3, f.w + 6, f.h + 6);
        ctx.fillStyle = "#fcefd6";
        ctx.fillRect(fx, f.y, f.w, f.h);
        ctx.fillStyle = "#c08552";
        ctx.fillRect(fx + 6, f.y + f.h - 14, f.w - 12, 10);
        ctx.fillStyle = "#e0a96d";
        ctx.beginPath();
        ctx.arc(fx + f.w - 14, f.y + 12, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Floor (wood planks) + rug ──
      const floor = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 80);
      floor.addColorStop(0, "#8a5a33");
      floor.addColorStop(1, "#5e3c20");
      ctx.fillStyle = floor;
      ctx.fillRect(0, GROUND_Y, W, 80);
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      const plankOff = -((cameraX) % 90);
      for (let px = plankOff; px < W; px += 90) {
        ctx.beginPath();
        ctx.moveTo(px, GROUND_Y);
        ctx.lineTo(px, GROUND_Y + 80);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, GROUND_Y, W, 3);
      // rug under the start area
      const rugX = 120 - cameraX;
      ctx.fillStyle = "#7f1d3a";
      ctx.beginPath();
      ctx.ellipse(rugX + 220, GROUND_Y + 30, 240, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a83a5b";
      ctx.beginPath();
      ctx.ellipse(rugX + 220, GROUND_Y + 28, 180, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Input ──
      // Holding both directions cancels out instead of letting "right" win.
      player.vx = 0;
      const goLeft = keys["a"] || keys["arrowleft"];
      const goRight = keys["d"] || keys["arrowright"];
      if (goLeft && !goRight) {
        player.vx = -speed;
        player.facing = -1;
        player.anim += 0.3;
      } else if (goRight && !goLeft) {
        player.vx = speed;
        player.facing = 1;
        player.anim += 0.3;
      }
      // Jump / double-jump (edge triggered)
      const jd = jumpKeyDown();
      if (jd && !wasJumpDown && player.jumpsLeft > 0) {
        player.vy = -JUMP_V;
        player.jumpsLeft -= 1;
        playSound("jump");
        if (player.grounded) {
          addParticles(player.x + 13, GROUND_Y, 6, ["#d6c7a1", "#efe3c4"], 3.5, 18);
        } else {
          // double-jump sparkle
          addParticles(player.x + 13, player.y + player.h, 6, ["#fcd34d", "#fde68a"], 3, 16);
        }
      }
      wasJumpDown = jd;

      // ── Physics ──
      player.x += player.vx;
      player.vy += gravity;
      player.y += player.vy;
      if (player.x < 0) player.x = 0;
      if (player.x > WORLD_WIDTH - player.w) player.x = WORLD_WIDTH - player.w;

      const wasGrounded = player.grounded;
      player.grounded = false;
      for (const p of platforms) {
        if (
          player.x < p.x + p.w &&
          player.x + player.w > p.x &&
          player.y + player.h >= p.y &&
          // +16 tolerance: only land when falling through the top face, not from below.
          player.y + player.h - player.vy <= p.y + 16 &&
          player.vy >= 0
        ) {
          player.grounded = true;
          player.vy = 0;
          player.y = p.y - player.h;
        }
      }
      if (player.grounded) {
        player.jumpsLeft = 2;
        if (!wasGrounded) {
          player.land = 1; // trigger squash
          addParticles(player.x + 13, player.y + player.h, 5, ["#d6c7a1", "#efe3c4"], 3, 16);
        }
      }

      // ── Furniture platforms (shelves) ──
      platforms.slice(1).forEach((p) => {
        const px = p.x - cameraX;
        ctx.fillStyle = "#6b4423";
        ctx.fillRect(px, p.y, p.w, p.h);
        ctx.fillStyle = "#8a5a33";
        ctx.fillRect(px, p.y, p.w, 3);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(px, p.y + p.h, p.w, 4);
        // little brackets
        ctx.fillStyle = "#4a2f17";
        ctx.fillRect(px + 6, p.y + p.h, 4, 10);
        ctx.fillRect(px + p.w - 10, p.y + p.h, 4, 10);
      });

      // ── Yarn balls ──
      yarns.forEach((c) => {
        if (c.collected) return;
        if (Math.abs(player.x + 13 - c.x) < 22 && Math.abs(player.y + 12 - c.y) < 24) {
          c.collected = true;
          onScore(150);
          playSound("coin");
          addParticles(c.x, c.y, 10, ["#f472b6", "#f9a8d4", "#fbcfe8"], 4, 26);
          return;
        }
        const cx = c.x - cameraX;
        const fy = Math.sin(t * 2.5 + c.x) * 4;
        // rolling yarn-ball animation (per-ball phase offset)
        const bframe = S.ball[Math.floor(t * 9 + c.x * 0.05) % 7];
        if (!blit(bframe, cx, c.y + fy + 10, BALL_SCALE)) {
          ctx.fillStyle = "#ec4899";
          ctx.beginPath();
          ctx.arc(cx, c.y + fy, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, c.y + fy, 8, 0.3, 2.4);
          ctx.moveTo(cx - 6, c.y - 3 + fy);
          ctx.arc(cx, c.y + fy, 5, 1.2, 3.6);
          ctx.stroke();
        }
      });

      // Surface proximity to the UI so Inspect only lights up when useful.
      const nearMarker = markers.find((s) => Math.abs(player.x + 13 - s.x) <= 70);
      const nearNow = nearMarker?.label ?? null;
      if (nearNow !== lastNear) {
        lastNear = nearNow;
        setNearLabel(nearNow);
      }

      // ── Stations as furniture ──
      markers.forEach((st) => {
        const sx = st.x - cameraX;
        const near = Math.abs(player.x + 13 - st.x) <= 70;
        // soft glow pad on the floor under the object
        const pad = ctx.createRadialGradient(sx, GROUND_Y, 0, sx, GROUND_Y, 56);
        pad.addColorStop(0, near ? `${st.accent}55` : `${st.accent}14`);
        pad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = pad;
        ctx.beginPath();
        ctx.ellipse(sx, GROUND_Y, 48, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        // furniture sprite (vector art fallback while it decodes)
        if (!blit(furnImg[st.kind], sx, GROUND_Y + 2, FURN_SCALE)) {
          drawFurniture(ctx, st.kind, sx, near, st.accent, t);
        }
        // label when near
        if (near) {
          const bob = Math.sin(t * 4) * 2;
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(st.label, sx, GROUND_Y - 104 + bob);
          ctx.fillStyle = st.accent;
          ctx.font = "9px monospace";
          ctx.fillText("[E] inspect", sx, GROUND_Y - 92 + bob);
        }
      });

      // ── Goal: front door ──
      const gx = GOAL_X - cameraX;
      if (!blit(S.door, gx + 26, GROUND_Y + 2, DOOR_SCALE)) {
        const dy = GROUND_Y - 130;
        ctx.fillStyle = "#5b3920";
        ctx.fillRect(gx - 6, dy - 6, 64, 136);
        ctx.fillStyle = "#7a4e2a";
        ctx.fillRect(gx, dy, 52, 130);
        ctx.strokeStyle = "#4a2f17";
        ctx.lineWidth = 2;
        ctx.strokeRect(gx + 6, dy + 10, 40, 50);
        ctx.strokeRect(gx + 6, dy + 68, 40, 52);
        ctx.fillStyle = "#fcd34d";
        ctx.beginPath();
        ctx.arc(gx + 42, dy + 70, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("HOME", gx + 26, GROUND_Y - 118);
      if (!goalReached && Math.abs(player.x + 13 - (gx + 26 + cameraX)) < 34 && player.grounded) {
        goalReached = true;
        playSound("victory");
        onVictory();
      }

      // ── Particles ──
      particles = particles.filter((p) => p.life > 0);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life--;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ── Cat ──
      // animation timers
      player.blink = (player.blink + 1) % 200;
      if (player.earTwitch > 0) player.earTwitch -= 1;
      else if (Math.random() < 0.004) player.earTwitch = 12;
      if (player.land > 0) player.land *= 0.8;
      if (player.land < 0.02) player.land = 0;
      const moving = player.vx !== 0;
      player.idle = moving ? 0 : player.idle + 0.06;
      // Choose a sprite frame from the cat's current state.
      let catImg: HTMLImageElement | undefined;
      if (!player.grounded) {
        if (player.vy <= -7) catImg = S.jump1; // launch crouch
        else if (player.vy <= 1) catImg = S.jump2; // rising / apex
        else if (player.vy <= 7) catImg = S.fall1; // start of fall
        else catImg = S.fall2; // fast fall (stretched)
      } else if (player.land > 0.25) {
        catImg = S.land1; // landing impact (brief)
      } else if (moving) {
        catImg = S.walk[Math.floor(player.anim * 0.5) % 8];
      } else {
        catImg = S.idle[Math.floor(t * 3) % 4];
      }
      let csx = 1;
      let csy = 1;
      if (player.land > 0) {
        csx = 1 + 0.2 * player.land;
        csy = 1 - 0.2 * player.land;
      }
      const feetX = player.x + player.w / 2 - cameraX;
      const catBob = player.grounded && player.idle > 0 ? Math.sin(t * 3) * 1.2 : 0;
      if (
        !blit(catImg, feetX, player.y + player.h + catBob, CAT_SCALE, player.facing === -1, csx, csy)
      ) {
        drawCat(ctx, player, cameraX, t);
      }

      // ── CRT overlay ──
      if (crtRef.current) {
        ctx.fillStyle = "rgba(0,0,0,0.06)";
        for (let ly = 0; ly < H; ly += 3) ctx.fillRect(0, ly, W, 1);
        const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.75);
        vig.addColorStop(0, "rgba(0,0,0,0)");
        vig.addColorStop(1, "rgba(0,0,0,0.4)");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onCanvasPointerDown);
      window.removeEventListener("pointerup", onCanvasPointerUp);
      window.removeEventListener("pointercancel", onCanvasPointerUp);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const padPress = (action: string, down: boolean) => padRef.current(action, down);

  return (
    <div className="relative flex flex-grow flex-col overflow-hidden rounded-2xl border border-amber-950 bg-[#1a1009] shadow-[0_0_50px_rgba(217,119,6,0.15)]">
      <div className="relative w-full flex-grow">
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-[#120b06]/90 px-3 py-1.5 font-mono text-[10px] text-amber-200/60 shadow">
          <Gamepad2 className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">
            Move: A/D or ← →   ·   Jump / double-jump: W / Space   ·   Inspect: E
          </span>
          <span className="sm:hidden">Tap the room to hop, or walk up to inspect</span>
        </div>
      </div>

      {/* Virtual pad (touch / click), translucent so the room shows through. */}
      <div className="z-10 flex shrink-0 items-center justify-between gap-3 border-t border-amber-950/70 bg-[#241710]/55 p-3 backdrop-blur-md select-none">
        <div className="flex gap-2.5">
          {(["left", "right"] as const).map((d) => (
            <button
              key={d}
              onPointerDown={() => padPress(d, true)}
              onPointerUp={() => padPress(d, false)}
              onPointerLeave={() => padPress(d, false)}
              onPointerCancel={() => padPress(d, false)}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={d === "left" ? "Move left" : "Move right"}
              className="flex h-14 w-14 touch-none items-center justify-center rounded-xl border border-amber-900/70 bg-[#321f12]/70 font-mono text-base font-extrabold uppercase text-amber-100 backdrop-blur-sm transition hover:brightness-110 active:scale-95 sm:h-12 sm:w-12"
            >
              {d === "left" ? "◀" : "▶"}
            </button>
          ))}
        </div>
        <button
          onPointerDown={() => nearLabel && padPress("interact", true)}
          onContextMenu={(e) => e.preventDefault()}
          disabled={!nearLabel}
          title={nearLabel ? `Inspect ${nearLabel}` : "Walk up to an object to inspect it"}
          className={`touch-none rounded-xl px-4 py-3 font-mono text-[11px] font-black uppercase transition active:scale-95 ${
            nearLabel
              ? "animate-pulse bg-amber-500/90 text-slate-950 hover:bg-amber-400"
              : "cursor-not-allowed border border-amber-900/50 bg-[#241710]/50 text-amber-200/30"
          }`}
        >
          🐾 {nearLabel ? `Inspect ${nearLabel}` : "Inspect"}
        </button>
        <button
          onPointerDown={() => padPress("jump", true)}
          onPointerUp={() => padPress("jump", false)}
          onPointerLeave={() => padPress("jump", false)}
          onPointerCancel={() => padPress("jump", false)}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Jump"
          className="flex h-14 touch-none items-center rounded-xl bg-orange-600/85 px-4 font-mono text-[11px] font-extrabold text-white backdrop-blur-sm transition hover:bg-orange-500 active:scale-95 sm:h-12"
        >
          ▲ JUMP
        </button>
      </div>
    </div>
  );
}

/* ── Furniture drawing per station kind (all canvas vector art) ── */
function drawFurniture(
  ctx: CanvasRenderingContext2D,
  kind: StationKind,
  sx: number,
  near: boolean,
  accent: string,
  t: number
) {
  // soft glow pad
  const pad = ctx.createRadialGradient(sx, GROUND_Y, 0, sx, GROUND_Y, 56);
  pad.addColorStop(0, near ? `${accent}55` : `${accent}14`);
  pad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = pad;
  ctx.beginPath();
  ctx.ellipse(sx, GROUND_Y, 48, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  if (kind === "desk") {
    ctx.fillStyle = "#7a4e2a";
    ctx.fillRect(sx - 28, GROUND_Y - 34, 56, 8);
    ctx.fillStyle = "#5b3920";
    ctx.fillRect(sx - 26, GROUND_Y - 26, 5, 26);
    ctx.fillRect(sx + 21, GROUND_Y - 26, 5, 26);
    // lamp
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 16, GROUND_Y - 34);
    ctx.lineTo(sx + 16, GROUND_Y - 52);
    ctx.lineTo(sx + 6, GROUND_Y - 58);
    ctx.stroke();
    ctx.fillStyle = near ? "#fde68a" : "#9ca3af";
    ctx.beginPath();
    ctx.moveTo(sx, GROUND_Y - 60);
    ctx.lineTo(sx + 12, GROUND_Y - 60);
    ctx.lineTo(sx + 7, GROUND_Y - 50);
    ctx.lineTo(sx - 3, GROUND_Y - 50);
    ctx.closePath();
    ctx.fill();
    // paper
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(sx - 18, GROUND_Y - 40, 14, 8);
  } else if (kind === "shelf") {
    ctx.fillStyle = "#5b3920";
    ctx.fillRect(sx - 26, GROUND_Y - 70, 52, 70);
    ctx.fillStyle = "#3a2414";
    ctx.fillRect(sx - 22, GROUND_Y - 44, 44, 4);
    ctx.fillRect(sx - 22, GROUND_Y - 22, 44, 4);
    const cols = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(sx - 20 + i * 8, GROUND_Y - 66, 6, 22);
    }
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = cols[(i + 2) % cols.length];
      ctx.fillRect(sx - 18 + i * 9, GROUND_Y - 42, 7, 20);
    }
  } else if (kind === "pc") {
    // tower + monitor
    ctx.fillStyle = "#374151";
    ctx.fillRect(sx - 28, GROUND_Y - 30, 14, 30);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(sx - 24, GROUND_Y - 26, 6, 2);
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(sx - 10, GROUND_Y - 40, 38, 28);
    const scr = ctx.createLinearGradient(sx - 8, 0, sx + 26, 0);
    scr.addColorStop(0, near ? accent : "#334155");
    scr.addColorStop(1, near ? "#0f172a" : "#1e293b");
    ctx.fillStyle = scr;
    ctx.fillRect(sx - 7, GROUND_Y - 37, 32, 22);
    ctx.fillStyle = "#9ca3af";
    ctx.fillRect(sx + 6, GROUND_Y - 12, 6, 12);
    ctx.fillRect(sx - 2, GROUND_Y, 22, 3);
    if (near) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(sx - 4, GROUND_Y - 34 + (Math.floor(t * 4) % 6) * 3, 26, 1.5);
    }
  } else if (kind === "toolbox") {
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(sx - 24, GROUND_Y - 26, 48, 26);
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(sx - 24, GROUND_Y - 26, 48, 6);
    ctx.fillStyle = "#374151";
    ctx.fillRect(sx - 6, GROUND_Y - 34, 12, 8);
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, GROUND_Y - 34, 8, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(sx - 16, GROUND_Y - 16, 10, 3);
    ctx.fillRect(sx + 6, GROUND_Y - 12, 10, 3);
  } else if (kind === "mailbox") {
    ctx.fillStyle = "#6b7280";
    ctx.fillRect(sx - 3, GROUND_Y - 40, 6, 40);
    ctx.fillStyle = near ? accent : "#9ca3af";
    ctx.beginPath();
    ctx.moveTo(sx - 18, GROUND_Y - 46);
    ctx.lineTo(sx + 18, GROUND_Y - 46);
    ctx.lineTo(sx + 18, GROUND_Y - 62);
    ctx.arc(sx, GROUND_Y - 62, 18, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(sx - 14, GROUND_Y - 58, 22, 10);
    // red flag
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(sx + 16, GROUND_Y - 64, 8, 6);
  }
}

/* ── The munchkin cat: short legs, walk cycle, tail sway, blink, squash. ── */
function drawCat(
  ctx: CanvasRenderingContext2D,
  player: {
    x: number;
    y: number;
    w: number;
    h: number;
    facing: number;
    anim: number;
    vx: number;
    vy: number;
    blink: number;
    earTwitch: number;
    idle: number;
    land: number;
    grounded: boolean;
  },
  cameraX: number,
  t: number
) {
  ctx.save();

  // squash & stretch: stretch when rising/falling fast, squash on landing.
  let sx = 1;
  let sy = 1;
  if (player.land > 0) {
    sx = 1 + 0.25 * player.land;
    sy = 1 - 0.25 * player.land;
  } else if (!player.grounded) {
    const f = Math.max(-0.18, Math.min(0.18, player.vy * -0.014));
    sy = 1 + f;
    sx = 1 - f * 0.6;
  }
  const idleBob = player.grounded && player.idle > 0 ? Math.sin(t * 3) * 1.2 : 0;

  const baseX = player.x - cameraX;
  const baseY = player.y + idleBob;
  // anchor scaling at the feet
  ctx.translate(baseX + player.w / 2, baseY + player.h);
  ctx.scale(player.facing * sx, sy);
  ctx.translate(-(player.w / 2), -player.h);

  const walk = player.vx !== 0 ? Math.sin(player.anim * 1.4) * 2.6 : 0;
  const orange = "#f59e0b";
  const orangeD = "#d97706";
  const cream = "#fde9c8";

  // Tail (curved, sways)
  ctx.strokeStyle = orange;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(2, 16);
  const tailSway = Math.sin(t * 3 + player.anim * 0.5) * 5;
  ctx.quadraticCurveTo(-10, 14 + tailSway, -8, 4 + tailSway);
  ctx.stroke();

  // Back leg + front leg (walk cycle)
  ctx.fillStyle = orangeD;
  ctx.fillRect(6, 19 + walk, 5, 6);
  ctx.fillRect(16, 19 - walk, 5, 6);
  ctx.fillStyle = cream; // paws
  ctx.fillRect(6, 24 + walk, 5, 2);
  ctx.fillRect(16, 24 - walk, 5, 2);

  // Body (long munchkin body, low to ground)
  const body = ctx.createLinearGradient(0, 6, 0, 22);
  body.addColorStop(0, orange);
  body.addColorStop(1, orangeD);
  ctx.fillStyle = body;
  roundRect(ctx, 2, 8, 22, 14, 7);
  ctx.fill();
  // belly
  ctx.fillStyle = cream;
  roundRect(ctx, 6, 14, 12, 7, 4);
  ctx.fill();
  // tabby stripes
  ctx.strokeStyle = orangeD;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(8 + i * 4, 8);
    ctx.lineTo(8 + i * 4, 12);
    ctx.stroke();
  }

  // Head
  ctx.fillStyle = orange;
  ctx.beginPath();
  ctx.arc(20, 9, 7.5, 0, Math.PI * 2);
  ctx.fill();
  // cheeks
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.arc(20, 12, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Ears (twitch)
  const twitch = player.earTwitch > 0 ? -2 : 0;
  ctx.fillStyle = orange;
  ctx.beginPath();
  ctx.moveTo(15, 4);
  ctx.lineTo(16 + twitch, -3);
  ctx.lineTo(20, 3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(22, 3);
  ctx.lineTo(26, -3);
  ctx.lineTo(26, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f9a8d4"; // inner ear
  ctx.beginPath();
  ctx.moveTo(17, 2);
  ctx.lineTo(18 + twitch, -1);
  ctx.lineTo(19.5, 2);
  ctx.closePath();
  ctx.fill();

  // Eyes (blink)
  const blinking = player.blink > 192;
  ctx.fillStyle = "#1f2937";
  if (blinking) {
    ctx.fillRect(17.5, 8.6, 3, 0.8);
    ctx.fillRect(21.5, 8.6, 3, 0.8);
  } else {
    ctx.beginPath();
    ctx.arc(19, 8.6, 1.5, 0, Math.PI * 2);
    ctx.arc(23, 8.6, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(19.4, 8.2, 0.5, 0, Math.PI * 2);
    ctx.arc(23.4, 8.2, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // nose
  ctx.fillStyle = "#ec4899";
  ctx.beginPath();
  ctx.moveTo(21, 11);
  ctx.lineTo(22.2, 12);
  ctx.lineTo(19.8, 12);
  ctx.closePath();
  ctx.fill();
  // whiskers
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(24, 12);
  ctx.lineTo(30, 11);
  ctx.moveTo(24, 13);
  ctx.lineTo(30, 14);
  ctx.stroke();

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
