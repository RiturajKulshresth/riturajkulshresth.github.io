/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { synth } from "../audio";
import { useOverdrive } from "../contexts/OverdriveContext";
import { Atom, Gauge } from "lucide-react";

interface EntropyMeterProps {
  colorPreset?: "GREEN" | "AMBER" | "COSMIC";
}

const THEME_MAP = {
  GREEN: {
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
    corners: "border-emerald-400",
    arcDim: "rgba(16, 185, 129, 0.18)",
    arcLive: "rgba(16, 185, 129, 0.85)",
    needle: "rgba(245, 158, 11, 0.95)",
    danger: "rgba(239, 68, 68, 0.85)",
    safe: "rgba(16, 185, 129, 0.85)",
    grid: "rgba(16, 185, 129, 0.06)",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.06)]",
    readout: "text-emerald-300"
  },
  AMBER: {
    accent: "text-amber-500",
    border: "border-amber-500/20",
    corners: "border-amber-500",
    arcDim: "rgba(245, 158, 11, 0.18)",
    arcLive: "rgba(245, 158, 11, 0.85)",
    needle: "rgba(0, 243, 255, 0.95)",
    danger: "rgba(239, 68, 68, 0.85)",
    safe: "rgba(16, 185, 129, 0.85)",
    grid: "rgba(245, 158, 11, 0.06)",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.06)]",
    readout: "text-amber-300/90"
  },
  COSMIC: {
    accent: "text-[#00f3ff]",
    border: "border-cyan-500/20",
    corners: "border-cyan-400",
    arcDim: "rgba(0, 243, 255, 0.18)",
    arcLive: "rgba(0, 243, 255, 0.85)",
    needle: "rgba(255, 0, 255, 0.95)",
    danger: "rgba(239, 68, 68, 0.85)",
    safe: "rgba(16, 185, 129, 0.85)",
    grid: "rgba(0, 243, 255, 0.06)",
    glow: "shadow-[0_0_12px_rgba(0,243,255,0.06)]",
    readout: "text-cyan-300"
  }
};

interface DialDef {
  key: "ENTROPY" | "STABILITY" | "FLUX";
  label: string;
  unit: string;
  centerBase: number;
  amplitude: number;
  freq: number;
  phase: number;
  inverted?: boolean;
}

// Three dials, two are shown at a time depending on the active mode.
const DIALS: Record<"PRIMARY" | "FLUX", DialDef[]> = {
  PRIMARY: [
    { key: "ENTROPY", label: "ENTROPY", unit: "%", centerBase: 52, amplitude: 28, freq: 0.012, phase: 0.0 },
    { key: "STABILITY", label: "STABILITY", unit: "%", centerBase: 78, amplitude: 14, freq: 0.008, phase: 1.4, inverted: true }
  ],
  FLUX: [
    { key: "FLUX", label: "FLUX_VEC", unit: "Vm", centerBase: 64, amplitude: 22, freq: 0.018, phase: 0.6 },
    { key: "STABILITY", label: "DAMP", unit: "%", centerBase: 64, amplitude: 22, freq: 0.022, phase: 2.1 }
  ]
};

const FALLBACK_HEIGHT = 180;
const HISTORY_LEN = 32;

