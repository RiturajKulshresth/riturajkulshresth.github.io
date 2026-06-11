/**
 * Windows 95 desktop render mode. Portfolio sections open as draggable windows;
 * includes a BIOS boot sequence, Start menu, and a full Minesweeper game.
 */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Square, Minus, ExternalLink } from "lucide-react";
import {
  profile,
  experience,
  projects,
  skillGroups,
  accolades,
  socialLinks,
  RESUME_PATH,
} from "@/lib/data";
import {
  FolderIcon,
  DocIcon,
  ComputerIcon,
  FloppyIcon,
  MailIcon,
  MineIcon,
  RecycleIcon,
  GlobeIcon,
  BriefcaseIcon,
  ChipIcon,
  FlagIcon,
} from "./icons";

type RetroIcon = React.ComponentType<{ className?: string }>;

interface Win {
  id: string;
  title: string;
  icon: RetroIcon;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

const BEVEL =
  "bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-neutral-800 border-r-neutral-800 shadow-[inset_1px_1px_rgba(255,255,255,0.85),inset_-1px_-1px_gray]";
const BEVEL_PRESSED =
  "bg-[#bdbdbd] border-2 border-t-neutral-800 border-l-neutral-800 border-b-white border-r-white shadow-[inset_1px_1px_rgba(0,0,0,0.15)]";

const GRID = 64;
const MINE_TOTAL = 10;

export default function Windows95() {
  // Boot sequence: 0 = BIOS text, 1 = Windows splash + progress bar, 2 = desktop.
  const [bootStep, setBootStep] = useState(0);
  const [bootProgress, setBootProgress] = useState(0);
  const [time, setTime] = useState("");
  const [startOpen, setStartOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [topZ, setTopZ] = useState(10);
  const startRef = useRef<HTMLDivElement | null>(null);

  const [windows, setWindows] = useState<Win[]>([
    { id: "welcome", title: "Welcome.txt - Notepad", icon: DocIcon, isOpen: true, isMinimized: false, isMaximized: false, zIndex: 5, x: 70, y: 40, w: 460, h: 330 },
    { id: "about", title: "About_Me.txt", icon: DocIcon, isOpen: false, isMinimized: false, isMaximized: false, zIndex: 1, x: 110, y: 60, w: 440, h: 340 },
    { id: "experience", title: "Experience.log", icon: BriefcaseIcon, isOpen: false, isMinimized: false, isMaximized: false, zIndex: 2, x: 130, y: 70, w: 560, h: 400 },
    { id: "projects", title: "Projects", icon: FolderIcon, isOpen: false, isMinimized: false, isMaximized: false, zIndex: 3, x: 160, y: 90, w: 560, h: 400 },
    { id: "skills", title: "Skills.sys - Device Manager", icon: ChipIcon, isOpen: false, isMinimized: false, isMaximized: false, zIndex: 4, x: 190, y: 120, w: 480, h: 360 },
    { id: "contact", title: "Contact.exe", icon: MailIcon, isOpen: false, isMinimized: false, isMaximized: false, zIndex: 6, x: 220, y: 100, w: 420, h: 330 },
    { id: "mycomputer", title: "My Computer", icon: ComputerIcon, isOpen: false, isMinimized: false, isMaximized: false, zIndex: 7, x: 150, y: 80, w: 460, h: 330 },
    { id: "recyclebin", title: "Recycle Bin", icon: RecycleIcon, isOpen: false, isMinimized: false, isMaximized: false, zIndex: 8, x: 250, y: 140, w: 400, h: 280 },
    { id: "minesweeper", title: "Minesweeper", icon: MineIcon, isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9, x: 320, y: 60, w: 320, h: 440 },
  ]);

  // Drag / resize
  const [dragId, setDragId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [resizeId, setResizeId] = useState<string | null>(null);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Minesweeper
  const [mines, setMines] = useState<boolean[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [flagged, setFlagged] = useState<boolean[]>([]);
  const [mineCount, setMineCount] = useState(MINE_TOTAL);
  const [mineState, setMineState] = useState<"playing" | "win" | "lost">("playing");
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [mineTime, setMineTime] = useState(0);
  const [flagMode, setFlagMode] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h}:${m} ${ampm}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (bootStep === 0) {
      const id = setTimeout(() => setBootStep(1), 1500);
      return () => clearTimeout(id);
    }
    if (bootStep === 1) {
      const id = setInterval(() => {
        setBootProgress((p) => {
          if (p >= 100) {
            clearInterval(id);
            setTimeout(() => setBootStep(2), 500);
            return 100;
          }
          return p + Math.floor(Math.random() * 8) + 5;
        });
      }, 90);
      return () => clearInterval(id);
    }
  }, [bootStep]);

  // Close Start menu on outside click / Escape.
  useEffect(() => {
    if (!startOpen) return;
    const onDown = (e: MouseEvent) => {
      if (startRef.current && !startRef.current.contains(e.target as Node)) {
        setStartOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStartOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [startOpen]);

  const initMines = () => {
    const total = GRID;
    // Mines are placed lazily on the first reveal (see clickCell) so the
    // opening click is always safe, matching the real game.
    setMines(Array(total).fill(false));
    setRevealed(Array(total).fill(false));
    setFlagged(Array(total).fill(false));
    setMineCount(MINE_TOTAL);
    setMineState("playing");
    setMinesPlaced(false);
    setMineTime(0);
    setFlagMode(false);
  };
  useEffect(() => {
    initMines();
  }, []);

  // Run the elapsed-time clock while a placed board is in play.
  useEffect(() => {
    if (!minesPlaced || mineState !== "playing") return;
    const id = setInterval(() => setMineTime((t) => Math.min(999, t + 1)), 1000);
    return () => clearInterval(id);
  }, [minesPlaced, mineState]);

  // Place mines avoiding the first-clicked cell and its 8 neighbours.
  const placeMines = (safeIdx: number): boolean[] => {
    const m = Array(GRID).fill(false);
    const sr = Math.floor(safeIdx / 8);
    const sc = safeIdx % 8;
    const safe = new Set<number>();
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = sr + dr;
        const nc = sc + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) safe.add(nr * 8 + nc);
      }
    let placed = 0;
    while (placed < MINE_TOTAL) {
      const i = Math.floor(Math.random() * GRID);
      if (!m[i] && !safe.has(i)) {
        m[i] = true;
        placed++;
      }
    }
    return m;
  };

  const neighborCount = (idx: number, m = mines) => {
    const r = Math.floor(idx / 8);
    const c = idx % 8;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && m[nr * 8 + nc]) n++;
      }
    return n;
  };

