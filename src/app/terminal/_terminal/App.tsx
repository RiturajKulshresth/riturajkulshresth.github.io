/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import ShaderCanvas from "./components/ShaderCanvas";
import ProjectGrid from "./components/ProjectGrid";
import SkillMatrix from "./components/SkillMatrix";
import ResumeTimeline from "./components/ResumeTimeline";
import AiCore from "./components/AiCore";
import BootSequence from "./components/BootSequence";
import CoreVisualizer from "./components/CoreVisualizer";
import SpectralAnalyzer from "./components/SpectralAnalyzer";
import TelemetrySparkGrid from "./components/TelemetrySparkGrid";
import EntropyMeter from "./components/EntropyMeter";
import { synth } from "./audio";
import { SystemLog } from "./types";
import { OverdriveProvider, useOverdrive, useStamina } from "./contexts/OverdriveContext";
import {
  Terminal,
  Activity,
  Tv,
  Volume2,
  VolumeX,
  Compass,
  Cpu,
  RefreshCw,
  Orbit,
  Crosshair,
  Wifi,
  Radio,
  Zap
} from "lucide-react";

// Initial set of system telemetry log entries
const SECURE_LOGS: SystemLog[] = [
  { id: "1", timestamp: "13:45:22", category: "SYSTEM", message: "BOOTING AEGIS ENGINE ASSEMBLY... PORT PORT_3000 OPENED", status: "INFO" },
  { id: "2", timestamp: "13:45:23", category: "SECURE", message: "ESTABLISHING QUANTUM COGNITIVE LINKS TO GEMINI CORE", status: "SUCCESS" },
  { id: "3", timestamp: "13:45:24", category: "QUANTUM", message: "CALIBRATING 3D SHADER WAVEFRONT MAPS... COMPRESSION DITHER ENFORCED", status: "INFO" },
];

type LogCategory = SystemLog["category"];
type LogStatus = SystemLog["status"];
type LogTemplate = string | (() => string);

// Helpers for templated log messages. Kept lightweight so the timer
// can mint a fresh dynamic line on every tick without garbage churn.
const ri = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const rf = (lo: number, hi: number, decimals = 1) =>
  ((Math.random() * (hi - lo) + lo)).toFixed(decimals);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Per-category message pools. Each entry is either a static string or a
