/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cold-boot overlay shown before the main AEGIS bridge is revealed.
 * Gate phase unlocks Web Audio on user gesture; sequencing phase animates
 * diegetic subsystem checks then calls onComplete to dismiss the overlay.
 */

import { useEffect, useRef, useState } from "react";
import { synth } from "../audio";
import { useOverdrive } from "../contexts/OverdriveContext";
import { Power, CheckCircle2, Loader2, Flame, TriangleAlert, MonitorSmartphone } from "lucide-react";

interface BootSequenceProps {
  onComplete: () => void;
  isMobile?: boolean;
}

type Phase = "gate" | "sequencing";

interface BootStep {
  label: string;
  detail: string;
  duration: number;
}

// Steps map to systems that are actually present in this portfolio so the boot feels diegetic.
const BOOT_STEPS: BootStep[] = [
  { label: "ESTABLISHING SECURE LINK :: AEGIS CORE", detail: "negotiating quantum handshake // SEC_AEGIS_01", duration: 480 },
  { label: "CALIBRATING WEBGL FRAGMENT SHADER", detail: "compiling 4x4 bayer matrix // dither chunks 2x2", duration: 560 },
  { label: "MOUNTING PROCEDURAL AUDIO OSCILLATORS", detail: "warming dual-oscillator sawtooth/triangle drone", duration: 380 },
  { label: "SYNCING TELEMETRY STREAM", detail: "ring buffer 30 lines // category SYSTEM/QUANTUM/NETWORK", duration: 320 },
  { label: "INDEXING COGNITIVE FILES // BENTO PROJECTS", detail: "RustyBun, X86 Architecture OS, Bio-Therm CNN", duration: 480 },
  { label: "INITIALIZING CAREER TIMELINE DISPATCH", detail: "WBD ACME / Knowledge Hub / Daisy registers loaded", duration: 360 },
  { label: "ARMING AEGIS COGNITION CHANNEL", detail: "offline semantic mapping registers online", duration: 420 },
  { label: "SYSTEM ONLINE :: HANDOFF TO BRIDGE", detail: "all subsystems nominal", duration: 320 },
];

const TOTAL_BOOT_MS = BOOT_STEPS.reduce((acc, s) => acc + s.duration, 0);

