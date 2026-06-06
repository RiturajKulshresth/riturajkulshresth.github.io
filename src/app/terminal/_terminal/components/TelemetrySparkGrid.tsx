/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Four-channel telemetry sparkline grid (HEAP, GPU, NET, IO).
 * Rolling 64-sample buffers advance on a throttled clock; ALL shows a 2x2 mosaic,
 * single-channel focus adds a stats column and 24-sample histogram.
 */

import React, { useEffect, useRef, useState } from "react";
import { synth } from "../audio";
import { useOverdrive } from "../contexts/OverdriveContext";
import { Gauge, LineChart } from "lucide-react";

interface TelemetrySparkGridProps {
  colorPreset?: "GREEN" | "AMBER" | "COSMIC";
}

const THEME_MAP = {
  GREEN: {
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
    corners: "border-emerald-400",
    line: "rgba(16, 185, 129, 0.85)",
    lineFill: "rgba(16, 185, 129, 0.18)",
    grid: "rgba(16, 185, 129, 0.06)",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.06)]",
    readout: "text-emerald-300"
  },
  AMBER: {
    accent: "text-amber-500",
    border: "border-amber-500/20",
    corners: "border-amber-500",
    line: "rgba(245, 158, 11, 0.85)",
    lineFill: "rgba(245, 158, 11, 0.18)",
    grid: "rgba(245, 158, 11, 0.06)",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.06)]",
    readout: "text-amber-300/90"
  },
  COSMIC: {
    accent: "text-[#00f3ff]",
    border: "border-cyan-500/20",
    corners: "border-cyan-400",
    line: "rgba(0, 243, 255, 0.85)",
    lineFill: "rgba(0, 243, 255, 0.18)",
    grid: "rgba(0, 243, 255, 0.06)",
    glow: "shadow-[0_0_12px_rgba(0,243,255,0.06)]",
    readout: "text-cyan-300"
  }
};

interface ChannelDef {
  key: "HEAP" | "GPU" | "NET" | "IO";
  label: string;
  unit: string;
  base: number;
  amp: number;
  phase: number;
  freq: number;
  jitter: number;
  // Operating range used to colour the status pill and to derive a
  // pseudo-percentage utilisation for non-percentage channels.
  warnAt: number;
  critAt: number;
}

const CHANNELS: ChannelDef[] = [
  { key: "HEAP", label: "HEAP", unit: "MB", base: 612, amp: 84, phase: 0.0, freq: 0.018, jitter: 14, warnAt: 720, critAt: 820 },
  { key: "GPU", label: "GPU", unit: "%", base: 56, amp: 22, phase: 1.7, freq: 0.026, jitter: 4, warnAt: 75, critAt: 90 },
  { key: "NET", label: "NET", unit: "MB/S", base: 38, amp: 18, phase: 2.4, freq: 0.034, jitter: 3, warnAt: 60, critAt: 80 },
  { key: "IO", label: "IO", unit: "OPS", base: 1280, amp: 380, phase: 0.9, freq: 0.022, jitter: 60, warnAt: 1700, critAt: 1900 }
];

const SAMPLE_COUNT = 64;
const FALLBACK_HEIGHT = 152;