// thunk that returns a fresh string. Messages reference the actual stack
// (AEGIS, Daisy, ACME, Knowledge Hub, Gemini, OpenSearch, etc.) so the
// feed reads as if it is genuinely running THIS portfolio rather than a
// generic sci-fi terminal.
const LOG_POOL: Record<LogCategory, LogTemplate[]> = {
  SYSTEM: [
    () => `GC SWEEP DEALLOCATED ~${ri(4, 48)} MB FROM HEAP`,
    () => `SHADER PIPELINE WARM / FRAG_REJECTS=${ri(0, 3)}`,
    () => `VITE HMR CHANNEL ACK / module #${ri(120, 988)}`,
    () => `WORKER POOL SCALED TO ${ri(4, 16)} THREADS`,
    () => `BOOT_SEQ STAGE_${ri(2, 9).toString().padStart(2, "0")} PASSED`,
    () => `CACHE WARMUP ${ri(40, 240)}/${ri(240, 480)} SEGMENTS`,
    "AEGIS RUNTIME RECLOCK / DRIFT NORMALISED",
    "REACT FIBER COMMIT PHASE COMPLETE",
    "WEBGL CONTEXT RESTORED / DPR LOCKED",
    () => `EVENT LOOP TICK BUDGET ${rf(0.4, 2.1)}ms`
  ],
  SECURE: [
    () => `AEGIS HANDSHAKE OK / subj=guest_${ri(1000, 9999).toString(16).toUpperCase()}`,
    () => `SAST SWEEP: 0 CRITICAL / 0 HIGH / ${ri(0, 6)} LOW`,
    () => `TOKEN VAULT UNSEALED / ${ri(8, 24)} SECRETS LOADED`,
    () => `CERT ROTATION OK / EXPIRY +${ri(60, 365)}d`,
    "MFA CHALLENGE ACCEPTED / agentless_caller",
    "RBAC RULE TABLE REINDEXED",
    () => `AUDIT TRAIL SEALED FOR EPOCH=${ri(11200, 11299)}`,
    "ACME PASSPORT PROPAGATED ACROSS SUBAGENTS",
    "PII REDACTION FILTERS ACTIVE / 12 RULES MATCHED",
    () => `SBOM ATTESTED / ${ri(380, 612)} PACKAGES INVENTORIED`
  ],
  QUANTUM: [
    () => `RAYMARCH STEP COUNT CAPPED AT ${ri(48, 96)} / IDLE FRAMES`,
    "BAYER DITHER MATRIX REGENERATED",
    () => `FFT WINDOW ${ri(1, 8)}/8 / SPECTRAL ENVELOPE OK`,
    () => `QUANTIZATION DRIFT < ${rf(0.0005, 0.004, 4)} / WAVE FUNCTION STABLE`,
    "ATTRACTOR LATTICE REPHASED",
    "PARALLAX MASK RECOMPUTED",
    () => `FRAG NOISE SEED ROTATED -> 0x${ri(0x1000, 0xffff).toString(16).toUpperCase()}`,
    "SDF FIELD GRADIENT NORMALISED",
    () => `CRT BLOOM KERNEL RADIUS ${rf(0.8, 2.4)} px`,
    "BLOCH SPHERE PRECESSION TRACE LOCKED"
  ],
  NETWORK: [
    () => `INGRESS: GET /api/sessions 200 (${ri(18, 142)}ms)`,
    () => `EGRESS: ${rf(0.4, 4.2)}K PACKETS / ${rf(8, 96)} MB/s`,
    () => `WEBSOCKET HEARTBEAT / RTT ${ri(6, 48)}ms`,
    "DNS RESOLVED gemini.googleapis.com via cache",
    "TLS 1.3 HANDSHAKE COMPLETE / SUITE=AES_256_GCM",
    () => `RETRY: upstream timeout / attempt ${ri(1, 3)}/3`,
    () => `CDN HIT RATE ${ri(82, 99)}% over 60s window`,
    "EDGE NODE FAILOVER -> us-west-2",
    () => `BACKPRESSURE BUFFER ${ri(3, 22)}% / NORMAL`,
    () => `gRPC STREAM ACK / window=${ri(32, 256)}KB`
  ],
  COGNITION: [
    () => `GEMINI 2.5 FLASH: ${ri(96, 184)} tok/s sustained`,
    () => `AEGIS CONTEXT WINDOW: ${ri(620, 7400)}/8192 tokens`,
    () => `RAG RETRIEVAL: ${ri(3, 12)} chunks above ${rf(0.72, 0.92, 2)} cosine`,
    () => `DAISY AGENT LOOP: ${ri(1, 5)} tool calls / ${ri(0, 2)} reflections`,
    () => `EMBEDDING BATCH (${ri(40, 420)} docs) -> opensearch index daisy-prod`,
    () => `PROMPT CHAIN COMPRESSED: -${ri(18, 42)}% tokens vs baseline`,
    "AGENT GUARDRAIL TRIPPED / FALLBACK ENGAGED",
    "MEMORY COMPRESSION: -66% chat history footprint",
    "KNOWLEDGE HUB CONNECTOR: jira / confluence / s3 sync OK",
    () => `EVAL RUN: ${ri(60, 240)} samples / DeepEval correctness ${ri(78, 96)}%`
  ],
  TELEMETRY: [
    () => `CPU OSC: ${ri(28, 92)}% / NET RATE: ${rf(8, 96)} GB/s`,
    () => `HEAP HIGH-WATER: ${ri(420, 880)} MB`,
    () => `GPU TEMP STABLE @ ${ri(48, 72)}°C`,
    () => `BACKPRESSURE BUFFER ${ri(3, 24)}% / NORMAL`,
    () => `ENTROPY FIELD DELTA < ${rf(0.01, 0.08, 2)}`,
    () => `PACKET LOSS WINDOW: ${rf(0.0, 0.3, 2)}% / WITHIN SLO`,
    () => `FRAME BUDGET ${rf(8.0, 16.7)}ms / 60fps locked`,
    () => `SPARK SAMPLE COUNT ${ri(48, 64)}/${ri(60, 80)} per channel`,
    () => `LATENCY P99: ${ri(80, 240)}ms over last ${ri(60, 600)}s`,
    "DIAL NEEDLE TRACE LOCKED / NO HYSTERESIS"
  ]
};

