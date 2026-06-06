/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Propagation waveband HUD: Lorenz attractor 3D trace or stacked DSP sine harmonics.
 * ATTRACTOR mode integrates and projects a pre-warmed chaos path; SIGNAL mode
 * synthesizes oscilloscope waves plus an 8-bin peak-hold spectrum strip.
 */

import React, { useEffect, useRef, useState } from "react";
import { synth } from "../audio";
import { useOverdrive } from "../contexts/OverdriveContext";
import { Activity, Radio, Waves } from "lucide-react";

interface SpectralAnalyzerProps {
  colorPreset?: "GREEN" | "AMBER" | "COSMIC";
}

const THEME_MAP = {
  GREEN: {
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
    corners: "border-emerald-400",
    wavePrimary: "rgba(16, 185, 129, 0.65)",
    waveSecondary: "rgba(16, 185, 129, 0.25)",
    gridColor: "rgba(16, 185, 129, 0.05)",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.06)]"
  },
  AMBER: {
    accent: "text-amber-500",
    border: "border-amber-500/20",
    corners: "border-amber-500",
    wavePrimary: "rgba(245, 158, 11, 0.65)",
    waveSecondary: "rgba(245, 158, 11, 0.25)",
    gridColor: "rgba(245, 158, 11, 0.05)",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.06)]"
  },
  COSMIC: {
    accent: "text-[#00f3ff]",
    border: "border-cyan-500/20",
    corners: "border-cyan-400",
    wavePrimary: "rgba(0, 243, 255, 0.65)",
    waveSecondary: "rgba(0, 243, 255, 0.25)",
    gridColor: "rgba(0, 243, 255, 0.05)",
    glow: "shadow-[0_0_12px_rgba(0,243,255,0.06)]"
  }
};