  // Flood empty regions, never crossing a flagged cell.
  const flood = (idx: number, arr: boolean[], m: boolean[], flags: boolean[]) => {
    if (arr[idx] || flags[idx]) return;
    arr[idx] = true;
    if (neighborCount(idx, m) === 0) {
      const r = Math.floor(idx / 8);
      const c = idx % 8;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          const ni = nr * 8 + nc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !m[ni] && !flags[ni]) {
            flood(ni, arr, m, flags);
          }
        }
    }
  };

  const checkWin = (m: boolean[], rev: boolean[]) => {
    const won = m.every((isMine, i) => isMine || rev[i]);
    if (won) {
      setMineState("win");
      setFlagged(m.map(Boolean)); // auto-flag every mine on a win
      setMineCount(0);
    }
  };

  // Chord: open all unflagged neighbours of a satisfied number.
  const chordCell = (idx: number) => {
    const m = mines;
    const count = neighborCount(idx, m);
    if (count === 0) return;
    const r = Math.floor(idx / 8);
    const c = idx % 8;
    let flags = 0;
    const neigh: number[] = [];
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
        const ni = nr * 8 + nc;
        if (flagged[ni]) flags++;
        else if (!revealed[ni]) neigh.push(ni);
      }
    if (flags !== count) return;

    const next = [...revealed];
    let hitMine = false;
    for (const ni of neigh) {
      if (m[ni]) hitMine = true;
      else flood(ni, next, m, flagged);
    }
    if (hitMine) {
      setRevealed(Array(GRID).fill(true));
      setMineState("lost");
      return;
    }
    setRevealed(next);
    checkWin(m, next);
  };

  const clickCell = (idx: number) => {
    if (mineState !== "playing" || flagged[idx]) return;

    // Tapping an already-open number chords its neighbours.
    if (revealed[idx]) {
      chordCell(idx);
      return;
    }

    let m = mines;
    if (!minesPlaced) {
      m = placeMines(idx);
      setMines(m);
      setMinesPlaced(true);
    }

    if (m[idx]) {
      setRevealed(Array(GRID).fill(true));
      setMineState("lost");
      return;
    }

    const next = [...revealed];
    flood(idx, next, m, flagged);
    setRevealed(next);
    checkWin(m, next);
  };

  const toggleFlag = (idx: number) => {
    if (mineState !== "playing" || revealed[idx]) return;
    const next = [...flagged];
    next[idx] = !next[idx];
    setFlagged(next);
    setMineCount((c) => c + (next[idx] ? -1 : 1));
  };

  const rightClickCell = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    toggleFlag(idx);
  };

  // Bump z-index on every focus so the clicked window always stacks on top.
  const focus = (id: string) => {
    const z = topZ + 1;
    setTopZ(z);
    setActiveId(id);
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: z } : w))
    );
  };
  const close = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isOpen: false } : w)));
  };
  const minimize = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
  };
  const toggleMax = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)));
  };

  const startDrag = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    focus(id);
    const w = windows.find((x) => x.id === id);
    if (!w || w.isMaximized) return;
    setDragId(id);
    dragOffset.current = { x: e.clientX - w.x, y: e.clientY - w.y };
  };
  const startResize = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    focus(id);
    const w = windows.find((x) => x.id === id);
    if (!w || w.isMaximized) return;
    setResizeId(id);
    resizeStart.current = { x: e.clientX, y: e.clientY, w: w.w, h: w.h };
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dragId) {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === dragId
              ? { ...w, x: Math.max(0, e.clientX - dragOffset.current.x), y: Math.max(0, e.clientY - dragOffset.current.y) }
              : w
          )
        );
      } else if (resizeId) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        setWindows((prev) =>
          prev.map((w) =>
            w.id === resizeId
              ? { ...w, w: Math.max(260, resizeStart.current.w + dx), h: Math.max(200, resizeStart.current.h + dy) }
              : w
          )
        );
      }
    };
    const up = () => {
      setDragId(null);
      setResizeId(null);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragId, resizeId]);

  const openResume = () => window.open(RESUME_PATH, "_blank", "noopener,noreferrer");

  // ── Boot screens ──
  if (bootStep === 0) {
    return (
      <div className="min-h-screen select-text bg-black p-6 font-mono text-xs leading-relaxed text-[#00ff00]">
        <p>AMIBIOS (C) 1995 American Megatrends, Inc.</p>
        <p>BIOS Date: 07/11/95 14:12:05 Ver: 1.00G</p>
        <p className="mt-4">CPU: GenuineIntel Pentium(R) 133MHz</p>
        <p>Base Memory: 640KB</p>
        <p>Extended Memory: 32768KB</p>
        <p className="mt-4 text-white">Detecting IDE drives ... OK</p>
        <p>Reading boot sector ... OK</p>
        <div className="mt-8 text-neutral-400">
          <p>Press &lt;DEL&gt; to enter SETUP.</p>
          <p className="animate-pulse">Loading C:\WINDOWS ...</p>
        </div>
      </div>
    );
  }
  if (bootStep === 1) {
    return (
      <div className="flex min-h-screen select-none flex-col items-center justify-between bg-[#008080] p-8 font-sans text-white">
        <div className="flex flex-grow flex-col items-center justify-center">
          <div className="space-y-4 text-center">
            <FlagIcon className="mx-auto h-16 w-16" />
            <div className="flex items-center justify-center gap-1 font-display text-4xl italic">
              <span>Microsoft</span>
              <span className="text-red-400">Windows</span>
              <span className="text-gray-200">95</span>
            </div>
            <div className="mx-auto flex h-5 w-60 overflow-hidden border-2 border-white bg-black/40">
              <div
                className="h-full bg-gradient-to-r from-blue-700 to-sky-300 transition-all duration-100"
                style={{ width: `${bootProgress}%` }}
              />
            </div>
            <p className="mt-2 font-mono text-xs text-sky-200">Loading personal homepage ...</p>
          </div>
        </div>
        <div className="font-mono text-xs text-slate-300">© 1981-1995 Microsoft Corporation</div>
      </div>
    );
  }

  // ── Desktop ──
  const DesktopIcon = ({
    id,
    label,
    icon: Icon,
    onOpen,
  }: {
    id: string;
    label: string;
    icon: RetroIcon;
    onOpen: () => void;
  }) => (
    <button
      onDoubleClick={onOpen}
      onClick={onOpen}
      className="group flex w-20 flex-col items-center text-center text-white focus:outline-none active:scale-95"
      id={`icn-${id}`}
    >
      <span className="mb-1 flex h-11 w-11 items-center justify-center rounded p-1 group-focus:bg-blue-800/40">
        <Icon className="h-9 w-9 drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]" />
      </span>
      <span className="max-w-full truncate border border-transparent bg-black/30 px-1 text-xs font-semibold leading-tight group-focus:border-dotted group-focus:border-white group-focus:bg-blue-800">
        {label}
      </span>
    </button>
  );

  return (
    <div className="relative flex min-h-screen select-none flex-col justify-between overflow-hidden font-sans text-black">
      {/* Code-drawn wallpaper: classic teal with a faint centred flag watermark */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 36%, #2aa198 0%, #008080 46%, #066 100%)",
        }}
      >
        <FlagIcon className="absolute left-1/2 top-[34%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)",
          }}
        />
      </div>

      {/* Desktop */}
      <div className="relative z-10 grid flex-grow auto-cols-max grid-flow-col grid-rows-6 items-start justify-start gap-5 p-5">
        <DesktopIcon id="mycomputer" label="My Computer" icon={ComputerIcon} onOpen={() => focus("mycomputer")} />
        <DesktopIcon id="about" label="About_Me.txt" icon={DocIcon} onOpen={() => focus("about")} />
        <DesktopIcon id="experience" label="Experience" icon={BriefcaseIcon} onOpen={() => focus("experience")} />
        <DesktopIcon id="projects" label="Projects" icon={FolderIcon} onOpen={() => focus("projects")} />
        <DesktopIcon id="skills" label="Skills.sys" icon={ChipIcon} onOpen={() => focus("skills")} />
        <DesktopIcon id="contact" label="Contact.exe" icon={MailIcon} onOpen={() => focus("contact")} />
        <DesktopIcon id="resume" label="Resume.pdf" icon={FloppyIcon} onOpen={openResume} />
        <DesktopIcon id="mines" label="Minesweeper" icon={MineIcon} onOpen={() => focus("minesweeper")} />
        <DesktopIcon id="recyclebin" label="Recycle Bin" icon={RecycleIcon} onOpen={() => focus("recyclebin")} />
        <a
          href="/"
          className="group flex w-20 flex-col items-center text-center text-white focus:outline-none active:scale-95"
          id="icn-exit"
        >
          <span className="mb-1 flex h-11 w-11 items-center justify-center rounded p-1 group-focus:bg-blue-800/40">
            <GlobeIcon className="h-9 w-9 drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]" />
          </span>
          <span className="max-w-full truncate border border-transparent bg-black/30 px-1 text-xs font-semibold leading-tight group-hover:border-dotted group-hover:border-white group-hover:bg-blue-800">
            Exit to Web
          </span>
        </a>

        {/* Windows */}
        {windows.map((win) => {
          if (!win.isOpen || win.isMinimized) return null;
          const active = activeId === win.id;
          const style: React.CSSProperties = win.isMaximized
            ? { position: "absolute", top: 0, left: 0, right: 0, bottom: 40, width: "100%", height: "calc(100% - 40px)", zIndex: win.zIndex }
            : { position: "absolute", left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.zIndex };

          return (
            <div
              key={win.id}
              style={style}
              onMouseDown={() => focus(win.id)}
              className={`${BEVEL} flex cursor-default flex-col overflow-hidden text-sm`}
            >
              {/* Title bar */}
              <div
                onMouseDown={(e) => startDrag(win.id, e)}
                onDoubleClick={(e) => toggleMax(win.id, e)}
                className={`flex h-6 cursor-move items-center justify-between px-2 py-1 font-bold text-white ${
                  active ? "bg-[#000080]" : "bg-neutral-500"
                }`}
              >
                <div className="flex items-center gap-1 truncate text-xs">
                  <win.icon className="h-3.5 w-3.5" />
                  <span className="truncate">{win.title}</span>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <button onClick={(e) => minimize(win.id, e)} className={`flex h-4 w-4 items-center justify-center ${BEVEL} hover:brightness-105`} title="Minimize">
                    <Minus className="h-2 w-2 text-black" />
                  </button>
                  <button onClick={(e) => toggleMax(win.id, e)} className={`flex h-4 w-4 items-center justify-center ${BEVEL} hover:brightness-105`} title="Maximize">
                    <Square className="h-2 w-2 text-black" />
                  </button>
                  <button onClick={(e) => close(win.id, e)} className={`ml-0.5 flex h-4 w-4 items-center justify-center ${BEVEL} hover:bg-rose-500 hover:text-white`} title="Close">
                    <X className="h-2.5 w-2.5 text-black" />
                  </button>
                </div>
              </div>

              {/* Menu bar */}
              <div className="flex gap-3 border-b border-neutral-400 bg-[#c0c0c0] px-2.5 py-0.5 text-xs text-black">
                <span className="cursor-default hover:underline"><u>F</u>ile</span>
                <span className="cursor-default hover:underline"><u>E</u>dit</span>
                <span className="cursor-default hover:underline"><u>V</u>iew</span>
                <span className="cursor-default hover:underline"><u>H</u>elp</span>
              </div>

              {/* Content */}
              <div className="custom-scrollbar flex-grow select-text overflow-y-auto border border-b-white border-l-neutral-700 border-r-white border-t-neutral-700 bg-white p-4 text-xs leading-relaxed text-black">
                {win.id === "welcome" && <WelcomeContent onOpen={focus} />}
                {win.id === "about" && <AboutContent />}
                {win.id === "experience" && <ExperienceContent />}
                {win.id === "projects" && <ProjectsContent />}
                {win.id === "skills" && <SkillsContent />}
                {win.id === "contact" && <ContactContent />}
                {win.id === "mycomputer" && <MyComputerContent onOpen={focus} />}
                {win.id === "recyclebin" && <RecycleBinContent />}
                {win.id === "minesweeper" && (
                  <MinesweeperContent
                    mines={mines}
                    revealed={revealed}
                    flagged={flagged}
                    mineCount={mineCount}
                    mineState={mineState}
                    time={mineTime}
                    flagMode={flagMode}
                    onToggleFlagMode={() => setFlagMode((v) => !v)}
                    onReset={initMines}
                    onClick={clickCell}
                    onRightClick={rightClickCell}
                    onToggleFlag={toggleFlag}
                    neighborCount={neighborCount}
                  />
                )}
              </div>

              {!win.isMaximized && (
                <div
                  onMouseDown={(e) => startResize(win.id, e)}
                  className="absolute bottom-0 right-0 flex h-3.5 w-3.5 cursor-se-resize items-end justify-end bg-neutral-400 p-0.5"
                  title="Resize"
                >
                  <svg width="6" height="6" viewBox="0 0 6 6" className="text-gray-700 opacity-60">
                    <line x1="6" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1" />
                    <line x1="6" y1="2" x2="2" y2="6" stroke="currentColor" strokeWidth="1" />
                    <line x1="6" y1="4" x2="4" y2="6" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Taskbar */}
      <footer className={`${BEVEL} relative z-30 mt-auto flex h-10 w-full shrink-0 items-center justify-between gap-4 p-1 px-2`}>
        <div className="flex min-w-0 flex-grow items-center gap-1.5">
          <div className="relative shrink-0" ref={startRef}>
            <button
              onClick={() => setStartOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold ${startOpen ? BEVEL_PRESSED : BEVEL}`}
            >
              <FlagIcon className="h-4 w-4" />
              <span>Start</span>
            </button>

            <AnimatePresence>
              {startOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.12 }}
                  className={`${BEVEL} absolute bottom-9 left-0 z-[9999] flex w-64 text-xs`}
                >
                  <div className="flex w-7 shrink-0 items-end justify-center bg-gradient-to-t from-blue-900 to-blue-500 py-2 font-extrabold text-white">
                    <span className="block origin-center -rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest">
                      Rituraj 95
                    </span>
                  </div>
                  <div className="flex-grow space-y-0.5 p-1 text-black">
                    {[
                      { id: "about", label: "About Me", icon: DocIcon },
                      { id: "experience", label: "Experience", icon: BriefcaseIcon },
                      { id: "projects", label: "Projects", icon: FolderIcon },
                      { id: "skills", label: "Skills", icon: ChipIcon },
                      { id: "contact", label: "Contact", icon: MailIcon },
                      { id: "mycomputer", label: "My Computer", icon: ComputerIcon },
                      { id: "minesweeper", label: "Minesweeper", icon: MineIcon },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          focus(item.id);
                          setStartOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-[#000080] hover:text-white"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        openResume();
                        setStartOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-[#000080] hover:text-white"
                    >
                      <FloppyIcon className="h-4 w-4" />
                      <span>Open Resume</span>
                    </button>
                    <div className="my-1 border-t border-neutral-400" />
                    <a
                      href="/"
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left font-bold hover:bg-[#000080] hover:text-white"
                    >
                      <GlobeIcon className="h-4 w-4" />
                      <span>Shut Down (back to site)</span>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-0.5 shrink-0 border-r border-t border-neutral-400" />

          <div className="custom-scrollbar flex min-w-0 flex-grow items-center gap-1 overflow-x-auto">
            {windows.map((win) => {
              if (!win.isOpen) return null;
              const isActive = activeId === win.id && !win.isMinimized;
              return (
                <button
                  key={win.id}
                  onClick={() => {
                    if (win.isMinimized) focus(win.id);
                    else if (activeId === win.id) minimize(win.id);
                    else focus(win.id);
                  }}
                  className={`flex min-w-[110px] max-w-[150px] items-center gap-1.5 truncate px-2 py-0.5 text-left text-xs font-semibold ${
                    isActive ? BEVEL_PRESSED : BEVEL
                  }`}
                >
                  <win.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{win.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`${BEVEL_PRESSED} flex h-7 shrink-0 items-center gap-2 px-2 py-1 font-mono text-[10px] font-bold uppercase text-black`}>
          <a
            href="/"
            title="Exit to Web"
            className="flex items-center gap-1 border border-neutral-400/40 px-1 py-0.5 text-[9px] hover:bg-blue-100"
          >
            <GlobeIcon className="h-3.5 w-3.5" />
          </a>
          <span className="border border-neutral-400/40 px-1 py-0.5 text-[9px]" title="Volume">
            🔊
          </span>
          <span>{time}</span>
        </div>
      </footer>
    </div>
  );
}

/* ── Window content components (real data) ── */
function WelcomeContent({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="space-y-2 font-mono text-[11px] leading-relaxed">
      <pre className="whitespace-pre-wrap text-[10px] text-[#000080]">{`====================================
  WELCOME TO RITURAJ 95
====================================`}</pre>
      <p>
        Hi, I am {profile.name} - {profile.role}.
      </p>
      <p>{profile.bio}</p>
      <p className="pt-1">Double-click any desktop icon to get started, or try:</p>
      <ul className="ml-3 list-disc space-y-0.5">
        <li>
          <button onClick={() => onOpen("about")} className="text-blue-700 underline">About_Me.txt</button> - who I am
        </li>
        <li>
          <button onClick={() => onOpen("experience")} className="text-blue-700 underline">Experience.log</button> - where I have worked
        </li>
        <li>
          <button onClick={() => onOpen("projects")} className="text-blue-700 underline">Projects</button> - things I have built
        </li>
        <li>
          <button onClick={() => onOpen("minesweeper")} className="text-blue-700 underline">Minesweeper</button> - take a break
        </li>
      </ul>
      <p className="pt-1 text-neutral-500">Tip: the Start menu and taskbar work just like 1995.</p>
    </div>
  );
}

function AboutContent() {
  return (
    <div className="space-y-3">
      <div className="mb-1 border-b border-dashed border-neutral-300 pb-2 text-center text-lg font-bold">
        {profile.name}
      </div>
      <p className="text-center font-semibold text-[#000080]">{profile.role}</p>
      <p className="indent-4">{profile.bio}</p>
      <div className="mt-2 select-all rounded border border-neutral-400 bg-neutral-100 p-3 font-mono text-[11px] leading-relaxed">
        <p className="font-bold text-[#000080]">SYSTEM PROPERTIES:</p>
        <p>Location : {profile.location}</p>
        <p>Email    : {profile.email}</p>
        <p>Phone    : {profile.phone}</p>
        <p>Status   : {profile.status}</p>
      </div>
    </div>
  );
}

function ExperienceContent() {
  return (
    <div className="space-y-3">
      <h3 className="mb-2 border-b border-neutral-300 pb-1 text-sm font-bold">C:\WORK\history.log</h3>
      {experience.map((job) => (
        <div key={`${job.company}-${job.period}`} className="rounded border border-neutral-300 p-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-bold text-blue-800">{job.company}</span>
            <span className="shrink-0 font-mono text-[10px] text-neutral-500">{job.period}</span>
          </div>
          <p className="font-semibold">{job.role}</p>
          <p className="text-[10px] text-neutral-500">{job.location}</p>
          <p className="mt-1 text-neutral-600">{job.summary}</p>
          {job.highlights.length > 0 && (
            <ul className="mt-1.5 ml-3 list-disc space-y-1">
              {job.highlights.map((h, i) => (
                <li key={i} className="text-neutral-700">{h}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function ProjectsContent() {
  return (
    <div className="space-y-3">
      <h3 className="mb-2 border-b border-neutral-300 pb-1 text-sm font-bold">C:\PROJECTS\</h3>
      {projects.map((p) => (
        <div key={p.title} className="rounded border border-neutral-300 p-2 hover:bg-neutral-50">
          <div className="flex items-baseline justify-between gap-2">
            <span className="flex items-center gap-1.5 font-bold text-blue-800">
              <FolderIcon className="h-3.5 w-3.5" /> {p.title}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-neutral-500">{p.year}</span>
          </div>
          <p className="text-[10.5px] font-semibold uppercase text-neutral-500">{p.subtitle}</p>
          <p className="mt-0.5 font-light text-neutral-600">{p.description}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {p.tags.slice(0, 6).map((t) => (
              <span key={t} className="border border-neutral-300 bg-neutral-100 px-1 text-[9px] font-bold uppercase text-neutral-600">
                {t}
              </span>
            ))}
          </div>
          {p.link && (
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-700 underline"
            >
              open <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function SkillsContent() {
  return (
    <div className="space-y-3">
      <h3 className="mb-2 border-b border-neutral-300 pb-1 text-sm font-bold">Device Manager · Drivers</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {skillGroups.map((g) => (
          <div key={g.title} className="space-y-1">
            <span className="block border-b border-neutral-200 font-bold text-indigo-900">{g.title}</span>
            {g.items.map((item) => (
              <p key={item}>✓ {item}</p>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 border-t border-dashed border-neutral-300 pt-2">
        <span className="block font-bold text-indigo-900">Recognition</span>
        {accolades.map((a) => (
          <p key={a.title} className="text-[11px] text-neutral-600">
            🏆 {a.title} · {a.organisation} ({a.period})
          </p>
        ))}
      </div>
    </div>
  );
}

function ContactContent() {
  return (
    <div className="space-y-3">
      <h3 className="mb-2 border-b border-neutral-300 pb-1 text-sm font-bold">Address Book</h3>
      <p className="font-mono text-[11px] text-neutral-600">Get in touch with {profile.name}:</p>
      <a
        href={`mailto:${profile.email}`}
        className="flex items-center gap-2 font-semibold text-blue-800 underline"
      >
        <MailIcon className="h-4 w-4" /> {profile.email}
      </a>
      <p className="font-mono text-[11px] text-neutral-600">Phone: {profile.phone}</p>
      <div className="space-y-1.5 pt-1">
        {socialLinks.map((s) => (
          <a
            key={s.href}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-700 underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> {s.label}
          </a>
        ))}
      </div>
      <a
        href={RESUME_PATH}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-2 inline-flex items-center gap-1.5 px-4 py-2 font-bold ${BEVEL} active:translate-y-px`}
      >
        <FloppyIcon className="h-4 w-4" /> Download Resume
      </a>
    </div>
  );
}

function MyComputerContent({ onOpen }: { onOpen: (id: string) => void }) {
  const drives: { id: string; label: string; icon: RetroIcon; note: string }[] = [
    { id: "about", label: "About_Me.txt", icon: DocIcon, note: "Profile" },
    { id: "experience", label: "Experience.log", icon: BriefcaseIcon, note: "Career" },
    { id: "projects", label: "Projects (C:)", icon: FolderIcon, note: "Work" },
    { id: "skills", label: "Skills.sys", icon: ChipIcon, note: "Drivers" },
    { id: "contact", label: "Contact.exe", icon: MailIcon, note: "Address book" },
    { id: "recyclebin", label: "Recycle Bin", icon: RecycleIcon, note: "Empty" },
  ];
  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] text-neutral-500">My Computer · 6 object(s)</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {drives.map((d) => (
          <button
            key={d.id}
            onDoubleClick={() => onOpen(d.id)}
            onClick={() => onOpen(d.id)}
            className="flex flex-col items-center gap-1 rounded p-2 text-center hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
          >
            <d.icon className="h-9 w-9" />
            <span className="text-[11px] font-semibold">{d.label}</span>
            <span className="text-[9px] uppercase text-neutral-400">{d.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecycleBinContent() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <RecycleIcon className="h-14 w-14" />
      <p className="font-bold">The Recycle Bin is empty.</p>
      <p className="max-w-[260px] text-[11px] text-neutral-500">
        Nothing thrown away here. Every line of code made it to production.
      </p>
    </div>
  );
}

function MinesweeperContent({
  mines,
  revealed,
  flagged,
  mineCount,
  mineState,
  time,
  flagMode,
  onToggleFlagMode,
  onReset,
  onClick,
  onRightClick,
  onToggleFlag,
  neighborCount,
}: {
  mines: boolean[];
  revealed: boolean[];
  flagged: boolean[];
  mineCount: number;
  mineState: "playing" | "win" | "lost";
  time: number;
  flagMode: boolean;
  onToggleFlagMode: () => void;
  onReset: () => void;
  onClick: (idx: number) => void;
  onRightClick: (e: React.MouseEvent, idx: number) => void;
  onToggleFlag: (idx: number) => void;
  neighborCount: (idx: number) => number;
}) {
  const numColor = ["", "#0000ff", "#008000", "#ff0000", "#000080", "#800000", "#008080", "#000", "#808080"];

  // Long-press flags on touch (where right-click is unreliable). A long press
  // sets a guard so the trailing click does not also reveal the cell.
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  const startPress = (e: React.PointerEvent, idx: number) => {
    // Long-press is a touch-only affordance. On mouse, right-click handles
    // flagging, so arming the timer there would double-toggle the flag and
    // leave the mine counter looking frozen.
    if (e.pointerType !== "touch") return;
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      onToggleFlag(idx);
    }, 450);
  };
  const cancelPress = () => {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  const handleCellClick = (idx: number) => {
    cancelPress();
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if (flagMode) onToggleFlag(idx);
    else onClick(idx);
  };

  return (
    <div className="flex h-full flex-col items-center gap-3">
      <div className={`${BEVEL_PRESSED} flex w-full items-center justify-between p-2 font-mono text-xs font-bold`}>
        <span className="bg-black px-1.5 py-0.5 text-lg tracking-wider text-red-600" title="Mines remaining">
          {String(mineCount).padStart(3, "0")}
        </span>
        <button onClick={onReset} className={`flex h-8 w-8 items-center justify-center text-base ${BEVEL}`} title="New game">
          {mineState === "win" ? "😎" : mineState === "lost" ? "😵" : "🙂"}
        </button>
        <span className="bg-black px-1.5 py-0.5 text-lg tracking-wider text-red-600" title="Time elapsed">
          {String(time).padStart(3, "0")}
        </span>
      </div>

      <div className="grid w-fit grid-cols-8 gap-1 border-2 border-b-white border-l-gray-700 border-r-white border-t-gray-700 bg-neutral-400 p-1">
        {mines.map((isMine, idx) => {
          const rev = revealed[idx];
          const count = neighborCount(idx);
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              onContextMenu={(e) => onRightClick(e, idx)}
              onPointerDown={(e) => startPress(e, idx)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              onPointerCancel={cancelPress}
              className={`flex h-7 w-7 touch-none items-center justify-center font-mono text-sm font-black focus:outline-none ${
                rev ? "border border-neutral-400 bg-neutral-300" : `${BEVEL} hover:brightness-105`
              }`}
            >
              {rev ? (
                isMine ? "💣" : count > 0 ? <span style={{ color: numColor[count] }}>{count}</span> : ""
              ) : flagged[idx] ? "🚩" : ""}
            </button>
          );
        })}
      </div>

      <button
        onClick={onToggleFlagMode}
        className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-bold ${BEVEL} ${
          flagMode ? "text-red-700" : "text-neutral-700"
        }`}
        title="Toggle flag mode for tapping"
      >
        {flagMode ? "🚩 Flag mode: ON" : "⛏️ Dig mode (tap to flag)"}
      </button>
      <p className="text-center font-mono text-[10px] leading-tight text-neutral-500">
        Tap to dig · long-press or right-click to flag.
        <br />
        Tap a number to chord. First click is always safe.
      </p>
    </div>
  );
}