export default function EntropyMeter({ colorPreset = "COSMIC" }: EntropyMeterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tickRef = useRef(0);

  // Per-dial rolling history. Two slots (left + right dial) regardless of
  // mode so the buffer can be reused when the user flips modes.
  const historyRef = useRef<number[][]>([[], []]);
  // Per-dial recent peak (decays slowly) used to pin a marker on the arc.
  const peakRef = useRef<number[]>([0, 0]);

  const [mode, setMode] = useState<"PRIMARY" | "FLUX">("PRIMARY");
  const [readouts, setReadouts] = useState<number[]>([0, 0]);

  // Global overdrive accelerates the dial dynamics + hot accent via live ref.
  const { speedMul, overdrive } = useOverdrive();
  const speedMulRef = useRef(speedMul);
  useEffect(() => { speedMulRef.current = speedMul; }, [speedMul]);

  const theme = THEME_MAP[colorPreset];

  // Reset history when the dial set changes so old samples from the other
  // mode don't bleed into the new dials' histograms or peak markers.
  useEffect(() => {
    historyRef.current = [[], []];
    peakRef.current = [0, 0];
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let frameCount = 0;
    let resizeObs: ResizeObserver | null = null;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const targetH = rect.height || FALLBACK_HEIGHT;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(targetH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);
    resize();

    const drawDial = (
      d: DialDef,
      cx: number,
      cy: number,
      radius: number,
      label: string,
      slot: number
    ) => {
      // Semi-circle from -PI (left) to 0 (right) for the standard gauge feel.
      const startAng = Math.PI;
      const endAng = 2 * Math.PI;

      // Outer bezel
      ctx.lineWidth = 1;
      ctx.strokeStyle = theme.grid;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 4, startAng, endAng);
      ctx.stroke();

      // Faint outer dashed ring for a busier instrument feel.
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = "rgba(0, 243, 255, 0.12)";
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 9, startAng, endAng);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dim arc baseline
      ctx.strokeStyle = theme.arcDim;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAng, endAng);
      ctx.stroke();

      // Danger zone arc overlay (>80% of the dial range). Drawn underneath
      // the live arc as a faint red wash so the user sees the boundary even
      // when the dial is in the green.
      const dangerStart = startAng + (endAng - startAng) * 0.8;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, dangerStart, endAng);
      ctx.stroke();

      // Compute value 0..1
      const raw = d.centerBase + Math.sin(tickRef.current * d.freq + d.phase) * d.amplitude
        + (Math.random() - 0.5) * 1.2;
      const clamped = Math.min(100, Math.max(0, raw));
      const norm = clamped / 100;
      const displayNorm = d.inverted ? 1 - norm : norm;

      // Push into the rolling history and decay peak.
      const hist = historyRef.current[slot];
      hist.push(displayNorm);
      if (hist.length > HISTORY_LEN) hist.shift();
      // Peak with slow decay so it lingers a bit before tracking down.
      const prevPeak = peakRef.current[slot];
      peakRef.current[slot] = Math.max(displayNorm, prevPeak * 0.997);

      // Live arc fills from left -> right based on value
      const liveEnd = startAng + (endAng - startAng) * displayNorm;
      // Color the live arc based on how close it is to the danger zone (>80%).
      const dangerous = displayNorm > 0.82;
      ctx.strokeStyle = dangerous ? theme.danger : theme.arcLive;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAng, liveEnd);
      ctx.stroke();

      // Peak marker triangle sitting on the arc.
      const peakAng = startAng + (endAng - startAng) * peakRef.current[slot];
      const pxOuter = cx + Math.cos(peakAng) * (radius + 8);
      const pyOuter = cy + Math.sin(peakAng) * (radius + 8);
      const pxInner = cx + Math.cos(peakAng) * (radius + 2);
      const pyInner = cy + Math.sin(peakAng) * (radius + 2);
      ctx.fillStyle = "rgba(245, 158, 11, 0.95)";
      ctx.beginPath();
      ctx.moveTo(pxInner, pyInner);
      ctx.lineTo(pxOuter - Math.sin(peakAng) * 3, pyOuter + Math.cos(peakAng) * 3);
      ctx.lineTo(pxOuter + Math.sin(peakAng) * 3, pyOuter - Math.cos(peakAng) * 3);
      ctx.closePath();
      ctx.fill();

      // Tick marks + value labels (0, 25, 50, 75, 100).
      ctx.strokeStyle = "rgba(0, 243, 255, 0.3)";
      ctx.fillStyle = "rgba(0, 243, 255, 0.45)";
      ctx.font = "6.5px 'JetBrains Mono', monospace";
      ctx.lineWidth = 1;
      const tickValues = [0, 25, 50, 75, 100];
      tickValues.forEach((tv, i) => {
        const a = startAng + ((endAng - startAng) * i) / (tickValues.length - 1);
        const x1 = cx + Math.cos(a) * (radius - 9);
        const y1 = cy + Math.sin(a) * (radius - 9);
        const x2 = cx + Math.cos(a) * (radius + 2);
        const y2 = cy + Math.sin(a) * (radius + 2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Value label sits outside the arc, just above the tick.
        const tx = cx + Math.cos(a) * (radius + 12);
        const ty = cy + Math.sin(a) * (radius + 12);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${tv}`, tx, ty - 1);
      });

      // Needle
      const nx = cx + Math.cos(liveEnd) * (radius - 4);
      const ny = cy + Math.sin(liveEnd) * (radius - 4);
      ctx.strokeStyle = theme.needle;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 4;
      ctx.shadowColor = theme.needle;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Needle hub
      ctx.fillStyle = "rgba(255, 0, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Label (well above the bezel + tick labels).
      ctx.fillStyle = "rgba(0, 243, 255, 0.55)";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(label, cx, cy - radius - 26);

      // Digital readout (below hub)
      ctx.fillStyle = dangerous ? "rgba(239, 68, 68, 0.95)" : "rgba(0, 243, 255, 0.95)";
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.fillText(`${clamped.toFixed(1)}${d.unit}`, cx, cy + 16);

      // Status pill under the readout.
      const statusLabel = dangerous ? "CRIT" : displayNorm > 0.6 ? "WARN" : "NOM";
      const pillW = 32;
      const pillH = 9;
      const pillX = cx - pillW / 2;
      const pillY = cy + 22;
      ctx.fillStyle =
        dangerous ? "rgba(239, 68, 68, 0.9)" :
        displayNorm > 0.6 ? "rgba(245, 158, 11, 0.9)" :
        "rgba(16, 185, 129, 0.9)";
      ctx.fillRect(pillX, pillY, pillW, pillH);
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.font = "bold 6.5px 'JetBrains Mono', monospace";
      ctx.textBaseline = "middle";
      ctx.fillText(statusLabel, cx, pillY + pillH / 2);

      // Compact history strip beneath the pill.
      const stripW = radius * 2 + 16;
      const stripH = 10;
      const stripX = cx - stripW / 2;
      const stripY = pillY + pillH + 4;
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(stripX, stripY, stripW, stripH);
      ctx.strokeStyle = theme.grid;
      ctx.strokeRect(stripX, stripY, stripW, stripH);
      if (hist.length > 1) {
        const barW = stripW / HISTORY_LEN;
        hist.forEach((hv, hi) => {
          const bh = Math.max(1, hv * (stripH - 2));
          const bx = stripX + hi * barW;
          const by = stripY + stripH - 1 - bh;
          const bar =
            hv > 0.82 ? "rgba(239, 68, 68, 0.85)" :
            hv > 0.6 ? "rgba(245, 158, 11, 0.85)" :
            theme.arcLive;
          ctx.fillStyle = bar;
          ctx.fillRect(bx, by, Math.max(1, barW - 0.5), bh);
        });
      }

      return clamped;
    };

    const loop = () => {
      tickRef.current += speedMulRef.current;

      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height || FALLBACK_HEIGHT;
      ctx.clearRect(0, 0, W, H);

      // Faint background hatching so the canvas isn't pure black.
      ctx.fillStyle = "rgba(0, 243, 255, 0.012)";
      for (let yy = 0; yy < H; yy += 4) {
        for (let xx = (yy % 8 === 0 ? 0 : 4); xx < W; xx += 8) {
          ctx.fillRect(xx, yy, 1, 1);
        }
      }

      const dialSet = DIALS[mode];
      const radius = Math.min(46, Math.floor(H * 0.28));
      // Push the dial centre a little higher so the readout, status pill,
      // and history strip below have breathing room.
      const cy = Math.floor(H * 0.46);
      const colW = W / dialSet.length;

      const liveReadouts: number[] = [];
      dialSet.forEach((d, i) => {
        const cx = colW * i + colW / 2;
        liveReadouts.push(drawDial(d, cx, cy, radius, d.label, i));
      });

      // Inter-dial delta indicator: shows the absolute gap between the two
      // dials right in the gap between them.
      if (dialSet.length === 2) {
        const delta = Math.abs(liveReadouts[0] - liveReadouts[1]);
        const midX = W / 2;
        const midY = cy;
        ctx.fillStyle = "rgba(0, 243, 255, 0.5)";
        ctx.font = "6.5px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Δ DELTA", midX, midY - 10);
        ctx.fillStyle = delta > 25 ? "rgba(245, 158, 11, 0.95)" : "rgba(0, 243, 255, 0.85)";
        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        ctx.fillText(delta.toFixed(1), midX, midY + 4);
        // Tiny separator line
        ctx.strokeStyle = "rgba(0, 243, 255, 0.15)";
        ctx.beginPath();
        ctx.moveTo(midX, midY - 28);
        ctx.lineTo(midX, midY + 28);
        ctx.stroke();
      }

      // Sample readouts less often so React doesn't re-render every frame.
      frameCount += 1;
      if (frameCount % 12 === 0) {
        setReadouts(liveReadouts);
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      resizeObs?.disconnect();
    };
  }, [colorPreset, mode]);

  const swap = (next: typeof mode) => {
    synth.playClick(950, 0.04);
    setMode(next);
  };

  const dialSet = DIALS[mode];

  return (
    <div
      ref={containerRef}
      className={`border ${overdrive ? "border-fuchsia-500/40 shadow-[0_0_16px_rgba(255,0,255,0.12)]" : `${theme.border} ${theme.glow}`} p-3.5 rounded relative overflow-hidden bg-[#05050b]/88 flex flex-col transition-colors duration-300`}
    >
      {/* Corner Brackets */}
      <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t border-l ${theme.corners}`} />
      <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t border-r ${theme.corners}`} />
      <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l ${theme.corners}`} />
      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r ${theme.corners}`} />

      {/* Title row */}
      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 mb-2 shrink-0">
        <div className="flex items-center space-x-1.5">
          <Atom className={`w-3.5 h-3.5 ${theme.accent} animate-pulse shrink-0`} />
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#00f3ff]">
            ENTROPY_FIELD // DUAL_DIAL
          </h3>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[8.5px]">
          {(["PRIMARY", "FLUX"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => swap(opt)}
              className={`px-1.5 py-0.5 rounded border transition-colors ${
                mode === opt
                  ? "bg-[#00f3ff]/20 border-[#00f3ff]/50 text-[#00f3ff]"
                  : "border-cyan-500/15 text-cyan-500/40 hover:text-cyan-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Dial canvas */}
      <div className="relative border border-cyan-500/5 bg-black/35 rounded overflow-hidden" style={{ height: `${FALLBACK_HEIGHT}px` }}>
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute top-1 left-2 font-mono text-[7px] text-fuchsia-400/55 uppercase tracking-widest animate-pulse">
          [{mode === "PRIMARY" ? "SUBSPACE_PRIMARY" : "FLUX_VECTOR_LOCK"}]
        </div>
      </div>

      {/* Bottom readouts: dial value, recent peak, and a status pill driven
          by the same thresholds the canvas uses. */}
      <div className="mt-2 grid grid-cols-2 gap-2 shrink-0">
        {dialSet.map((d, i) => {
          const v = readouts[i] ?? d.centerBase;
          const displayNorm = (d.inverted ? 1 - v / 100 : v / 100);
          const peak = peakRef.current[i] ?? 0;
          const peakPct = (peak * 100).toFixed(0);
          const status = displayNorm > 0.82 ? "CRIT" : displayNorm > 0.6 ? "WARN" : "NOM";
          const pillColor =
            status === "CRIT" ? "bg-red-500/80 text-black" :
            status === "WARN" ? "bg-amber-500/80 text-black" :
            "bg-emerald-500/80 text-black";
          return (
            <div
              key={d.key + i}
              className="px-1.5 py-1 border border-cyan-500/10 rounded bg-neutral-950/55 flex flex-col gap-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[7.5px] text-cyan-500/45 uppercase tracking-wider flex items-center gap-1">
                  <Gauge className="w-2 h-2 text-fuchsia-500/70" />
                  {d.label}
                </span>
                <span className={`font-mono text-[6.5px] tracking-wider font-bold px-1 rounded ${pillColor}`}>
                  {status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className={`font-mono text-[10px] font-bold ${theme.readout}`}>
                  {v.toFixed(1)} <span className="text-[7px] text-cyan-500/40 font-normal">{d.unit}</span>
                </span>
                <span className="font-mono text-[7px] text-fuchsia-400/70">
                  peak {peakPct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