export default function SpectralAnalyzer({ colorPreset = "COSMIC" }: SpectralAnalyzerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [waveMode, setWaveMode] = useState<"ATTRACTOR" | "SIGNAL">("ATTRACTOR");
  const [isHovered, setIsHovered] = useState(false);
  const [hzGauge, setHzGauge] = useState(25.4);

  // Global overdrive drives the trace speed + hot accent via live refs.
  const { speedMul, overdrive } = useOverdrive();
  const speedMulRef = useRef(speedMul);
  const overdriveRef = useRef(overdrive);
  useEffect(() => { speedMulRef.current = speedMul; }, [speedMul]);
  useEffect(() => { overdriveRef.current = overdrive; }, [overdrive]);

  // High performance mouse tracking ref. Linear interpolation (lerp) produces flawless fluid updates.
  const mouseRef = useRef({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
    smoothMult: 1.0,
    isHovered: false
  });

  const theme = THEME_MAP[colorPreset] || THEME_MAP.COSMIC;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let ticks = 0;

    // Lorenz Attractor standard coordinates (chaos equation)
    let lx = 0.1, ly = 0, lz = 0;
    const dt = 0.012;
    const sigma = 10;
    const rho = 28;
    const beta = 8/3;
    const points: { x: number; y: number; z: number }[] = [];

    // Pre-populate attractor path points to trace quickly
    for (let i = 0; i < 280; i++) {
      const dx = sigma * (ly - lx) * dt;
      const dy = (lx * (rho - lz) - ly) * dt;
      const dz = (lx * ly - beta * lz) * dt;
      lx += dx;
      ly += dy;
      lz += dz;
      points.push({ x: lx, y: ly, z: lz });
    }

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 140; // Slightly taller so the new HUD strip fits.
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    let smoothHz = 25.4;

    // 8 frequency bands for the peak-hold spectrum at the bottom of the
    // SIGNAL view. Each bin tracks a live value and a slow-decaying peak.
    const bandCount = 8;
    const bandLive = new Array(bandCount).fill(0);
    const bandPeak = new Array(bandCount).fill(0);

    const render = () => {
      ticks += speedMulRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Noise/grid backdrop
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Smoothly update interpolated parameters in each visual call frame
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.08;
      m.y += (m.targetY - m.y) * 0.08;
      
      const targetMult = m.isHovered ? (m.x * 2.0 + 0.5) : 1.0;
      m.smoothMult += (targetMult - m.smoothMult) * 0.08;

      if (waveMode === "ATTRACTOR") {
        // Draw real-time 3D rotation of Lorenz Attractor
        const rotY = ticks * 0.015 + (m.smoothMult - 1.0) * 1.5;
        const rotX = ticks * 0.008 + (m.smoothMult - 1.0) * 0.8;

        // Build the projected polyline once so the tracer dot, gradient
        // pass, and live coord readout can all reuse it.
        const projected: { sx: number; sy: number; depth: number; x: number; y: number; z: number }[] = [];
        points.forEach((pt) => {
          let x1 = pt.x;
          let y1 = pt.y;
          let z1 = pt.z;

          let temp = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
          z1 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
          y1 = temp;

          temp = x1 * Math.cos(rotY) + z1 * Math.sin(rotY);
          z1 = -x1 * Math.sin(rotY) + z1 * Math.cos(rotY);
          x1 = temp;

          const scale = 1.9 + (z1 * 0.01);
          const sx = cx + x1 * scale * 1.8;
          const sy = cy + y1 * scale * 1.8;
          projected.push({ sx, sy, depth: z1, x: pt.x, y: pt.y, z: pt.z });
        });

        // Stroke the trajectory in three depth-banded passes so it reads as
        // a real 3D ribbon instead of a flat line.
        const sortedIdx = projected
          .map((p, i) => ({ i, depth: p.depth }))
          .sort((a, b) => a.depth - b.depth);
        const bands = [
          { color: theme.waveSecondary, lineWidth: 1.0, slice: 0.34 },
          { color: theme.wavePrimary, lineWidth: 1.3, slice: 0.66 },
          { color: theme.wavePrimary, lineWidth: 1.7, slice: 1.0 }
        ];
        let cursor = 0;
        bands.forEach((band) => {
          const stopAt = Math.floor(projected.length * band.slice);
          ctx.strokeStyle = band.color;
          ctx.lineWidth = band.lineWidth;
          ctx.beginPath();
          for (let k = cursor; k < stopAt; k++) {
            const idx = sortedIdx[k].i;
            const p = projected[idx];
            const prev = idx > 0 ? projected[idx - 1] : null;
            if (prev) {
              ctx.moveTo(prev.sx, prev.sy);
              ctx.lineTo(p.sx, p.sy);
            }
          }
          ctx.stroke();
          cursor = stopAt;
        });

        // Moving tracer dot sweeping along the trajectory.
        const tracerIdx = Math.floor((ticks * 0.5) % projected.length);
        const tracer = projected[tracerIdx];
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 0, 255, 0.85)";
        ctx.fillStyle = "rgba(255, 0, 255, 0.95)";
        ctx.beginPath();
        ctx.arc(tracer.sx, tracer.sy, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Pulsing center orb.
        ctx.fillStyle = "rgba(255, 0, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(cx, cy, 3 + Math.sin(ticks * 0.1) * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Live Lorenz coordinates HUD bottom-right.
        ctx.fillStyle = "rgba(0, 243, 255, 0.65)";
        ctx.font = "7px 'JetBrains Mono', monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(`X ${tracer.x.toFixed(2).padStart(6, " ")}`, w - 6, h - 26);
        ctx.fillText(`Y ${tracer.y.toFixed(2).padStart(6, " ")}`, w - 6, h - 17);
        ctx.fillText(`Z ${tracer.z.toFixed(2).padStart(6, " ")}`, w - 6, h - 8);

        // Tiny 3D axis indicator bottom-left.
        const ax = 18;
        const ay = h - 18;
        const drawAxis = (vx: number, vy: number, vz: number, color: string, label: string) => {
          let x1 = vx, y1 = vy, z1 = vz;
          let temp = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
          z1 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
          y1 = temp;
          temp = x1 * Math.cos(rotY) + z1 * Math.sin(rotY);
          x1 = temp;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + x1 * 12, ay + y1 * 12);
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.font = "bold 6.5px 'JetBrains Mono', monospace";
          ctx.textAlign = "left";
          ctx.fillText(label, ax + x1 * 14, ay + y1 * 14 + 3);
        };
        drawAxis(1, 0, 0, "rgba(255, 0, 255, 0.85)", "X");
        drawAxis(0, 1, 0, "rgba(0, 243, 255, 0.85)", "Y");
        drawAxis(0, 0, 1, "rgba(16, 185, 129, 0.85)", "Z");

      } else {
        // Render raw Fourier style soundwave oscillograph + a peak-hold
        // spectrum bar pinned to the bottom edge.
        const specH = 22;
        const waveH = h - specH;
        ctx.lineWidth = 1.2;

        // 3 stacked sine harmonics. We compute the primary wave path twice
        // so we can also paint a gradient underfill.
        const primary: { x: number; y: number }[] = [];
        for (let waveIndex = 0; waveIndex < 3; waveIndex++) {
          ctx.strokeStyle = waveIndex === 0 ? theme.wavePrimary : theme.waveSecondary;
          ctx.beginPath();

          const offsetPhase = ticks * 0.05 + waveIndex * 1.2;
          const amplitude = (waveH * 0.32) / (waveIndex + 1) * m.smoothMult;
          const baseY = waveH / 2;

          for (let x = 0; x < w; x += 3) {
            const factor = x / w;
            const sineWave = Math.sin(factor * Math.PI * 4.5 * (waveIndex + 1) + offsetPhase);
            const noiseFactor = Math.cos(factor * Math.PI * 18 + ticks * 0.1) * 3;
            const finalY = baseY + sineWave * amplitude + noiseFactor * (0.15 * (waveIndex + 1));

            if (x === 0) ctx.moveTo(x, finalY);
            else ctx.lineTo(x, finalY);
            if (waveIndex === 0) primary.push({ x, y: finalY });
          }
          ctx.stroke();
        }

        // Gradient underfill for the primary wave.
        const grad = ctx.createLinearGradient(0, 0, 0, waveH);
        grad.addColorStop(0, "rgba(0, 0, 0, 0)");
        grad.addColorStop(1, theme.waveSecondary);
        ctx.fillStyle = grad;
        ctx.beginPath();
        if (primary.length) {
          ctx.moveTo(primary[0].x, primary[0].y);
          for (let i = 1; i < primary.length; i++) ctx.lineTo(primary[i].x, primary[i].y);
          ctx.lineTo(primary[primary.length - 1].x, waveH);
          ctx.lineTo(0, waveH);
        }
        ctx.closePath();
        ctx.fill();

        // Peak-hold spectrum across 8 bins along the bottom.
        const bandSep = 2;
        const bandW = (w - 12 - bandSep * (bandCount - 1)) / bandCount;
        // Update each bin's live + peak based on a deterministic-ish synth so
        // the spectrum reads like the wave above it.
        for (let b = 0; b < bandCount; b++) {
          const f = (b + 1) / bandCount;
          const live =
            0.3 +
            Math.abs(Math.sin(ticks * 0.03 + b * 0.7) * 0.5 +
                     Math.cos(ticks * 0.02 + b * 0.3) * 0.3) *
              m.smoothMult * 0.9;
          const clamped = Math.min(1, live * (1.1 - f * 0.4));
          bandLive[b] = clamped;
          // Peak decays slowly.
          bandPeak[b] = Math.max(clamped, bandPeak[b] * 0.985);
        }

        const specY = waveH;
        // Background strip for the spectrum.
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, specY, w, specH);
        ctx.strokeStyle = theme.gridColor;
        ctx.strokeRect(0, specY, w, specH);

        for (let b = 0; b < bandCount; b++) {
          const bx = 6 + b * (bandW + bandSep);
          const liveH = bandLive[b] * (specH - 6);
          const peakY = specY + (specH - 4) - bandPeak[b] * (specH - 6);
          // Live bar (gradient cyan to fuchsia by height).
          const barGrad = ctx.createLinearGradient(0, specY, 0, specY + specH);
          barGrad.addColorStop(0, "rgba(255, 0, 255, 0.7)");
          barGrad.addColorStop(1, theme.wavePrimary);
          ctx.fillStyle = barGrad;
          ctx.fillRect(bx, specY + (specH - 4) - liveH, bandW, liveH);
          // Peak hold cap.
          ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
          ctx.fillRect(bx, peakY, bandW, 2);
        }

        // HUD labels.
        ctx.fillStyle = theme.wavePrimary;
        ctx.font = "6px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("ATTEN -24.0dB", 6, specY - 4);
        ctx.textAlign = "right";
        const peakAvg = bandPeak.reduce((s, v) => s + v, 0) / bandCount;
        ctx.fillText(`PEAK ${(peakAvg * 100).toFixed(0)}% / RMS ${(m.smoothMult * 100).toFixed(0)}%`, w - 6, specY - 4);
      }

      // Smooth hz calculation transitions
      const calculatedHz = 25 + Math.abs(Math.sin(ticks * 0.02) * 5) * m.smoothMult;
      smoothHz += (calculatedHz - smoothHz) * 0.1;
      setHzGauge(smoothHz);

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
      ro.disconnect();
    };
  }, [colorPreset, waveMode]); // only re-run when actual preset or mode changes

  const toggleInteractiveHover = (state: boolean) => {
    mouseRef.current.isHovered = state;
    setIsHovered(state);
    if (!state) {
      mouseRef.current.targetX = 0.5;
      mouseRef.current.targetY = 0.5;
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => toggleInteractiveHover(true)}
      onMouseLeave={() => toggleInteractiveHover(false)}
      className={`border ${overdrive ? "border-fuchsia-500/40 shadow-[0_0_16px_rgba(255,0,255,0.12)]" : `${theme.border} ${theme.glow}`} p-3 rounded relative overflow-hidden bg-[#05050b]/88 flex flex-col justify-between transition-colors duration-300`}
    >
      {/* Corner Brackets */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${theme.corners}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${theme.corners}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${theme.corners}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${theme.corners}`} />

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-1.5 mb-2">
        <div className="flex items-center space-x-1.5">
          <Waves className={`w-3.5 h-3.5 ${theme.accent} animate-pulse shrink-0`} />
          <h3 className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#00f3ff]">
            PROPAGATION_WAVEBAND_ANALYSIS
          </h3>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[8px]">
          <button
            onClick={() => { synth.playClick(1150, 0.04); setWaveMode("ATTRACTOR"); }}
            className={`px-1.5 py-0.5 rounded transition-all border outline-none cursor-pointer ${
              waveMode === "ATTRACTOR"
                ? "bg-[#00f3ff]/20 border-[#00f3ff]/50 text-[#00f3ff]"
                : "border-cyan-500/10 text-cyan-500/40 hover:text-cyan-200"
            }`}
          >
            LORENZ_3D
          </button>
          <button
            onClick={() => { synth.playClick(1150, 0.04); setWaveMode("SIGNAL"); }}
            className={`px-1.5 py-0.5 rounded transition-all border outline-none cursor-pointer ${
              waveMode === "SIGNAL"
                ? "bg-[#00f3ff]/20 border-[#00f3ff]/50 text-[#00f3ff]"
                : "border-cyan-500/10 text-cyan-500/40 hover:text-cyan-200"
            }`}
          >
            DSP_SINE
          </button>
        </div>
      </div>

      {/* Visual Canvas frame container */}
      <div className="relative border border-cyan-500/5 bg-black/40 rounded overflow-hidden">
        <canvas ref={canvasRef} className="w-full block" />
        <div className="absolute top-1 left-1.5 font-mono text-[7px] text-fuchsia-400/50 uppercase tracking-widest">
          GAUGE: {hzGauge.toFixed(2)} KHZ
        </div>
        <div className="absolute top-1 right-1.5 font-mono text-[7px] text-cyan-400/50 uppercase tracking-widest">
          MODE: {waveMode === "ATTRACTOR" ? "LORENZ_3D" : "DSP_SINE"}
        </div>
      </div>

      {/* Under deck: extra HUD lines so the strip below the canvas carries
          real information instead of static placeholders. */}
      <div className="mt-1.5 grid grid-cols-3 gap-2 text-[7.5px] font-mono uppercase">
        <div className="px-1.5 py-1 border border-cyan-500/10 rounded bg-neutral-950/55 flex flex-col">
          <span className="text-cyan-500/40 flex items-center gap-1">
            <Radio className="w-2 h-2 text-fuchsia-500/70" />
            SWEEPRANGE
          </span>
          <span className="text-cyan-300 font-bold tracking-wider">40_HZ to 150_KHZ</span>
        </div>
        <div className="px-1.5 py-1 border border-cyan-500/10 rounded bg-neutral-950/55 flex flex-col">
          <span className="text-cyan-500/40 flex items-center gap-1">
            <Activity className="w-2 h-2 text-fuchsia-500/70" />
            CARRIER
          </span>
          <span className="text-cyan-300 font-bold tracking-wider">{hzGauge.toFixed(2)} KHZ</span>
        </div>
        <div className="px-1.5 py-1 border border-cyan-500/10 rounded bg-neutral-950/55 flex flex-col">
          <span className="text-cyan-500/40">STATUS</span>
          <span className={`font-bold tracking-wider ${isHovered ? "text-fuchsia-300 animate-pulse" : "text-emerald-300"}`}>
            {isHovered ? "MODULATED" : "STEADY"}
          </span>
        </div>
      </div>
    </div>
  );
}