// Lightweight stats helper that walks the series once per render.
function computeStats(series: number[]) {
  if (series.length === 0) return { min: 0, max: 0, avg: 0, last: 0, slope: 0 };
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (let i = 0; i < series.length; i++) {
    const v = series[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const last = series[series.length - 1];
  // Slope across the last ~8 samples gives a stable trend arrow.
  const window = Math.min(8, series.length);
  const slope = window > 1 ? (last - series[series.length - window]) / (window - 1) : 0;
  return { min, max, avg: sum / series.length, last, slope };
}

function statusFor(value: number, c: ChannelDef): "NOMINAL" | "WARN" | "CRIT" {
  if (value >= c.critAt) return "CRIT";
  if (value >= c.warnAt) return "WARN";
  return "NOMINAL";
}

export default function TelemetrySparkGrid({ colorPreset = "COSMIC" }: TelemetrySparkGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seriesRef = useRef<number[][]>(CHANNELS.map(() => []));
  const tickRef = useRef(0);

  const [activeChannel, setActiveChannel] = useState<"ALL" | ChannelDef["key"]>("ALL");
  const [readouts, setReadouts] = useState<number[]>(CHANNELS.map((c) => c.base));

  // Global overdrive makes the series advance faster. Ref keeps the rAF loop
  // reading the live multiplier without re-subscribing.
  const { speedMul, overdrive } = useOverdrive();
  const speedMulRef = useRef(speedMul);
  useEffect(() => { speedMulRef.current = speedMul; }, [speedMul]);

  const theme = THEME_MAP[colorPreset];

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
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

    const advanceSeries = () => {
      tickRef.current += 1;
      const t = tickRef.current;
      const nextReadouts: number[] = [];
      CHANNELS.forEach((c, i) => {
        const noise = (Math.random() - 0.5) * c.jitter;
        const slow = Math.sin(t * c.freq + c.phase);
        const fast = Math.sin(t * c.freq * 3 + c.phase * 1.4) * 0.35;
        const v = c.base + (slow + fast) * c.amp + noise;
        const series = seriesRef.current[i];
        series.push(v);
        if (series.length > SAMPLE_COUNT) series.shift();
        nextReadouts.push(v);
      });
      setReadouts(nextReadouts);
    };

    // Seed each series so the first paint is not empty.
    for (let i = 0; i < SAMPLE_COUNT; i++) advanceSeries();

    const renderSparkline = (
      series: number[],
      x: number,
      y: number,
      w: number,
      h: number,
      channel: ChannelDef,
      compact: boolean
    ) => {
      // Background panel.
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(x, y, w, h);

      // 3-line horizontal grid (top quartile / mid / bottom quartile).
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.25); ctx.lineTo(x + w, y + h * 0.25);
      ctx.moveTo(x, y + h * 0.5);  ctx.lineTo(x + w, y + h * 0.5);
      ctx.moveTo(x, y + h * 0.75); ctx.lineTo(x + w, y + h * 0.75);
      ctx.stroke();

      // Vertical "current sample" guide drifts left to right with the data.
      const guideX = x + w - 12;
      ctx.strokeStyle = "rgba(0, 243, 255, 0.06)";
      ctx.beginPath();
      ctx.moveTo(guideX, y);
      ctx.lineTo(guideX, y + h);
      ctx.stroke();

      if (series.length < 2) return;

      const stats = computeStats(series);
      const min = stats.min;
      const max = stats.max;
      const range = Math.max(1e-6, max - min);

      const pad = compact ? 4 : 6;
      const topReserve = compact ? 14 : 18;
      const bottomReserve = compact ? 10 : 14;
      const innerW = w - pad * 2;
      const innerH = h - topReserve - bottomReserve;
      const stepX = innerW / (SAMPLE_COUNT - 1);
      const innerTop = y + topReserve;
      const innerBottom = y + topReserve + innerH;

      // Status colour for the line based on the live value.
      const status = statusFor(stats.last, channel);
      const liveStroke =
        status === "CRIT"
          ? "rgba(239, 68, 68, 0.95)"
          : status === "WARN"
          ? "rgba(245, 158, 11, 0.95)"
          : theme.line;
      const liveFill =
        status === "CRIT"
          ? "rgba(239, 68, 68, 0.18)"
          : status === "WARN"
          ? "rgba(245, 158, 11, 0.18)"
          : theme.lineFill;

      // Filled area beneath the line.
      ctx.beginPath();
      ctx.moveTo(x + pad, innerBottom);
      for (let i = 0; i < series.length; i++) {
        const sx = x + pad + i * stepX;
        const norm = (series[i] - min) / range;
        const sy = innerTop + (1 - norm) * innerH;
        ctx.lineTo(sx, sy);
      }
      ctx.lineTo(x + pad + (series.length - 1) * stepX, innerBottom);
      ctx.closePath();
      ctx.fillStyle = liveFill;
      ctx.fill();

      // Moving-average ghost trace (windowed average across last 6 samples).
      ctx.strokeStyle = "rgba(0, 243, 255, 0.32)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      const win = 6;
      for (let i = 0; i < series.length; i++) {
        const start = Math.max(0, i - win);
        let s = 0;
        for (let k = start; k <= i; k++) s += series[k];
        const avg = s / (i - start + 1);
        const norm = (avg - min) / range;
        const sx = x + pad + i * stepX;
        const sy = innerTop + (1 - norm) * innerH;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Main sparkline stroke.
      ctx.beginPath();
      for (let i = 0; i < series.length; i++) {
        const sx = x + pad + i * stepX;
        const norm = (series[i] - min) / range;
        const sy = innerTop + (1 - norm) * innerH;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = liveStroke;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Leading dot (pulsing, status-coloured).
      const lastNorm = (stats.last - min) / range;
      const lastX = x + pad + (series.length - 1) * stepX;
      const lastY = innerTop + (1 - lastNorm) * innerH;
      ctx.shadowBlur = 6;
      ctx.shadowColor = liveStroke;
      ctx.fillStyle = "rgba(255, 0, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Channel label + status pill top-left.
      ctx.fillStyle = "rgba(0, 243, 255, 0.7)";
      ctx.font = "bold 8.5px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(channel.label, x + pad, y + 3);

      // Status pill rendered as a small filled rect with text.
      const pillColor =
        status === "CRIT"
          ? "rgba(239, 68, 68, 0.85)"
          : status === "WARN"
          ? "rgba(245, 158, 11, 0.85)"
          : "rgba(16, 185, 129, 0.85)";
      ctx.fillStyle = pillColor;
      const pillX = x + pad + ctx.measureText(channel.label).width + 6;
      ctx.fillRect(pillX, y + 4, 22, 8);
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.font = "bold 6.5px 'JetBrains Mono', monospace";
      ctx.fillText(status, pillX + 2, y + 5.5);

      // Trend arrow + delta in top-right.
      const arrow = stats.slope > 0.4 ? "▲" : stats.slope < -0.4 ? "▼" : "→";
      const arrowColor = stats.slope > 0.4 ? "rgba(239, 68, 68, 0.85)" : stats.slope < -0.4 ? "rgba(16, 185, 129, 0.85)" : "rgba(0, 243, 255, 0.55)";
      ctx.fillStyle = arrowColor;
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(arrow, x + w - pad, y + 3);
      ctx.fillStyle = "rgba(0, 243, 255, 0.55)";
      ctx.font = "7.5px 'JetBrains Mono', monospace";
      ctx.fillText(`Δ ${stats.slope >= 0 ? "+" : ""}${stats.slope.toFixed(stats.last < 100 ? 2 : 1)}`, x + w - pad - 12, y + 4);

      // Bottom-left: min, bottom-right: max.
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(0, 243, 255, 0.5)";
      ctx.textAlign = "left";
      ctx.fillText(`min ${stats.min < 100 ? stats.min.toFixed(1) : Math.round(stats.min)}`, x + pad, y + h - 8);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255, 0, 255, 0.55)";
      ctx.fillText(`max ${stats.max < 100 ? stats.max.toFixed(1) : Math.round(stats.max)}`, x + w - pad, y + h - 8);
    };

    // Focused single-channel mode adds an extra stats column and histogram
    // along the bottom edge so the user gets richer detail.
    const renderFocused = (
      series: number[],
      W: number,
      H: number,
      channel: ChannelDef
    ) => {
      // Reserve the right ~110px for a stats column.
      const statsCol = 110;
      const chartW = W - statsCol;
      // Reserve the bottom ~28px for a histogram strip.
      const histH = 30;
      const chartH = H - histH;

      renderSparkline(series, 0, 0, chartW, chartH, channel, false);

      // Stats column.
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(chartW, 0, statsCol, chartH);
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(chartW, 0, statsCol, chartH);

      const stats = computeStats(series);
      const status = statusFor(stats.last, channel);
      const lines: [string, string, string][] = [
        ["CHANNEL", `${channel.label}_${channel.key}`, "rgba(0, 243, 255, 0.85)"],
        ["LIVE", `${stats.last.toFixed(stats.last < 100 ? 2 : 1)} ${channel.unit}`, "rgba(255, 0, 255, 0.9)"],
        ["AVG", `${stats.avg.toFixed(stats.avg < 100 ? 2 : 1)} ${channel.unit}`, "rgba(0, 243, 255, 0.7)"],
        ["MIN / MAX", `${stats.min.toFixed(0)} / ${stats.max.toFixed(0)}`, "rgba(0, 243, 255, 0.55)"],
        ["SLOPE", `${stats.slope >= 0 ? "+" : ""}${stats.slope.toFixed(2)}`, stats.slope > 0 ? "rgba(239, 68, 68, 0.85)" : "rgba(16, 185, 129, 0.85)"],
        ["STATUS", status, status === "CRIT" ? "rgba(239, 68, 68, 0.95)" : status === "WARN" ? "rgba(245, 158, 11, 0.95)" : "rgba(16, 185, 129, 0.95)"]
      ];

      let yLine = 14;
      lines.forEach(([label, val, col]) => {
        ctx.fillStyle = "rgba(0, 243, 255, 0.45)";
        ctx.font = "7px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(label, chartW + 6, yLine);
        ctx.fillStyle = col;
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText(val, chartW + 6, yLine + 10);
        yLine += 22;
      });

      // Histogram of the last 24 samples along the bottom.
      const histY = chartH;
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, histY, W, histH);
      ctx.strokeStyle = theme.grid;
      ctx.strokeRect(0, histY, W, histH);

      const samples = series.slice(-24);
      const sMin = Math.min(...samples);
      const sMax = Math.max(...samples);
      const sRange = Math.max(1e-6, sMax - sMin);
      const barCount = samples.length;
      const barW = (W - 12) / barCount;
      const barAreaH = histH - 8;
      samples.forEach((v, i) => {
        const norm = (v - sMin) / sRange;
        const bh = Math.max(1, norm * barAreaH);
        const bx = 6 + i * barW;
        const by = histY + histH - 4 - bh;
        const c = statusFor(v, channel);
        ctx.fillStyle =
          c === "CRIT" ? "rgba(239, 68, 68, 0.85)" :
          c === "WARN" ? "rgba(245, 158, 11, 0.85)" :
          theme.line;
        ctx.fillRect(bx, by, Math.max(1, barW - 1.5), bh);
      });

      ctx.fillStyle = "rgba(0, 243, 255, 0.55)";
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`HIST_24 // ${channel.label}`, 6, histY + 9);
    };

    let last = performance.now();

    const loop = (now: number) => {
      // Step series every ~150ms so the line breathes without being noisy.
      // Overdrive shortens that interval for a faster scroll.
      if (now - last > 150 / speedMulRef.current) {
        advanceSeries();
        last = now;
      }

      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height || FALLBACK_HEIGHT;
      ctx.clearRect(0, 0, W, H);

      const gap = 4;

      if (activeChannel === "ALL") {
        // 2x2 layout: each cell self-renders label, pill, trend arrow, and
        // min/max via renderSparkline.
        const cellW = (W - gap) / 2;
        const cellH = (H - gap) / 2;
        CHANNELS.forEach((c, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = col * (cellW + gap);
          const cy = row * (cellH + gap);
          renderSparkline(seriesRef.current[i], cx, cy, cellW, cellH, c, true);
        });
      } else {
        // Focused single channel with stats column + 24-sample histogram.
        const i = CHANNELS.findIndex((c) => c.key === activeChannel);
        if (i >= 0) {
          renderFocused(seriesRef.current[i], W, H, CHANNELS[i]);
        }
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      resizeObs?.disconnect();
    };
  }, [colorPreset, activeChannel]);

  const playSwap = (channel: typeof activeChannel) => {
    synth.playClick(1100, 0.04);
    setActiveChannel(channel);
  };

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
          <LineChart className={`w-3.5 h-3.5 ${theme.accent} animate-pulse shrink-0`} />
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#00f3ff]">
            TELEMETRY_SPARKS // SUB_SYSTEMS
          </h3>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[8.5px]">
          {(["ALL", "HEAP", "GPU", "NET", "IO"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => playSwap(opt)}
              className={`px-1.5 py-0.5 rounded border transition-colors ${
                activeChannel === opt
                  ? "bg-[#00f3ff]/20 border-[#00f3ff]/50 text-[#00f3ff]"
                  : "border-cyan-500/15 text-cyan-500/40 hover:text-cyan-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Sparkline canvas */}
      <div className="relative border border-cyan-500/5 bg-black/35 rounded overflow-hidden" style={{ height: `${FALLBACK_HEIGHT}px` }}>
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute top-1 right-2 font-mono text-[7px] text-fuchsia-400/55 uppercase tracking-widest animate-pulse">
          [TELEMETRY_LIVE]
        </div>
      </div>

      {/* Bottom readout strip: per channel value, status pill, and trend
          arrow derived from the live series. */}
      <div className="mt-2 grid grid-cols-4 gap-2 shrink-0">
        {CHANNELS.map((c, i) => {
          const v = readouts[i] ?? c.base;
          const series = seriesRef.current[i] ?? [];
          const stats = computeStats(series);
          const status = statusFor(v, c);
          const arrow = stats.slope > 0.4 ? "▲" : stats.slope < -0.4 ? "▼" : "→";
          const arrowColor =
            stats.slope > 0.4 ? "text-red-400" : stats.slope < -0.4 ? "text-emerald-400" : "text-cyan-400/60";
          const pillColor =
            status === "CRIT"
              ? "bg-red-500/80 text-black"
              : status === "WARN"
              ? "bg-amber-500/80 text-black"
              : "bg-emerald-500/80 text-black";
          return (
            <div
              key={c.key}
              className="px-1.5 py-1 border border-cyan-500/10 rounded bg-neutral-950/55 flex flex-col gap-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[7.5px] text-cyan-500/45 uppercase tracking-wider flex items-center gap-1">
                  <Gauge className="w-2 h-2 text-fuchsia-500/70" />
                  {c.label}
                </span>
                <span className={`font-mono text-[9px] font-bold leading-none ${arrowColor}`}>{arrow}</span>
              </div>
              <span className={`font-mono text-[10px] font-bold ${theme.readout}`}>
                {v < 100 ? v.toFixed(1) : Math.round(v)} <span className="text-[7px] text-cyan-500/40 font-normal">{c.unit}</span>
              </span>
              <div className="flex items-center justify-between gap-1">
                <span className={`font-mono text-[6.5px] tracking-wider font-bold px-1 rounded ${pillColor}`}>
                  {status}
                </span>
                <span className="font-mono text-[6.5px] text-cyan-500/40">
                  {Math.round(stats.min)}/{Math.round(stats.max)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