export default function BootSequence({ onComplete, isMobile = false }: BootSequenceProps) {
  const { setOverdrive } = useOverdrive();
  const [phase, setPhase] = useState<Phase>("gate");
  const [audioArmed, setAudioArmed] = useState(true);
  const [overdriveBoot, setOverdriveBoot] = useState(false);

  // Sequencing state
  const [activeStep, setActiveStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  // Random hex chatter that scrolls in the side panel for atmosphere.
  const [chatter, setChatter] = useState<string[]>([]);

  // Refs so the async sequence loop can read latest values and cancel cleanly.
  const cancelledRef = useRef(false);
  const audioArmedRef = useRef(audioArmed);
  useEffect(() => {
    audioArmedRef.current = audioArmed;
  }, [audioArmed]);

  // Arm audio synchronously inside the user-gesture handler, then start the
  // animation loop. `overdrive` redlines the reactor on entry: global overdrive
  // is engaged so the bridge comes up fast + urgent.
  const beginBoot = (withAudio: boolean, overdrive = false) => {
    if (withAudio) {
      const ok = synth.enable();
      if (ok) {
        synth.playStartup();
        setAudioArmed(true);
      } else {
        setAudioArmed(false);
      }
    } else {
      setAudioArmed(false);
    }
    if (overdrive) {
      setOverdriveBoot(true);
      setOverdrive(true);
      synth.setOverdrive(true);
      synth.playOverclock(1000);
    }
    setPhase("sequencing");
  };

  // Lock page scroll for the whole boot overlay so the bridge behind it can't
  // scroll underneath the gate / sequence.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // ENTER / SPACE confirms the gate phase
  useEffect(() => {
    if (phase !== "gate") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        beginBoot(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // Drive the boot sequence animation
  useEffect(() => {
    if (phase !== "sequencing") return;
    cancelledRef.current = false;

    let totalElapsed = 0;
    let chatterInterval: number | null = null;

    // Spawn hex chatter periodically for atmosphere
    chatterInterval = window.setInterval(() => {
      const hex = Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")
      ).join(" ");
      const tag = ["MEM", "REG", "BUS", "GPU", "NET", "AUD"][Math.floor(Math.random() * 6)];
      setChatter((prev) => {
        const next = [...prev, `0x${tag}>> ${hex}`];
        if (next.length > 14) next.shift();
        return next;
      });
    }, 110);

    (async () => {
      for (let i = 0; i < BOOT_STEPS.length; i++) {
        if (cancelledRef.current) return;
        setActiveStep(i);
        setStepProgress(0);

        const step = BOOT_STEPS[i];
        const start = performance.now();

        await new Promise<void>((resolve) => {
          const tick = () => {
            if (cancelledRef.current) return resolve();
            const elapsed = performance.now() - start;
            const pct = Math.min(elapsed / step.duration, 1);
            setStepProgress(pct);
            setOverallProgress(Math.min((totalElapsed + elapsed) / TOTAL_BOOT_MS, 1));
            if (pct >= 1) resolve();
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });

        if (cancelledRef.current) return;
        totalElapsed += step.duration;
        setCompletedSteps((prev) => [...prev, i]);
        if (audioArmedRef.current) {
          // Pitch ascends with each step for a satisfying upward sweep
          synth.playClick(560 + i * 90, 0.035);
        }
      }

      if (cancelledRef.current) return;
      setOverallProgress(1);

      // Final beat: short hold then a slightly louder "online" tone, then hand off.
      await new Promise<void>((resolve) => setTimeout(resolve, 280));
      if (cancelledRef.current) return;
      if (audioArmedRef.current) {
        synth.playClick(1320, 0.08);
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 360));
      if (cancelledRef.current) return;

      onComplete();
    })();

    return () => {
      cancelledRef.current = true;
      if (chatterInterval !== null) window.clearInterval(chatterInterval);
    };
  }, [phase, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05050b]/95 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Boot system"
    >
      <div className="absolute inset-0 border border-cyan-500/20 m-3 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500/10 pointer-events-none animate-scan-beam" />

      {phase === "gate" ? <GateView onBoot={beginBoot} isMobile={isMobile} /> : (
        <SequenceView
          activeStep={activeStep}
          stepProgress={stepProgress}
          completedSteps={completedSteps}
          overallProgress={overallProgress}
          chatter={chatter}
          audioArmed={audioArmed}
          overdriveBoot={overdriveBoot}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

function GateView({ onBoot, isMobile = false }: { onBoot: (withAudio: boolean, overdrive?: boolean) => void; isMobile?: boolean }) {
  return (
    <div className="relative max-w-xl w-[92%] text-center p-8 border border-cyan-500/30 bg-[#05050b]/80 rounded shadow-[0_0_40px_rgba(0,243,255,0.08)]">
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

      <div className="font-mono text-[9px] tracking-[0.35em] text-[#00f3ff]/55 uppercase mb-3">
        AEGIS // COLD BOOT SEQUENCE
      </div>
      <h1 className="glitch-text text-2xl md:text-3xl text-[#00f3ff] uppercase tracking-[0.18em] mb-2">
        RITURAJ KULSHRESTH
      </h1>
      <p className="font-mono text-[10px] text-fuchsia-400/90 uppercase tracking-widest mb-6">
        Quantum Terminal Portfolio &bull; SDE2 // AI Platforms // Warner Bros. Discovery
      </p>

      {isMobile && (
        <div className="mb-6 flex items-start gap-2.5 rounded border border-amber-500/40 bg-amber-950/25 px-3.5 py-3 text-left">
          <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="font-mono text-[10px] leading-relaxed text-amber-200/90 tracking-wide">
            <span className="font-black text-amber-300 uppercase tracking-widest">Mobile Lite Build.</span>{" "}
            The full AEGIS terminal is built for desktop / PC. On phones the WebGL shader core is disabled for stability, so you are running a lighter version. For the complete experience, open this on a computer.
          </p>
        </div>
      )}

      <p className="font-mono text-[11px] text-cyan-300/85 leading-relaxed mb-8 max-w-md mx-auto">
        The system is locked behind a single handshake. Press to initiate the boot sequence; doing so unlocks the audio core and hands you the bridge.
      </p>

      <button
        onClick={() => onBoot(true)}
        autoFocus
        className="group relative inline-flex items-center gap-3 px-8 py-4 border-2 border-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50 transition-all duration-300 cursor-pointer font-mono text-sm font-black uppercase tracking-[0.18em] text-cyan-200 hover:text-white shadow-[0_0_18px_rgba(0,243,255,0.18)] hover:shadow-[0_0_28px_rgba(0,243,255,0.35)]"
      >
        <Power className="w-5 h-5 text-fuchsia-400 group-hover:text-fuchsia-300 animate-pulse" />
        <span>&gt;&gt; PRESS TO BOOT SYSTEM &lt;&lt;</span>
      </button>

      {/* Dangerous opt-in: redlines the reactor on entry. Styled as a hazard
          control so it clearly reads as the risky path, not the default. */}
      <button
        onClick={() => onBoot(true, true)}
        className="group relative mx-auto mt-5 flex items-center justify-center gap-2.5 px-6 py-3 border-2 border-fuchsia-500 bg-fuchsia-950/30 hover:bg-fuchsia-900/45 transition-all duration-300 cursor-pointer font-mono text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-300 hover:text-fuchsia-100 shadow-[0_0_16px_rgba(255,0,255,0.3)] hover:shadow-[0_0_30px_rgba(255,0,255,0.55)] animate-pulse overflow-hidden"
      >
        {/* Hazard stripes wash */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.14] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,0,255,0.9) 0 8px, transparent 8px 18px)",
          }}
        />
        <Flame className="w-4 h-4 text-fuchsia-300 group-hover:text-white shrink-0 relative" />
        <span className="relative">&gt;&gt; COLD BOOT IN OVERDRIVE &lt;&lt;</span>
        <TriangleAlert className="w-4 h-4 text-fuchsia-300 group-hover:text-white shrink-0 relative" />
      </button>
      <p className="font-mono text-[8.5px] text-fuchsia-400/70 uppercase tracking-[0.18em] mt-2 flex items-center justify-center gap-1.5">
        <TriangleAlert className="w-2.5 h-2.5 shrink-0" />
        WARNING: redlines on entry // louder, faster, unstable
      </p>

      <button
        onClick={() => onBoot(false)}
        className="block mx-auto mt-5 font-mono text-[10px] text-cyan-500/55 hover:text-cyan-300 uppercase tracking-widest underline-offset-4 hover:underline cursor-pointer transition-colors"
      >
        [ ENTER WITHOUT SOUND ]
      </button>

      <div className="mt-6 pt-4 border-t border-cyan-500/15 font-mono text-[9px] text-cyan-500/40 uppercase tracking-widest flex items-center justify-center gap-2">
        <span className="px-1.5 py-0.5 border border-cyan-500/25 rounded bg-cyan-950/40 text-[#00f3ff]/70">ENTER</span>
        <span>or</span>
        <span className="px-1.5 py-0.5 border border-cyan-500/25 rounded bg-cyan-950/40 text-[#00f3ff]/70">SPACE</span>
        <span>to confirm boot</span>
      </div>
    </div>
  );
}

function SequenceView({
  activeStep,
  stepProgress,
  completedSteps,
  overallProgress,
  chatter,
  audioArmed,
  overdriveBoot,
  isMobile = false,
}: {
  activeStep: number;
  stepProgress: number;
  completedSteps: number[];
  overallProgress: number;
  chatter: string[];
  audioArmed: boolean;
  overdriveBoot: boolean;
  isMobile?: boolean;
}) {
  return (
    <div className="relative w-[94%] max-w-3xl border border-cyan-500/35 bg-[#05050b]/85 rounded shadow-[0_0_40px_rgba(0,243,255,0.12)] overflow-hidden">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

      {/* Title bar */}
      <div className="bg-cyan-950/30 border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-pulse shadow-[0_0_6px_#00f3ff]" />
          <span className="font-mono text-[10px] font-black tracking-[0.25em] text-[#00f3ff] uppercase">
            AEGIS // BOOT SEQUENCE ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          {overdriveBoot && (
            <span className="font-mono text-[9px] text-fuchsia-300 uppercase tracking-widest font-black flex items-center gap-1 px-1.5 py-0.5 border border-fuchsia-500/60 bg-fuchsia-950/40 rounded animate-pulse">
              <Flame className="w-2.5 h-2.5 shrink-0" />
              OVERDRIVE
            </span>
          )}
          {isMobile && (
            <span className="font-mono text-[9px] text-amber-300 uppercase tracking-widest font-black flex items-center gap-1 px-1.5 py-0.5 border border-amber-500/60 bg-amber-950/40 rounded">
              <MonitorSmartphone className="w-2.5 h-2.5 shrink-0" />
              MOBILE LITE
            </span>
          )}
          <span className="font-mono text-[9px] text-fuchsia-400/80 uppercase tracking-widest animate-pulse">
            {audioArmed ? "AUDIO_CORE ARMED" : "AUDIO_CORE BYPASSED"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Left/main: step list */}
        <div className="md:col-span-2 p-4 md:p-5 border-b md:border-b-0 md:border-r border-cyan-500/15 min-h-[340px]">
          <ul className="space-y-1.5">
            {BOOT_STEPS.map((step, i) => {
              const isDone = completedSteps.includes(i);
              const isActive = activeStep === i && !isDone;
              const isPending = i > activeStep;
              return (
                <li
                  key={i}
                  className={`font-mono text-[11px] leading-relaxed transition-opacity duration-300 ${
                    isPending ? "opacity-25" : "opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 w-4 text-center mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00f3ff] inline-block" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 text-fuchsia-400 inline-block animate-spin" />
                      ) : (
                        <span className="text-cyan-500/40">::</span>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span
                          className={`tracking-wider ${
                            isDone ? "text-cyan-200/90" : isActive ? "text-[#00f3ff]" : "text-cyan-500/60"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span
                          className={`text-[9px] font-bold shrink-0 ${
                            isDone
                              ? "text-emerald-400"
                              : isActive
                              ? "text-fuchsia-400 animate-pulse"
                              : "text-cyan-500/30"
                          }`}
                        >
                          {isDone ? "[OK]" : isActive ? `[${Math.round(stepProgress * 100)}%]` : "[PEND]"}
                        </span>
                      </div>
                      <div className="text-[9px] text-cyan-500/55 italic mt-0.5">{step.detail}</div>
                      {(isActive || isDone) && (
                        <div className="mt-1 h-[3px] bg-cyan-950/60 border border-cyan-500/15 rounded overflow-hidden">
                          <div
                            className={`h-full transition-[width] duration-150 ease-linear ${
                              isDone
                                ? "bg-[#00f3ff] shadow-[0_0_6px_rgba(0,243,255,0.7)]"
                                : "bg-fuchsia-400 shadow-[0_0_6px_rgba(255,0,255,0.5)]"
                            }`}
                            style={{ width: `${isDone ? 100 : stepProgress * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: hex chatter side panel */}
        <div className="p-4 md:p-5 bg-[#05050b]/60">
          <div className="font-mono text-[9px] uppercase tracking-widest text-[#00f3ff]/55 mb-2 flex items-center justify-between">
            <span>RAW MEM TRACE</span>
            <span className="text-fuchsia-400/70 animate-pulse">LIVE</span>
          </div>
          <div className="font-mono text-[9px] text-cyan-300/65 leading-snug space-y-0.5 h-[300px] overflow-hidden">
            {chatter.map((line, idx) => (
              <div
                key={idx}
                className={`truncate ${idx === chatter.length - 1 ? "text-[#00f3ff]" : ""}`}
              >
                {line}
              </div>
            ))}
            {chatter.length === 0 && (
              <div className="text-cyan-500/40 italic">awaiting bus chatter...</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: overall progress */}
      <div className="px-4 md:px-5 py-3 border-t border-cyan-500/20 bg-cyan-950/15">
        <div className="flex items-baseline justify-between font-mono text-[10px] mb-1.5">
          <span className="text-[#00f3ff]/70 uppercase tracking-widest">MASTER BOOT PROGRESS</span>
          <span className="text-fuchsia-400 font-bold">{Math.round(overallProgress * 100)}%</span>
        </div>
        <div className="h-2 bg-cyan-950/60 border border-cyan-500/25 rounded overflow-hidden relative">
          <div
            className="h-full bg-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.7)] transition-[width] duration-150 ease-linear"
            style={{ width: `${overallProgress * 100}%` }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{
              left: `${overallProgress * 100}%`,
              transform: "translateX(-1px)",
              display: overallProgress >= 1 ? "none" : "block",
            }}
          />
        </div>
        <div className="mt-1.5 font-mono text-[8px] text-cyan-500/45 uppercase tracking-widest flex justify-between">
          <span>BUS: SECURE</span>
          <span className={isMobile ? "text-amber-400/70" : undefined}>
            {isMobile ? "SHADER: BYPASSED" : "SHADER: BAYER_4x4"}
          </span>
          <span>SYNTH: DUAL_OSC_LP</span>
          <span>STATE: HANDOFF_PENDING</span>
        </div>
      </div>
    </div>
  );
}