// Weighted distribution over categories. Higher weight = more frequent.
const CATEGORY_WEIGHTS: Array<[LogCategory, number]> = [
  ["SYSTEM", 22],
  ["QUANTUM", 18],
  ["NETWORK", 18],
  ["COGNITION", 18],
  ["TELEMETRY", 14],
  ["SECURE", 10]
];

// Weighted distribution over status flags. CRITICAL is rare on purpose
// so the red pulse actually means something when it appears.
const STATUS_WEIGHTS: Array<[LogStatus, number]> = [
  ["INFO", 58],
  ["SUCCESS", 22],
  ["WARNING", 14],
  ["CRITICAL", 6]
];

const sampleWeighted = <T,>(table: Array<[T, number]>): T => {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of table) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return table[table.length - 1][0];
};

const APP_THEME = {
  GREEN: {
    text: "text-emerald-400",
    textLight: "text-emerald-300",
    border: "border-emerald-500/20",
    borderDark: "disabled:border-emerald-500/10",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.06)]",
    pulseColor: "bg-emerald-400 shadow-[0_0_4px_#34d399]",
    badge: "bg-emerald-950/40 text-emerald-300 border-[#10b981]/20",
    iconColor: "text-emerald-400",
    hudOverlay: "border-emerald-500/20",
    laserBeam: "bg-emerald-500/10",
    quantumCard: "border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.03)]"
  },
  AMBER: {
    text: "text-amber-500",
    textLight: "text-amber-300/90",
    border: "border-amber-500/20",
    borderDark: "disabled:border-amber-500/10",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.06)]",
    pulseColor: "bg-amber-500 shadow-[0_0_4px_#fbbf24]",
    badge: "bg-amber-950/40 text-amber-300 border-[#f59e0b]/20",
    iconColor: "text-amber-500",
    hudOverlay: "border-amber-500/20",
    laserBeam: "bg-amber-500/10",
    quantumCard: "border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.03)]"
  },
  COSMIC: {
    text: "text-[#00f3ff]",
    textLight: "text-cyan-300",
    border: "border-cyan-500/20",
    borderDark: "disabled:border-cyan-500/10",
    glow: "shadow-[0_0_12px_rgba(0,243,255,0.06)]",
    pulseColor: "bg-[#00f3ff] shadow-[0_0_4px_#00f3ff]",
    badge: "bg-cyan-950/20 text-[#00f3ff] border-[#00f3ff]/20",
    iconColor: "text-[#00f3ff]",
    hudOverlay: "border-[#00f3ff]/20",
    laserBeam: "bg-[#00f3ff]/10",
    quantumCard: "border-cyan-500/20 shadow-[0_0_15px_rgba(0,243,255,0.03)]"
  }
};

