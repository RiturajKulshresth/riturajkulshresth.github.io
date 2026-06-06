/**
 * Interactive command-line portfolio shell. Portfolio content from `@/lib/data`
 * is exposed as a virtual filesystem (`ls`, `cd`, `cat`) plus named commands.
 * Tab completion, arrow-key history, ghost suggestions, and a Matrix screensaver
 * round out the terminal experience.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Terminal as CliIcon } from "lucide-react";
import {
  profile,
  experience,
  projects,
  skillGroups,
  accolades,
  socialLinks,
  RESUME_PATH,
} from "@/lib/data";
import BackButton from "./back-button";

type LineType =
  | "input"
  | "text"
  | "muted"
  | "accent"
  | "error"
  | "heading"
  | "link";

interface Line {
  text: string;
  type: LineType;
  href?: string;
}

const PROMPT_USER = "rituraj@portfolio";

const COMMANDS = [
  "help",
  "about",
  "experience",
  "projects",
  "skills",
  "education",
  "social",
  "contact",
  "email",
  "resume",
  "whoami",
  "neofetch",
  "ls",
  "cd",
  "cat",
  "pwd",
  "history",
  "date",
  "echo",
  "theme",
  "sudo",
  "banner",
  "matrix",
  "clear",
] as const;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ── A tiny virtual filesystem rooted at ~ ──
type FsNode = { type: "dir"; children: Record<string, FsNode> } | { type: "file"; lines: Line[] };

function buildFs(): FsNode {
  const expChildren: Record<string, FsNode> = {};
  experience.forEach((job) => {
    const lines: Line[] = [
      { text: `${job.role}`, type: "accent" },
      { text: `${job.company} · ${job.period} · ${job.location}`, type: "muted" },
      { text: "", type: "text" },
      { text: job.summary, type: "text" },
      { text: "", type: "text" },
    ];
    job.highlights.forEach((h) => lines.push({ text: `  - ${h}`, type: "text" }));
    lines.push({ text: "", type: "text" });
    expChildren[`${slug(job.company)}.log`] = { type: "file", lines };
  });

  const projChildren: Record<string, FsNode> = {};
  projects.forEach((p) => {
    const lines: Line[] = [
      { text: `${p.title}  (${p.year})`, type: "accent" },
      { text: p.subtitle, type: "muted" },
      { text: "", type: "text" },
      { text: p.description, type: "text" },
      { text: "", type: "text" },
      { text: `tags: ${p.tags.join(", ")}`, type: "muted" },
    ];
    if (p.link) lines.push({ text: p.link, type: "link", href: p.link });
    lines.push({ text: "", type: "text" });
    projChildren[`${slug(p.title)}.md`] = { type: "file", lines };
  });

  return {
    type: "dir",
    children: {
      "about.txt": {
        type: "file",
        lines: [
          { text: profile.bio, type: "text" },
          { text: "", type: "text" },
          { text: `Location : ${profile.location}`, type: "muted" },
          { text: `Email    : ${profile.email}`, type: "muted" },
          { text: `Status   : ${profile.status}`, type: "muted" },
        ],
      },
      experience: { type: "dir", children: expChildren },
      projects: { type: "dir", children: projChildren },
      "skills.txt": {
        type: "file",
        lines: skillGroups.flatMap((g) => [
          { text: g.title, type: "accent" as LineType },
          { text: `  ${g.items.join(" · ")}`, type: "text" as LineType },
          { text: "", type: "text" as LineType },
        ]),
      },
      "education.txt": {
        type: "file",
        lines: accolades.flatMap((a) => [
          { text: `${a.title} · ${a.organisation} (${a.period})`, type: "accent" as LineType },
          { text: `  ${a.description}`, type: "text" as LineType },
          { text: "", type: "text" as LineType },
        ]),
      },
      "social.txt": {
        type: "file",
        lines: socialLinks.map((s) => ({
          text: `${s.label.padEnd(10)} ${s.href}`,
          type: "link" as LineType,
          href: s.href,
        })),
      },
      "resume.pdf": {
        type: "file",
        lines: [{ text: "(binary) run 'resume' to open the PDF in a new tab.", type: "muted" }],
      },
    },
  };
}

const banner: Line[] = [
  { text: "  ____  _ _                    _ ", type: "accent" },
  { text: " |  _ \\(_) |_ _   _ _ __ __ _ (_)", type: "accent" },
  { text: " | |_) | | __| | | | '__/ _` || |", type: "accent" },
  { text: " |  _ <| | |_| |_| | | | (_| || |", type: "accent" },
  { text: " |_| \\_\\_|\\__|\\__,_|_|  \\__,_|/ |", type: "accent" },
  { text: "                           |__/  ", type: "accent" },
  { text: "", type: "text" },
  { text: `${profile.name} · ${profile.role}`, type: "heading" },
  { text: "Type 'help' for commands, or 'ls' to browse. [Tab] completes, [↑/↓] history.", type: "muted" },
  { text: "", type: "text" },
];

export default function Cli() {
  const [history, setHistory] = useState<Line[]>(banner);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState(-1);
  const [matrixOn, setMatrixOn] = useState(false);
  const [light, setLight] = useState(false);
  const [cwd, setCwd] = useState<string[]>([]); // path under ~

  const fs = useMemo(buildFs, []);
  const tabState = useRef<{ base: string; matches: string[]; idx: number } | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const matrixRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, matrixOn]);

  const push = useCallback((lines: Line[]) => {
    setHistory((prev) => [...prev, ...lines]);
  }, []);

  const cwdString = useMemo(() => (cwd.length ? `~/${cwd.join("/")}` : "~"), [cwd]);

  // Resolve a node from the root for a given path array.
  const nodeAt = useCallback(
    (path: string[]): FsNode | null => {
      let node: FsNode = fs;
      for (const seg of path) {
        if (node.type !== "dir" || !node.children[seg]) return null;
        node = node.children[seg];
      }
      return node;
    },
    [fs]
  );

  const run = useCallback(
    (raw: string) => {
      const clean = raw.trim();
      if (!clean) return;
      setCmdHistory((prev) => [...prev, clean]);
      setHistIndex(-1);
      push([{ text: `${PROMPT_USER}:${cwdString}$ ${clean}`, type: "input" }]);

      const parts = clean.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(" ");

      switch (cmd) {
        case "help":
          push([
            { text: "Available commands", type: "heading" },
            { text: "  about        Who I am", type: "text" },
            { text: "  experience   Career timeline (with highlights)", type: "text" },
            { text: "  projects     Selected work", type: "text" },
            { text: "  skills       Tools and stacks", type: "text" },
            { text: "  education    Recognition and academics", type: "text" },
            { text: "  social       Links across the web", type: "text" },
            { text: "  contact      Email and socials", type: "text" },
            { text: "  resume       Open my resume (PDF)", type: "text" },
            { text: "  ls / cd / cat / pwd   Browse the virtual filesystem", type: "text" },
            { text: "  neofetch     System summary", type: "text" },
            { text: "  history      Command history", type: "text" },
            { text: "  date         Current date and time", type: "text" },
            { text: "  echo <text>  Print text", type: "text" },
            { text: "  theme        Toggle light / dark grey", type: "text" },
            { text: "  whoami       Session details", type: "text" },
            { text: "  banner       Reprint the header", type: "text" },
            { text: "  matrix       Toggle the rain screensaver", type: "text" },
            { text: "  clear        Wipe the screen", type: "text" },
            { text: "", type: "text" },
          ]);
          break;

        case "about":
          push([
            { text: "about", type: "heading" },
            { text: profile.bio, type: "text" },
            { text: "", type: "text" },
            { text: `Location : ${profile.location}`, type: "muted" },
            { text: `Status   : ${profile.status}`, type: "muted" },
            { text: "", type: "text" },
          ]);
          break;

        case "experience": {
          const out: Line[] = [{ text: "experience", type: "heading" }];
          experience.forEach((job) => {
            out.push({ text: `${job.role}`, type: "accent" });
            out.push({ text: `${job.company} · ${job.period} · ${job.location}`, type: "muted" });
            out.push({ text: `  ${job.summary}`, type: "text" });
            job.highlights.forEach((h) => out.push({ text: `    - ${h}`, type: "text" }));
            out.push({ text: "", type: "text" });
          });
          push(out);
          break;
        }

        case "projects": {
          const out: Line[] = [{ text: "projects", type: "heading" }];
          projects.forEach((p, i) => {
            out.push({ text: `${String(i + 1).padStart(2, "0")}. ${p.title}  (${p.year})`, type: "accent" });
            out.push({ text: `    ${p.subtitle}`, type: "muted" });
            out.push({ text: `    ${p.tags.join(", ")}`, type: "muted" });
            if (p.link) out.push({ text: `    ${p.link}`, type: "link", href: p.link });
            out.push({ text: "", type: "text" });
          });
          push(out);
          break;
        }

        case "skills": {
          const out: Line[] = [{ text: "skills", type: "heading" }];
          skillGroups.forEach((g) => {
            out.push({ text: g.title, type: "accent" });
            out.push({ text: `  ${g.items.join(" · ")}`, type: "text" });
            out.push({ text: "", type: "text" });
          });
          push(out);
          break;
        }

        case "education": {
          const out: Line[] = [{ text: "recognition & academics", type: "heading" }];
          accolades.forEach((a) => {
            out.push({ text: `${a.title} · ${a.organisation} (${a.period})`, type: "accent" });
            out.push({ text: `  ${a.description}`, type: "text" });
            out.push({ text: "", type: "text" });
          });
          push(out);
          break;
        }

        case "social": {
          const out: Line[] = [{ text: "social", type: "heading" }];
          socialLinks.forEach((s) => {
            out.push({ text: `${s.label.padEnd(10)} ${s.href}`, type: "link", href: s.href });
          });
          out.push({ text: "", type: "text" });
          push(out);
          break;
        }

        case "contact": {
          const out: Line[] = [
            { text: "contact", type: "heading" },
            { text: `email     ${profile.email}`, type: "link", href: `mailto:${profile.email}` },
            { text: `phone     ${profile.phone}`, type: "muted" },
          ];
          socialLinks.forEach((s) => {
            out.push({ text: `${s.label.padEnd(10)}${s.href}`, type: "link", href: s.href });
          });
          out.push({ text: "", type: "text" });
          push(out);
          break;
        }

        case "email":
          push([{ text: `Opening a draft to ${profile.email} ...`, type: "accent" }, { text: "", type: "text" }]);
          window.location.href = `mailto:${profile.email}`;
          break;

        case "resume":
          push([{ text: "Opening resume in a new tab ...", type: "accent" }, { text: "", type: "text" }]);
          window.open(RESUME_PATH, "_blank", "noopener,noreferrer");
          break;

        case "pwd":
          push([{ text: cwdString, type: "text" }, { text: "", type: "text" }]);
          break;

        case "ls": {
          const node = nodeAt(cwd);
          if (!node || node.type !== "dir") {
            push([{ text: "ls: not a directory", type: "error" }, { text: "", type: "text" }]);
            break;
          }
          const entries = Object.entries(node.children).map(([name, n]) =>
            n.type === "dir" ? `${name}/` : name
          );
          push([{ text: entries.join("   "), type: "text" }, { text: "", type: "text" }]);
          break;
        }

        case "cd": {
          if (!arg || arg === "~" || arg === "/") {
            setCwd([]);
            break;
          }
          if (arg === "..") {
            setCwd((prev) => prev.slice(0, -1));
            break;
          }
          const target = arg.replace(/\/$/, "");
          const next = [...cwd, target];
          const node = nodeAt(next);
          if (node && node.type === "dir") setCwd(next);
          else if (node && node.type === "file")
            push([{ text: `cd: not a directory: ${arg}`, type: "error" }, { text: "", type: "text" }]);
          else push([{ text: `cd: no such directory: ${arg}`, type: "error" }, { text: "", type: "text" }]);
          break;
        }

        case "cat": {
          if (!arg) {
            push([{ text: "usage: cat <file>", type: "muted" }, { text: "", type: "text" }]);
            break;
          }
          const node = nodeAt([...cwd, arg]);
          if (node && node.type === "file") push([...node.lines, { text: "", type: "text" }]);
          else if (node && node.type === "dir")
            push([{ text: `cat: ${arg}: is a directory`, type: "error" }, { text: "", type: "text" }]);
          else push([{ text: `cat: ${arg}: no such file`, type: "error" }, { text: "", type: "text" }]);
          break;
        }

        case "neofetch": {
          const art = [
            "        /\\_/\\  ",
            "       ( o.o ) ",
            "        > ^ <  ",
            "       /     \\ ",
          ];
          const info = [
            `${profile.name}`,
            "-".repeat(profile.name.length),
            `role     ${profile.role}`,
            `host     riturajkulshresth.github.io`,
            `shell    roboto-mono cli v2.0`,
            `location ${profile.location}`,
            `projects ${projects.length}`,
            `roles    ${experience.length}`,
            `uptime   ${Math.floor(performance.now() / 1000)}s`,
            `theme    ${light ? "light-grey" : "dark-grey"}`,
          ];
          const out: Line[] = [];
          const rows = Math.max(art.length, info.length);
          for (let i = 0; i < rows; i++) {
            const left = (art[i] ?? "").padEnd(16);
            const right = info[i] ?? "";
            out.push({ text: `${left}${right}`, type: i === 0 ? "accent" : "text" });
          }
          out.push({ text: "", type: "text" });
          push(out);
          break;
        }

        case "history": {
          const out: Line[] = cmdHistory.map((c, i) => ({
            text: `${String(i + 1).padStart(4, " ")}  ${c}`,
            type: "muted",
          }));
          out.push({ text: "", type: "text" });
          push(out);
          break;
        }

        case "date":
          push([{ text: new Date().toString(), type: "text" }, { text: "", type: "text" }]);
          break;

        case "echo":
          push([{ text: arg, type: "text" }, { text: "", type: "text" }]);
          break;

        case "theme":
          setLight((v) => !v);
          push([{ text: `theme -> ${!light ? "light" : "dark"} grey`, type: "accent" }, { text: "", type: "text" }]);
          break;

        case "sudo":
          push([
            { text: `[sudo] password for guest:`, type: "muted" },
            { text: "guest is not in the sudoers file. This incident will be reported.", type: "error" },
            { text: "(nice try - but you already have read access to everything here.)", type: "muted" },
            { text: "", type: "text" },
          ]);
          break;

        case "whoami":
          push([
            { text: `guest@portfolio`, type: "text" },
            { text: `shell  : roboto-mono cli v2.0`, type: "muted" },
            { text: `host   : riturajkulshresth.github.io`, type: "muted" },
            { text: `cwd    : ${cwdString}`, type: "muted" },
            { text: `uptime : ${Math.floor(performance.now() / 1000)}s`, type: "muted" },
            { text: "", type: "text" },
          ]);
          break;

        case "banner":
          push(banner);
          break;

        case "matrix":
          setMatrixOn(true);
          break;

        case "clear":
          setHistory([]);
          break;

        default:
          push([
            { text: `command not found: ${cmd}. Type 'help'.`, type: "error" },
            { text: "", type: "text" },
          ]);
          break;
      }
    },
    [push, cwd, cwdString, nodeAt, light, cmdHistory]
  );

  // Compute current completion candidates for ghost text + Tab cycling.
  const completion = useMemo(() => {
    const trimmed = input.replace(/^\s+/, "");
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1) {
      // Complete file/dir names for cd/cat.
      const first = parts[0].toLowerCase();
      if (first === "cd" || first === "cat") {
        const node = nodeAt(cwd);
        if (node && node.type === "dir") {
          const partial = parts[parts.length - 1];
          const names = Object.entries(node.children)
            .filter(([, n]) => (first === "cd" ? n.type === "dir" : true))
            .map(([name, n]) => (n.type === "dir" ? `${name}/` : name))
            .filter((n) => n.startsWith(partial));
          return { base: partial, matches: names };
        }
      }
      return { base: "", matches: [] as string[] };
    }
    if (!trimmed) return { base: "", matches: [] as string[] };
    return {
      base: trimmed,
      matches: COMMANDS.filter((c) => c.startsWith(trimmed.toLowerCase())) as unknown as string[],
    };
  }, [input, cwd, nodeAt]);

  const ghost =
    completion.matches.length > 0 && completion.base
      ? completion.matches[0].slice(completion.base.length)
      : "";

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const { base, matches } = completion;
      if (matches.length === 0) return;
      // Cycle through multiple matches on repeated Tab.
      if (tabState.current && tabState.current.base === base) {
        tabState.current.idx = (tabState.current.idx + 1) % matches.length;
      } else {
        tabState.current = { base, matches, idx: 0 };
      }
      const choice = matches[tabState.current.idx];
      const prefix = input.slice(0, input.length - base.length);
      setInput(prefix + choice);
      return;
    }
    tabState.current = null;
    if (e.key === "ArrowRight" && ghost) {
      // Accept ghost suggestion.
      if (inputRef.current && inputRef.current.selectionStart === input.length) {
        e.preventDefault();
        setInput(input + ghost);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const next = Math.min(histIndex + 1, cmdHistory.length - 1);
      setHistIndex(next);
      setInput(cmdHistory[cmdHistory.length - 1 - next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = histIndex - 1;
      if (next >= 0) {
        setHistIndex(next);
        setInput(cmdHistory[cmdHistory.length - 1 - next]);
      } else {
        setHistIndex(-1);
        setInput("");
      }
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    run(input);
    setInput("");
    tabState.current = null;
  };

  // Matrix rain screensaver, toned to neutral grey.
  useEffect(() => {
    if (!matrixOn) return;
    const canvas = matrixRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);
    const cols = Math.floor(width / 16);
    const drops = Array(cols).fill(1);
    const glyphs = "01ｱｲｳｴｵｶｷｸｹｺabcdef<>/{}[]=$#".split("");

    const render = () => {
      ctx.fillStyle = "rgba(20, 20, 22, 0.06)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "14px monospace";
      for (let i = 0; i < drops.length; i++) {
        const g = glyphs[Math.floor(Math.random() * glyphs.length)];
        ctx.fillText(g, i * 16, drops[i] * 16);
        if (drops[i] * 16 > height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const interval = setInterval(render, 40);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMatrixOn(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", onEsc);
    };
  }, [matrixOn]);

  const lineColor = (t: LineType) => {
    if (light) {
      switch (t) {
        case "input":
          return "text-zinc-900 font-medium";
        case "muted":
          return "text-zinc-500";
        case "accent":
          return "text-zinc-900 font-semibold";
        case "heading":
          return "text-zinc-500 uppercase tracking-[0.25em] text-[11px]";
        case "error":
          return "text-red-600";
        default:
          return "text-zinc-700";
      }
    }
    switch (t) {
      case "input":
        return "text-zinc-100 font-medium";
      case "muted":
        return "text-zinc-500";
      case "accent":
        return "text-zinc-50 font-semibold";
      case "heading":
        return "text-zinc-400 uppercase tracking-[0.25em] text-[11px]";
      case "error":
        return "text-red-400";
      default:
        return "text-zinc-300";
    }
  };

  const linkClass = light
    ? "text-zinc-600 underline decoration-zinc-400 underline-offset-2 transition hover:text-zinc-900"
    : "text-zinc-400 underline decoration-zinc-600 underline-offset-2 transition hover:text-zinc-100";

  return (
    <div
      className={`relative flex h-screen min-h-screen w-full select-none flex-col overflow-hidden pb-4 transition-colors ${
        light ? "bg-[#e7e5e4] text-zinc-700" : "bg-[#1a1a1c] text-zinc-300"
      }`}
      style={{ fontFamily: "var(--font-roboto-mono), ui-monospace, monospace" }}
    >
      {matrixOn ? (
        <div className="relative h-full w-full bg-[#141416]">
          <canvas ref={matrixRef} className="absolute inset-0 h-full w-full" />
          <button
            onClick={() => setMatrixOn(false)}
            className="absolute left-4 top-4 z-10 rounded border border-zinc-700 bg-[#1a1a1c]/90 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
          >
            exit matrix [esc]
          </button>
        </div>
      ) : (
        <div
          className="custom-scrollbar flex h-full flex-col overflow-y-auto p-4 md:p-8"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Header */}
          <header
            className={`mb-5 flex select-none flex-col gap-4 border-b pb-3 sm:flex-row sm:items-center sm:justify-between ${
              light ? "border-zinc-300" : "border-zinc-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CliIcon className={`h-4 w-4 ${light ? "text-zinc-400" : "text-zinc-500"}`} />
              <h1
                className={`text-sm font-medium tracking-wide ${light ? "text-zinc-700" : "text-zinc-200"}`}
                style={{ fontFamily: "var(--font-roboto), system-ui, sans-serif" }}
              >
                {profile.name.toLowerCase().replace(/\s+/g, "-")} · cli
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLight((v) => !v)}
                className={`rounded border px-2 py-0.5 text-xs transition ${
                  light
                    ? "border-zinc-300 text-zinc-500 hover:border-zinc-500 hover:text-zinc-900"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"
                }`}
                title="Toggle theme"
              >
                {light ? "dark" : "light"}
              </button>
              <BackButton />
            </div>
          </header>

          {/* Output buffer */}
          <main className="flex-grow space-y-0.5 text-[13px] leading-relaxed">
            {history.map((line, i) =>
              line.type === "link" && line.href ? (
                <div key={i} className="whitespace-pre-wrap break-words">
                  <a href={line.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {line.text}
                  </a>
                </div>
              ) : (
                <div key={i} className={`whitespace-pre-wrap break-words ${lineColor(line.type)}`}>
                  {line.text}
                </div>
              )
            )}
            <div ref={endRef} />
          </main>

          {/* Quick commands */}
          <div
            className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-4 select-none ${
              light ? "border-zinc-300" : "border-zinc-800"
            }`}
          >
            <span className={`text-[10px] uppercase tracking-widest ${light ? "text-zinc-400" : "text-zinc-600"}`}>
              run:
            </span>
            {["about", "experience", "projects", "skills", "ls", "neofetch", "social", "resume", "clear"].map((c) => (
              <button
                key={c}
                onClick={() => run(c)}
                className={`rounded border px-2 py-0.5 text-xs transition ${
                  light
                    ? "border-zinc-300 text-zinc-500 hover:border-zinc-500 hover:text-zinc-900"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Prompt */}
          <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2 text-[13px]">
            <span className={`shrink-0 ${light ? "text-zinc-500" : "text-zinc-500"}`}>
              {PROMPT_USER}:{cwdString}$
            </span>
            <div className="relative flex-grow">
              <input
                ref={inputRef}
                autoFocus
                value={input}
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                className={`w-full bg-transparent p-0 focus:outline-none ${
                  light ? "text-zinc-900 caret-zinc-700" : "text-zinc-100 caret-zinc-300"
                }`}
                placeholder="type a command, e.g. ls"
              />
              {ghost && (
                <span
                  className={`pointer-events-none absolute left-0 top-0 whitespace-pre ${
                    light ? "text-zinc-400" : "text-zinc-600"
                  }`}
                  // `ch` tracks monospace character width so the ghost suffix
                  // lines up with the typed prefix in the real input.
                  style={{ paddingLeft: `${input.length}ch` }}
                  aria-hidden
                >
                  {ghost}
                </span>
              )}
            </div>
            {ghost && (
              <span className={`shrink-0 text-[10px] ${light ? "text-zinc-400" : "text-zinc-600"}`}>
                → to accept
              </span>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