function AppShell() {
  const { overdrive, toggleOverdrive, depleted } = useOverdrive();
  const stamina = useStamina();
  const [colorPreset, setColorPreset] = useState<"GREEN" | "AMBER" | "COSMIC">("COSMIC");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hasBooted, setHasBooted] = useState(false);
  const [logs, setLogs] = useState<SystemLog[]>(SECURE_LOGS);
  const logScrollRef = useRef<HTMLDivElement | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cpuOSC, setCpuOSC] = useState(42.4);
  const [netOSC, setNetOSC] = useState(72);
  const [timeStr, setTimeStr] = useState("");

  // BootSequence owns audio unlock and runs a multi-step intro animation.
  // It calls onComplete() once the sequence finishes; sync that with audio state here.
  const handleBootComplete = () => {
    setAudioEnabled(synth.isAudioEnabled());
    setHasBooted(true);
  };

  // Tracking cursor coordinates to print hex sensors in footer
  useEffect(() => {
    const trackCursor = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", trackCursor);
    return () => window.removeEventListener("mousemove", trackCursor);
  }, []);

  // Update clock & oscillatings indicators
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toISOString());
      
      // Floating metrics values
      setCpuOSC((c) => Math.min(Math.max(c + (Math.random() - 0.5) * 6, 20), 99));
      setNetOSC((n) => Math.min(Math.max(n + (Math.random() - 0.5) * 4, 30), 100));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scrolling automatic telemetry logs. Categories and statuses are
  // sampled from weighted tables so CRITICAL pulses stay rare and the
  // category mix matches the AEGIS terminal feel.
  useEffect(() => {
    let counter = 0;
    const logTimer = setInterval(() => {
      const category = sampleWeighted(CATEGORY_WEIGHTS);
      const status = sampleWeighted(STATUS_WEIGHTS);
      const template = pick(LOG_POOL[category]);
      const message = typeof template === "function" ? template() : template;

      counter += 1;

      const newLog: SystemLog = {
        id: `${Date.now()}-${counter}`,
        timestamp: new Date().toLocaleTimeString().split(" ")[0],
        category,
        message,
        status
      };

      setLogs((prev) => {
        const next = [...prev, newLog];
        if (next.length > 90) next.shift(); // Keep logs bounded
        return next;
      });
    }, overdrive ? 600 : 1500);

    return () => clearInterval(logTimer);
  }, [overdrive]);

  // Pin the live log scroller to its newest entry so freshly appended lines
  // are always visible instead of being clipped below the fold.
  useEffect(() => {
    const el = logScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  const handleAudioToggle = () => {
    if (!audioEnabled) {
      const enabled = synth.enable();
      if (enabled) {
        setAudioEnabled(true);
        synth.playStartup();
      }
    } else {
      synth.disable();
      setAudioEnabled(false);
    }
  };

  const selectPreset = (preset: "GREEN" | "AMBER" | "COSMIC") => {
    synth.playClick(1000, 0.04);
    setColorPreset(preset);
  };

  const handleOverdriveToggle = () => {
    // Reject engaging on a locked / empty reserve with a denial blip.
    if (!overdrive && (depleted || stamina <= 1)) {
      synth.playClick(220, 0.12);
      return;
    }
    synth.playOverclock(overdrive ? 500 : 1000);
    toggleOverdrive();
  };

  const overdriveLocked = !overdrive && (depleted || stamina <= 1);
  const overdriveLabel = overdrive
    ? "OVERDRIVE"
    : depleted
    ? "RECHARGING"
    : "OVERDRIVE";

  const getThemeBorderClass = () => {
    if (colorPreset === "AMBER") return "border-amber-500/30 text-amber-400 font-mono";
    if (colorPreset === "COSMIC") return "border-cyan-500/35 text-cyan-300 font-mono";
    return "border-emerald-500/30 text-emerald-400 font-mono";
  };

  const getPresetAccentClass = () => {
    if (colorPreset === "AMBER") return "bg-amber-500 text-black";
    if (colorPreset === "COSMIC") return "bg-cyan-500 text-black";
    return "bg-emerald-500 text-black";
  };

  const logStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS": return "text-cyan-400";
      case "WARNING": return "text-fuchsia-400 animate-pulse";
      case "CRITICAL": return "text-red-500 animate-pulse font-bold";
      default: return "text-cyan-400";
    }
  };

  const themeCtx = APP_THEME[colorPreset] || APP_THEME.COSMIC;

  return (
    <div className={`min-h-screen bg-[#05050b] ${themeCtx.text} font-mono relative overflow-x-hidden selection:bg-[#ff00ff] selection:text-black`}>

      {/* Boot Sequence: gate to satisfy the autoplay gesture requirement, then animated handoff */}
      {!hasBooted && <BootSequence onComplete={handleBootComplete} />}
      
      {/* Immersive Conic and Radial Dithering Pattern */}
      <div className="dither-bg absolute inset-0 pointer-events-none z-0" />

      {/* Cybernetic HUD Corner Brackets */}
      <div className="hud-bracket bracket-tl" />
      <div className="hud-bracket bracket-tr" />
      <div className="hud-bracket bracket-bl" />
      <div className="hud-bracket bracket-br" />

      {/* Immersive WebGL Shader Background simulating warp coordinate field with Bayer Dithering */}
      <ShaderCanvas colorPreset={colorPreset} />

      {/* Cyber Space Scanner Frame Overlay */}
      <div className={`absolute inset-0 border ${themeCtx.hudOverlay} m-2.5 pointer-events-none z-10 hidden md:block`} />

      {/* Dynamic scan laser sweep lines block. Sweeps faster under overdrive. */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${overdrive ? "bg-fuchsia-500/20" : themeCtx.laserBeam} pointer-events-none z-20 animate-scan-beam`}
        style={{ animationDuration: overdrive ? "1.4s" : undefined }}
      />

      {/* Master Viewport Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10 space-y-6">

        {/* --- HEADER COCKPIT BAR --- */}
        <header className={`border ${themeCtx.border} p-4 rounded relative overflow-hidden backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#05050b]/60 ${themeCtx.glow}`}>
          <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${colorPreset === "GREEN" ? "border-emerald-400" : colorPreset === "AMBER" ? "border-amber-400" : "border-cyan-400"}`} />
          <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${colorPreset === "GREEN" ? "border-emerald-400" : colorPreset === "AMBER" ? "border-amber-400" : "border-cyan-400"}`} />
          <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${colorPreset === "GREEN" ? "border-emerald-400" : colorPreset === "AMBER" ? "border-amber-400" : "border-cyan-400"}`} />
          <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${colorPreset === "GREEN" ? "border-emerald-400" : colorPreset === "AMBER" ? "border-amber-400" : "border-cyan-400"}`} />

          {/* Core Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="relative">
              <div className={`p-2 bg-cyan-950/40 border border-cyan-500/40 rounded animate-spin`} style={{ animationDuration: "15s" }}>
                <Orbit className={`w-5 h-5 ${themeCtx.iconColor}`} />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-fuchsia-500 rounded-full animate-ping" />
            </div>
            <div>
              <div className="text-[10px] tracking-widest opacity-60 mb-1">SYSTEM_RECOGNITION // VER 9.4.1</div>
              <h1 className={`text-xl xl:text-2xl font-extrabold glitch-text tracking-[0.05em] ${themeCtx.text} uppercase flex items-baseline gap-2 italic whitespace-nowrap`}>
                <span>RITURAJ KULSHRESTH</span>
                <span className="text-xxs text-fuchsia-500 opacity-80 not-italic">SDE2_ACTIVE</span>
              </h1>
              <p className="text-[10px] text-fuchsia-400 uppercase tracking-widest font-semibold flex items-center gap-1.5 mt-0.5">
                <Compass className={`w-3 h-3 ${themeCtx.iconColor} shrink-0 animate-pulse`} />
                <span>ENTERPRISE AI PLATFORMS ENGINEER // WARNER BROS. DISCOVERY</span>
              </p>
            </div>
          </div>

          {/* Interactive controls and sound toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Back to the main site, sits to the left of the spectrum colors */}
            <a
              href="/"
              title="Back to the main site"
              className={`flex items-center gap-1.5 bg-cyan-950/20 border ${themeCtx.border} px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-widest ${themeCtx.text} hover:border-white/40 transition-colors`}
            >
              <span aria-hidden>&larr;</span>
              <span>BACK TO PAST</span>
            </a>

            {/* Theme switcher colors preset */}
            <div className={`flex items-center space-x-1.5 bg-cyan-950/20 border ${themeCtx.border} px-2 py-1 rounded`}>
              <span className={`font-mono text-[8px] ${themeCtx.text} opacity-50 uppercase mr-1`}>SPECTRUM COLORS:</span>
              <button
                onClick={() => selectPreset("GREEN")}
                className={`w-3.5 h-3.5 rounded-full bg-emerald-500 border cursor-pointer ${colorPreset === "GREEN" ? "border-white scale-110" : "border-transparent"}`}
                title="Green Terminal preset"
              />
              <button
                onClick={() => selectPreset("AMBER")}
                className={`w-3.5 h-3.5 rounded-full bg-amber-500 border cursor-pointer ${colorPreset === "AMBER" ? "border-white scale-110" : "border-transparent"}`}
                title="Amber Retro preset"
              />
              <button
                onClick={() => selectPreset("COSMIC")}
                className={`w-3.5 h-3.5 rounded-full bg-[#00f3ff] border cursor-pointer ${colorPreset === "COSMIC" ? "border-white scale-110" : "border-transparent"}`}
                title="Cosmic Magenta preset"
              />
            </div>

            {/* Global Overdrive Activator. Acts as a stamina reserve: the inner
                bar drains while engaged and recharges while idle. Drives every
                visualizer's speed/accent through the OverdriveContext, kept in
                sync with the SkillMatrix OVERCLOCK button. */}
            <button
              onClick={handleOverdriveToggle}
              disabled={overdriveLocked}
              title={
                overdriveLocked
                  ? "Reactor recharging — overdrive locked until reserve recovers"
                  : "Toggle global overdrive (consumes stamina)"
              }
              className={`relative overflow-hidden p-1.5 rounded border flex items-center gap-2 min-w-[120px] transition-colors duration-300 font-bold uppercase text-xs ${
                overdriveLocked ? "cursor-not-allowed" : "cursor-pointer"
              } ${
                overdrive
                  ? "border-fuchsia-400 text-fuchsia-100 shadow-[0_0_10px_rgba(255,0,255,0.35)]"
                  : depleted
                  ? "border-red-500/60 text-red-300"
                  : "border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
              }`}
            >
              {/* Stamina fill bar. Width tracks the reserve; colour reflects
                  drain (fuchsia), recharge-lock (red), or ready (cyan). */}
              <span
                aria-hidden
                className={`absolute inset-y-0 left-0 transition-[width] duration-100 ease-linear ${
                  overdrive
                    ? "bg-fuchsia-600/45"
                    : depleted
                    ? "bg-red-700/35"
                    : "bg-cyan-600/30"
                }`}
                style={{ width: `${stamina}%` }}
              />
              {/* Leading edge highlight on the bar. */}
              <span
                aria-hidden
                className={`absolute inset-y-0 w-[2px] transition-[left] duration-100 ease-linear ${
                  overdrive ? "bg-fuchsia-300/90" : depleted ? "bg-red-400/80" : "bg-cyan-300/80"
                }`}
                style={{ left: `calc(${stamina}% - 1px)` }}
              />
              <Zap className={`relative w-4 h-4 shrink-0 ${overdrive ? "animate-pulse" : ""}`} />
              <span className="relative flex-1 text-left">{overdriveLabel}</span>
              <span className="relative tabular-nums text-[10px] opacity-80">
                {Math.round(stamina)}%
              </span>
            </button>

            {/* Audio Activator */}
            <button
              onClick={handleAudioToggle}
              className={`p-1.5 rounded border flex items-center space-x-2 transition-all duration-300 font-bold uppercase cursor-pointer text-xs ${
                audioEnabled
                  ? "bg-cyan-950/60 border-[#00f3ff] text-cyan-300 shadow-[0_0_8px_rgba(0,243,255,0.3)] hover:bg-cyan-900/60"
                  : "bg-fuchsia-950/20 border-fuchsia-500/40 text-fuchsia-400 hover:bg-fuchsia-900/20 hover:border-fuchsia-400 animate-pulse"
              }`}
            >
              {audioEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <span>SOUNDS ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 shrink-0" />
                  <span className="text-[10px]">SOUND ENGIN REQD</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* --- MAIN HUD GRID DISPLAY --- */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* LEFT TELEMETRIES: Logs & Cores Status (4 columns) */}
          <section className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
            
            {/* Interactive 3D Core Visualizer node attractor */}
            <CoreVisualizer colorPreset={colorPreset} />

            {/* System Status Metrics Card */}
            <div className="quantum-card border border-cyan-500/20 p-4 rounded relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-[0.03]">
                <Cpu className="w-full h-full text-[#00f3ff]" />
              </div>
              <div className="flex items-center space-x-2 border-b border-cyan-500/10 pb-2.5 mb-3">
                <Activity className="w-4 h-4 text-fuchsia-500 animate-pulse" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#00f3ff]">
                  CORE_TELEMETRY
                </h2>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* CPU Thread Oscillators */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] text-[#00f3ff]/80 mb-1">
                    <span>NEURAL UPTIME:</span>
                    <span>99.999%</span>
                  </div>
                  <div className="status-bar rounded overflow-hidden">
                    <div className="status-fill w-full transition-all duration-300" />
                  </div>
                </div>

                {/* Sub-orbital Network latency oscillates */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] text-[#00f3ff]/80 mb-1">
                    <span>QUANTUM PORT RATE:</span>
                    <span>{netOSC.toFixed(0)} GB/S</span>
                  </div>
                  <div className="status-bar rounded overflow-hidden">
                    <div className="status-fill transition-all duration-300" style={{ width: `${netOSC}%` }} />
                  </div>
                </div>

                {/* Secure channels status indicators */}
                <div className="flex items-center justify-between text-[10px] font-mono border-t border-cyan-500/10 pt-3 mt-3">
                  <span className="text-[#00f3ff]/40">SECURE LINK FEED:</span>
                  <div className="flex items-center space-x-1">
                    <Wifi className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                    <span className="text-fuchsia-300 font-bold uppercase">SEC_AEGIS_01</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Real-Time Waveform Fourier and Lorenz Attractor */}
            <SpectralAnalyzer colorPreset={colorPreset} />

            {/* Sub-system sparklines: HEAP / GPU / NET / IO mini-charts */}
            <TelemetrySparkGrid colorPreset={colorPreset} />

            {/* Dual radial gauges for entropy + stability tracking */}
            <EntropyMeter colorPreset={colorPreset} />

            {/* Live Ticker Logs Terminal. On lg+ it fills the remaining
                column height via flex-1; below lg the column collapses to a
                single grid track so we pin a sensible visible minimum so
                the scroller never renders as a thin sliver. */}
            <div className="quantum-card border border-cyan-500/20 p-4 rounded relative overflow-hidden backdrop-blur-md flex-1 flex flex-col min-h-[420px] lg:min-h-0">
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2.5 mb-3 shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-ping" />
                  <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#00f3ff]">
                    LIVE_SYSTEM_STREAM
                  </h2>
                </div>
                <span className="font-mono text-[8px] text-[#00f3ff]/40">BUFFER: 90_LINES</span>
              </div>

              {/* Log Lines Area. The wrapper is the flex-1 child that claims the
                  remaining card body; the scroller is absolutely positioned
                  inside so its content can never push the card height. */}
              <div className="relative flex-1 min-h-0">
                <div
                  ref={logScrollRef}
                  className="absolute inset-0 text-[10px] font-mono scroller-cyan overflow-y-auto pr-1"
                >
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-1.5 leading-tight py-[1px]">
                      <span className="text-cyan-500/40 shrink-0 font-normal">[{log.timestamp}]</span>
                      <span className={`font-black shrink-0 ${logStatusColor(log.status)}`}>[{log.category}]</span>
                      <span className="text-cyan-200/95">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status indicator system */}
              <div className="border-t border-cyan-500/10 pt-3 mt-3 flex items-center justify-between text-[9px] font-mono text-[#00f3ff]/55 uppercase shrink-0">
                <span>SYSTEM_TICKS: {timeStr ? timeStr.slice(11, 19) : "STANDBY"}</span>
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-fuchsia-500 shrink-0 animate-pulse" />
                  <span>AEGIS RE-CLOCK AUTO_VALID</span>
                </span>
              </div>
            </div>

          </section>

          {/* MAIN COLUMN CONTENT: Projects and Skills (8 columns) */}
          <section className="lg:col-span-8 space-y-4">
            
            {/* Career Resume Timeline Card */}
            <ResumeTimeline colorPreset={colorPreset} />

            {/* Projects Section Card */}
            <div className={`border ${themeCtx.border} p-5 rounded relative overflow-hidden backdrop-blur-md bg-[#05050b]/60 ${themeCtx.glow} selection:bg-fuchsia-500 selection:text-black`}>
              <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${colorPreset === "GREEN" ? "border-emerald-400" : colorPreset === "AMBER" ? "border-amber-400" : "border-cyan-400"}`} />
              <div className={`absolute top-3 right-0 w-16 h-0.5 ${colorPreset === "GREEN" ? "bg-emerald-500/20" : colorPreset === "AMBER" ? "bg-amber-500/20" : "bg-cyan-500/20"}`} />
              <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${colorPreset === "GREEN" ? "border-emerald-400" : colorPreset === "AMBER" ? "border-amber-400" : "border-cyan-400"}`} />
              
              <div className="flex items-center space-x-2 border-b border-cyan-500/10 pb-3 mb-4">
                <Tv className="w-4 h-4 text-fuchsia-500 shrink-0" />
                <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${themeCtx.text}`}>
                  COGNITIVE_FILES_BENTO [PROJECTS]
                </h2>
              </div>
              
              {/* Projects List Grid */}
              <ProjectGrid colorPreset={colorPreset} />
            </div>

            {/* Core Competencies Skill Matrix Card */}
            <div className={`border ${themeCtx.border} p-5 rounded relative overflow-hidden backdrop-blur-md bg-[#05050b]/60 ${themeCtx.glow} selection:bg-fuchsia-500 selection:text-black`}>
              <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${colorPreset === "GREEN" ? "border-emerald-400" : colorPreset === "AMBER" ? "border-amber-400" : "border-cyan-400"}`} />
              <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${colorPreset === "GREEN" ? "border-emerald-400" : colorPreset === "AMBER" ? "border-amber-400" : "border-cyan-400"}`} />

              <div className="flex items-center space-x-2 border-b border-cyan-500/10 pb-3 mb-4">
                <Orbit className="w-4 h-4 text-fuchsia-500" />
                <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${themeCtx.text}`}>
                  SYSTEM_CAPABILITIES_ARRAY [SKILLS]
                </h2>
              </div>

              {/* Skills Interactive Matrix Component */}
              <SkillMatrix colorPreset={colorPreset} />
            </div>

          </section>

        </main>

        {/* --- ASSISTANT AI CONSOLE: Cognitive Oracle AEGIS --- */}
        <section className="mt-4">
          <div className="text-center mb-3">
            <span className="font-mono text-[9px] text-[#00f3ff]/50 uppercase tracking-widest font-black">
              &gt;&gt; STICKY SECURE COGNITION CHANNEL INTERFACE &lt;&lt;
            </span>
          </div>
          <AiCore />
        </section>

        {/* --- SYSTEM FOOTER METRICS --- */}
        <footer className="quantum-card border border-cyan-500/20 px-4 py-3 rounded relative overflow-hidden backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between text-[10px] font-mono text-[#00f3ff]/50 gap-2">
          {/* Left copyright details */}
          <div className="flex items-center space-x-4">
            <span>RITURAJ KULSHRESTH // AI PLATFORMS ENGINEER © 2026</span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline text-cyan-500/35">SPDX-License-Identifier: Apache-2.0</span>
          </div>

          {/* Hex Mouse Coordinates tracker details! */}
          <div className="flex items-center gap-4 self-end md:self-auto">
            <div className="flex items-center space-x-1 text-[9px]">
              <Crosshair className="w-3.5 h-3.5 text-fuchsia-500 shrink-0 animate-spin" style={{ animationDuration: "12s" }} />
              <span>SENSOR_COORDINATES:</span>
              <span className="text-cyan-300 font-bold shrink-0">
                X: 0x{cursorPos.x.toString(16).toUpperCase().padStart(4, "0")}
              </span>
              <span>/</span>
              <span className="text-cyan-300 font-bold shrink-0">
                Y: 0x{cursorPos.y.toString(16).toUpperCase().padStart(4, "0")}
              </span>
            </div>
            
            <div className="px-1.5 py-0.5 border border-cyan-500/20 rounded bg-cyan-950/20 font-bold text-[8px] text-fuchsia-400 animate-pulse">
              PORTAL: COLD_INGRESS
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <OverdriveProvider>
      <AppShell />
    </OverdriveProvider>
  );
}
