/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bento grid of portfolio projects re-skinned as "system nodes" with live
 * efficiency oscillation. Click opens BlueprintModal: per-project canvas
 * schematics (Lorenz, radar sweep, etc.) driven by each node's blueprints[] codes.
 */

import React, { useState, useEffect, useRef } from "react";
import { ProjectNode } from "../types";
import { TERMINAL_PROJECTS } from "../data";
import { synth } from "../audio";
import { useOverdrive } from "../contexts/OverdriveContext";
import { Layers, Lock, ExternalLink, ShieldAlert, MousePointer2, Boxes } from "lucide-react";

// Sourced from the canonical portfolio data (see ../data) so the year/link
// fields never drift from the rest of the site; terminal-only flavor lives there.
const PROJECTS: ProjectNode[] = TERMINAL_PROJECTS;

const THEME_MAP = {
  GREEN: {
    text: "text-emerald-400",
    textLight: "text-emerald-300",
    category: "text-emerald-400/80",
    border: "border-emerald-500/20",
    borderHover: "hover:border-emerald-400",
    corners: "border-emerald-500/30 group-hover:border-emerald-400 font-mono",
    statusBarBg: "bg-emerald-950/40 border-emerald-500/10",
    statusBarFill: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
    pulseStatus: "bg-[#10b981]",
    canvasGrid: "rgba(16, 185, 129, 0.08)",
    canvasOrbit: "rgba(16, 185, 129, 0.4)",
    canvasOrb: "rgba(245, 158, 11, 0.85)", 
    canvasLaser: "rgba(245, 158, 11, 0.55)",
    canvasText: "rgba(16, 185, 129, 0.7)",
    modalCloseBtn: "text-emerald-400 border-emerald-500/25 bg-emerald-950/30 font-mono"
  },
  AMBER: {
    text: "text-amber-500",
    textLight: "text-amber-300",
    category: "text-amber-500/80",
    border: "border-amber-500/20",
    borderHover: "hover:border-amber-400",
    corners: "border-amber-500/30 group-hover:border-amber-400 font-mono",
    statusBarBg: "bg-amber-950/40 border-amber-500/10",
    statusBarFill: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]",
    pulseStatus: "bg-[#f59e0b]",
    canvasGrid: "rgba(245, 158, 11, 0.08)",
    canvasOrbit: "rgba(245, 158, 11, 0.4)",
    canvasOrb: "rgba(239, 68, 68, 0.85)", 
    canvasLaser: "rgba(239, 68, 68, 0.55)",
    canvasText: "rgba(245, 158, 11, 0.7)",
    modalCloseBtn: "text-amber-400 border-amber-500/25 bg-amber-950/30 font-mono"
  },
  COSMIC: {
    text: "text-[#00f3ff]",
    textLight: "text-cyan-300",
    category: "text-[#00f3ff]/70",
    border: "border-cyan-500/20",
    borderHover: "hover:border-cyan-400",
    corners: "border-cyan-500/30 group-hover:border-cyan-400 font-mono",
    statusBarBg: "bg-cyan-950/40 border-cyan-500/10",
    statusBarFill: "bg-[#00f3ff] shadow-[0_0_6px_rgba(0,243,255,0.6)]",
    pulseStatus: "bg-[#00f3ff]",
    canvasGrid: "rgba(0, 243, 255, 0.08)",
    canvasOrbit: "rgba(0, 243, 255, 0.4)",
    canvasOrb: "rgba(255, 0, 255, 0.82)", 
    canvasLaser: "rgba(255, 0, 255, 0.45)",
    canvasText: "rgba(0, 243, 255, 0.7)",
    modalCloseBtn: "text-fuchsia-400 border-fuchsia-500/25 bg-fuchsia-950/30 font-mono"
  }
};

export default function ProjectGrid({ colorPreset = "COSMIC" }: { colorPreset?: "GREEN" | "AMBER" | "COSMIC" }) {
  const { overdrive } = useOverdrive();
  const [selectedProject, setSelectedProject] = useState<ProjectNode | null>(null);
  // Seed live efficiency oscillator with every project's declared efficiency, not just p1/p2/p3.
  const [projectEfficiencies, setProjectEfficiencies] = useState<{ [key: string]: number }>(
    () => Object.fromEntries(PROJECTS.map((p) => [p.id, p.efficiency]))
  );

  const themeCtx = THEME_MAP[colorPreset] || THEME_MAP.COSMIC;

  // Oscillating efficiency values randomly to look "alive". Overdrive jitters
  // them faster and harder so the whole grid feels energised.
  useEffect(() => {
    const timer = setInterval(() => {
      setProjectEfficiencies((prev) => {
        const next = { ...prev };
        const swing = overdrive ? 1.4 : 0.4;
        Object.keys(next).forEach((id) => {
          const delta = (Math.random() - 0.5) * swing;
          next[id] = Math.min(Math.max(next[id] + delta, 10), 100);
        });
        return next;
      });
    }, overdrive ? 700 : 2000);
    return () => clearInterval(timer);
  }, [overdrive]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROJECTS.map((proj) => {
          const currentEff = projectEfficiencies[proj.id] || proj.efficiency;
          return (
            <div
              key={proj.id}
              onClick={() => {
                synth.playClick(800, 0.05);
                setSelectedProject(proj);
              }}
              className={`group bg-cyan-950/10 border ${themeCtx.border} ${themeCtx.borderHover} rounded p-4 cursor-pointer relative overflow-hidden transition-all duration-300 backdrop-blur-md hover:translate-y-[-2px] flex flex-col justify-between h-64 shadow-[0_0_15px_rgba(0,243,255,0.02)]`}
            >
              {/* Corner Accents */}
              <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${themeCtx.corners}`} />
              <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${themeCtx.corners}`} />
              <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${themeCtx.corners}`} />
              <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${themeCtx.corners}`} />

              <div>
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 mb-3">
                  <span className={`font-mono text-[9px] ${themeCtx.category} tracking-wider`}>
                    {proj.category}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${themeCtx.pulseStatus} animate-pulse shadow-[0_0_5px_#00f3ff]`} />
                    <span className={`font-mono text-[9px] ${themeCtx.textLight} font-bold`}>
                      {proj.status}
                    </span>
                  </div>
                </div>

                <h3 className={`font-mono text-xs font-black ${themeCtx.text} group-hover:text-fuchsia-400 transition-colors tracking-wide`}>
                  {proj.title}
                </h3>
                <p className="font-mono text-[10px] text-cyan-500/60 font-medium mb-3 mt-1 leading-tight">
                  {proj.subtitle}
                </p>

                <p className="font-mono text-[11px] text-cyan-300/80 line-clamp-3 leading-relaxed">
                  {proj.description}
                </p>
              </div>

              <div className="border-t border-cyan-500/10 pt-3 mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[8px] text-cyan-500/40">
                    {proj.year ? `${proj.year.toUpperCase()} // EFFICIENCY` : "CORE EFFICIENCY COEFFICIENT"}
                  </span>
                  <span className={`font-mono text-[10px] ${themeCtx.textLight} font-bold`}>
                    {currentEff.toFixed(2)}%
                  </span>
                </div>
                <div className={`h-1.5 ${themeCtx.statusBarBg} overflow-hidden p-[1px] border rounded`}>
                  <div
                    className={`h-full ${themeCtx.statusBarFill} rounded`}
                    style={{ width: `${currentEff}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Pad the bottom row so the 3-column grid stays visually clean.
            Every padding slot is a classified placeholder. */}
        {(() => {
          const padding = (3 - (PROJECTS.length % 3)) % 3;
          return Array.from({ length: padding }).map((_, i) => (
            <React.Fragment key={`secret-${i}`}>
              <ClassifiedCard themeCtx={themeCtx} />
            </React.Fragment>
          ));
        })()}
      </div>

      {/* Blueprint Schematic Holographic Modal */}
      {selectedProject && (
        <BlueprintModal
          project={selectedProject}
          colorPreset={colorPreset}
          onClose={() => {
            synth.playClick(500, 0.05);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Blueprint visualizers. Each project declares one or more `blueprints` codes;
 * every code maps to a distinct, mouse-reactive canvas scene below so no two
 * projects render the same schematic. All renderers share a single palette so
 * they pick up the active colour preset and the global overdrive accent.
 * --------------------------------------------------------------------------*/

type BlueprintCode =
  | "GRID_SPIN"
  | "NODES_GRID"
  | "LORENZ_ATTRACT"
  | "WAVE_PLANE"
  | "SCANNER_ARC"
  | "LINE_GRID"
  | "CIRCLE_ROT";

interface BpPalette {
  line: string;
  dim: string;
  orb: string;
  text: string;
  glow: string;
}

interface BpMouse {
  x: number; // 0..1 across the canvas
  y: number; // 0..1 down the canvas
  active: boolean;
}

const BLUEPRINT_LABELS: Record<BlueprintCode, string> = {
  GRID_SPIN: "PERSPECTIVE GRID",
  NODES_GRID: "NODE LATTICE",
  LORENZ_ATTRACT: "LORENZ ATTRACTOR",
  WAVE_PLANE: "WAVE FIELD",
  SCANNER_ARC: "RADAR SWEEP",
  LINE_GRID: "OSCILLOSCOPE",
  CIRCLE_ROT: "GYRO RINGS"
};

// Lorenz path is expensive-ish to integrate, so compute it once and reuse.
const LORENZ_POINTS: { x: number; y: number; z: number }[] = (() => {
  const pts: { x: number; y: number; z: number }[] = [];
  let x = 0.1, y = 0, z = 0;
  const dt = 0.01, sigma = 10, rho = 28, beta = 8 / 3;
  for (let i = 0; i < 1400; i++) {
    x += sigma * (y - x) * dt;
    y += (x * (rho - z) - y) * dt;
    z += (x * y - beta * z) * dt;
    pts.push({ x, y, z });
  }
  return pts;
})();

function bpBackground(ctx: CanvasRenderingContext2D, w: number, h: number, pal: BpPalette) {
  ctx.strokeStyle = pal.dim;
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 22) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 22) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

function drawGridSpin(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, m: BpMouse, pal: BpPalette) {
  const cx = w / 2;
  const horizon = h * 0.4;
  const vp = cx + (m.x - 0.5) * w * 0.5; // mouse steers the vanishing point
  ctx.strokeStyle = pal.line;
  ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i++) {
    const bx = cx + i * (w / 10);
    ctx.beginPath();
    ctx.moveTo(bx, h);
    ctx.lineTo(vp, horizon);
    ctx.stroke();
  }
  for (let r = 0; r < 16; r++) {
    const frac = ((r + (t * 0.9) % 1) / 16);
    const y = horizon + (h - horizon) * frac * frac;
    ctx.globalAlpha = Math.min(1, frac * 1.4);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Horizon sun orb.
  ctx.shadowBlur = pal.glow ? 18 : 0;
  ctx.shadowColor = pal.orb;
  ctx.fillStyle = pal.orb;
  ctx.beginPath();
  ctx.arc(vp, horizon, 10 + Math.sin(t * 2) * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawNodesGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, m: BpMouse, pal: BpPalette) {
  const count = 11;
  const cx = w / 2;
  const cy = h / 2;
  const mx = m.x * w;
  const my = m.y * h;
  const nodes: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + t * 0.25;
    const ring = i % 2 === 0 ? 0.7 : 0.4;
    let nx = cx + Math.cos(a) * w * 0.34 * ring + Math.sin(t + i) * 6;
    let ny = cy + Math.sin(a) * h * 0.3 * ring + Math.cos(t + i * 1.3) * 6;
    // Cursor repels nearby nodes for a tactile, interactive feel.
    if (m.active) {
      const dx = nx - mx;
      const dy = ny - my;
      const d = Math.hypot(dx, dy);
      if (d < 70 && d > 0.01) {
        const push = (70 - d) * 0.7;
        nx += (dx / d) * push;
        ny += (dy / d) * push;
      }
    }
    nodes.push({ x: nx, y: ny });
  }
  // Edges between near neighbours.
  ctx.strokeStyle = pal.dim;
  ctx.lineWidth = 1;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < w * 0.26) {
        ctx.globalAlpha = Math.max(0, 1 - d / (w * 0.26)) * 0.8;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = pal.line;
  nodes.forEach((n, i) => {
    ctx.shadowBlur = pal.glow ? 8 : 4;
    ctx.shadowColor = i % 3 === 0 ? pal.orb : pal.line;
    ctx.fillStyle = i % 3 === 0 ? pal.orb : pal.line;
    ctx.beginPath();
    ctx.arc(n.x, n.y, i % 3 === 0 ? 4 : 2.6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

function drawLorenz(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, m: BpMouse, pal: BpPalette) {
  const cx = w / 2;
  const cy = h / 2;
  // Mouse drag rotates the attractor; auto-spin when idle.
  const rotY = t * 0.4 + (m.x - 0.5) * 6;
  const rotX = 0.4 + (m.y - 0.5) * 3;
  const scale = Math.min(w, h) * 0.085;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < LORENZ_POINTS.length; i++) {
    const p = LORENZ_POINTS[i];
    let x1 = p.x;
    let y1 = p.y - 25; // recentre the attractor body
    let z1 = p.z - 25;
    let tmp = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
    z1 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
    y1 = tmp;
    tmp = x1 * Math.cos(rotY) + z1 * Math.sin(rotY);
    x1 = tmp;
    const sx = cx + x1 * scale;
    const sy = cy + y1 * scale;
    if (!started) { ctx.moveTo(sx, sy); started = true; }
    else ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = pal.line;
  ctx.stroke();
  // Tracer dot riding the trajectory.
  const idx = Math.floor((t * 60) % LORENZ_POINTS.length);
  const p = LORENZ_POINTS[idx];
  let x1 = p.x, y1 = p.y - 25, z1 = p.z - 25;
  let tmp = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
  z1 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
  y1 = tmp;
  tmp = x1 * Math.cos(rotY) + z1 * Math.sin(rotY);
  x1 = tmp;
  ctx.shadowBlur = 12;
  ctx.shadowColor = pal.orb;
  ctx.fillStyle = pal.orb;
  ctx.beginPath();
  ctx.arc(cx + x1 * scale, cy + y1 * scale, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawWavePlane(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, m: BpMouse, pal: BpPalette) {
  const cols = 16;
  const rows = 9;
  const amp = 10 + m.y * 26; // cursor height controls the wave amplitude
  const freq = 0.5 + m.x * 1.8; // cursor x controls the wavelength
  const project = (gx: number, gy: number) => {
    const nx = gx / (cols - 1);
    const ny = gy / (rows - 1);
    const wave = Math.sin(nx * Math.PI * 2 * freq + t * 2) * Math.cos(ny * Math.PI * 2 + t * 1.3) * amp;
    const depth = 0.5 + ny * 0.7;
    const px = (nx - 0.5) * w * 0.92 * depth + w / 2;
    const py = h * 0.3 + ny * h * 0.5 + wave;
    return { px, py };
  };
  ctx.strokeStyle = pal.line;
  ctx.lineWidth = 1;
  for (let gy = 0; gy < rows; gy++) {
    ctx.beginPath();
    for (let gx = 0; gx < cols; gx++) {
      const { px, py } = project(gx, gy);
      if (gx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.globalAlpha = 0.35 + (gy / rows) * 0.6;
    ctx.stroke();
  }
  ctx.strokeStyle = pal.dim;
  for (let gx = 0; gx < cols; gx++) {
    ctx.beginPath();
    for (let gy = 0; gy < rows; gy++) {
      const { px, py } = project(gx, gy);
      if (gy === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawScannerArc(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, m: BpMouse, pal: BpPalette) {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.42;
  // Range rings + cross hairs.
  ctx.strokeStyle = pal.dim;
  ctx.lineWidth = 1;
  for (let r = 1; r <= 4; r++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (R * r) / 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
  ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
  ctx.stroke();
  // Sweep wedge. Mouse can grab and aim the beam.
  const sweep = m.active
    ? Math.atan2(m.y * h - cy, m.x * w - cx)
    : (t * 1.6) % (Math.PI * 2);
  ctx.fillStyle = pal.line;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, R, sweep - 0.5, sweep);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = pal.orb;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
  ctx.stroke();
  // Blips that light up when the beam passes over them.
  const blips = [0.6, 2.1, 3.4, 4.7, 5.6];
  blips.forEach((ba, i) => {
    const br = R * (0.35 + ((i * 0.17) % 0.6));
    const bx = cx + Math.cos(ba) * br;
    const by = cy + Math.sin(ba) * br;
    const diff = Math.abs(((sweep - ba + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    const lit = Math.max(0, 1 - Math.abs(Math.PI - diff) / 0.6);
    ctx.globalAlpha = 0.25 + lit * 0.75;
    ctx.shadowBlur = lit * 12;
    ctx.shadowColor = pal.orb;
    ctx.fillStyle = pal.orb;
    ctx.beginPath();
    ctx.arc(bx, by, 2.5 + lit * 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawLineGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, m: BpMouse, pal: BpPalette) {
  // Oscilloscope: three stacked traces, cursor warps amplitude + frequency.
  const traces = 3;
  const amp = (h / (traces * 2.4)) * (0.6 + m.y * 1.3);
  for (let s = 0; s < traces; s++) {
    const baseY = (h / (traces + 1)) * (s + 1);
    const freq = (1.6 + s * 1.1) * (0.5 + m.x * 1.6);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const nx = x / w;
      const y =
        baseY +
        Math.sin(nx * Math.PI * 2 * freq + t * 3 + s) * amp +
        Math.sin(nx * Math.PI * 14 + t * 5) * 2;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = s === 0 ? pal.orb : pal.line;
    ctx.lineWidth = s === 0 ? 1.6 : 1;
    ctx.globalAlpha = s === 0 ? 1 : 0.55;
    ctx.shadowBlur = s === 0 && pal.glow ? 8 : 0;
    ctx.shadowColor = pal.orb;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  // Scrolling vertical time cursor.
  const tx = (t * 90) % w;
  ctx.strokeStyle = pal.dim;
  ctx.beginPath();
  ctx.moveTo(tx, 0); ctx.lineTo(tx, h); ctx.stroke();
}

function drawCircleRot(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, m: BpMouse, pal: BpPalette) {
  const cx = w / 2;
  const cy = h / 2;
  const dir = (m.x - 0.5) * 2; // cursor x sets spin direction + speed
  const rings = [
    { r: Math.min(w, h) * 0.42, teeth: 24, spd: -0.6 },
    { r: Math.min(w, h) * 0.3, teeth: 16, spd: 1.0 },
    { r: Math.min(w, h) * 0.18, teeth: 10, spd: -1.6 }
  ];
  rings.forEach((ring, ri) => {
    const rot = t * ring.spd * (1 + Math.abs(dir)) * Math.sign(dir || 1);
    ctx.strokeStyle = ri === 1 ? pal.orb : pal.line;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < ring.teeth; k++) {
      const a = rot + (k / ring.teeth) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * ring.r;
      const y1 = cy + Math.sin(a) * ring.r;
      const x2 = cx + Math.cos(a) * (ring.r + 6);
      const y2 = cy + Math.sin(a) * (ring.r + 6);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  });
  ctx.shadowBlur = pal.glow ? 14 : 6;
  ctx.shadowColor = pal.orb;
  ctx.fillStyle = pal.orb;
  ctx.beginPath();
  ctx.arc(cx, cy, 5 + Math.sin(t * 3) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBlueprint(
  code: BlueprintCode,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  m: BpMouse,
  pal: BpPalette
) {
  switch (code) {
    case "GRID_SPIN": return drawGridSpin(ctx, w, h, t, m, pal);
    case "NODES_GRID": return drawNodesGrid(ctx, w, h, t, m, pal);
    case "LORENZ_ATTRACT": return drawLorenz(ctx, w, h, t, m, pal);
    case "WAVE_PLANE": return drawWavePlane(ctx, w, h, t, m, pal);
    case "SCANNER_ARC": return drawScannerArc(ctx, w, h, t, m, pal);
    case "LINE_GRID": return drawLineGrid(ctx, w, h, t, m, pal);
    case "CIRCLE_ROT": return drawCircleRot(ctx, w, h, t, m, pal);
    default: return drawNodesGrid(ctx, w, h, t, m, pal);
  }
}

/* Internal Holographic Blueprint Modal. Renders the selected project's own
 * blueprint schematics, switchable and mouse-interactive, and reacts to the
 * global overdrive state for speed + accent. */
function BlueprintModal({ project, colorPreset, onClose }: { project: ProjectNode; colorPreset: "GREEN" | "AMBER" | "COSMIC"; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeCtx = THEME_MAP[colorPreset] || THEME_MAP.COSMIC;
  const { speedMul, overdrive } = useOverdrive();

  // Normalise the project's declared blueprints to known codes.
  const codes = (project.blueprints as BlueprintCode[]).filter(
    (c) => c in BLUEPRINT_LABELS
  );
  const blueprints: BlueprintCode[] = codes.length ? codes : ["NODES_GRID"];

  const [activeBp, setActiveBp] = useState(0);
  const [hovering, setHovering] = useState(false);

  // Live refs so the rAF loop reads current values without restarting.
  const mouseRef = useRef<BpMouse>({ x: 0.5, y: 0.5, active: false });
  const bpRef = useRef<BlueprintCode>(blueprints[0]);
  const speedRef = useRef(speedMul);
  const overRef = useRef(overdrive);
  useEffect(() => { bpRef.current = blueprints[activeBp]; }, [activeBp, blueprints]);
  useEffect(() => { speedRef.current = speedMul; }, [speedMul]);
  useEffect(() => { overRef.current = overdrive; }, [overdrive]);

  // Close on ESC. We intentionally do NOT lock body scroll so the page stays
  // scrollable while the blueprint is open.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    mouseRef.current.y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    let lastTs = Date.now();
    let simT = 0;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = 240;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const draw = () => {
      const now = Date.now();
      const dt = (now - lastTs) / 1000;
      lastTs = now;
      simT += dt * speedRef.current;

      const over = overRef.current;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const pal: BpPalette = over
        ? {
            line: "rgba(255, 0, 255, 0.72)",
            dim: "rgba(255, 0, 255, 0.12)",
            orb: "rgba(255, 120, 255, 0.95)",
            text: "rgba(255, 0, 255, 0.8)",
            glow: "1"
          }
        : {
            line: themeCtx.canvasOrbit,
            dim: themeCtx.canvasGrid,
            orb: themeCtx.canvasOrb,
            text: themeCtx.canvasText,
            glow: ""
          };

      bpBackground(ctx, w, h, pal);
      drawBlueprint(bpRef.current, ctx, w, h, simT, mouseRef.current, pal);

      // Live HUD readouts.
      ctx.fillStyle = pal.text;
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCHEMATIC: ${BLUEPRINT_LABELS[bpRef.current]}`, 10, 14);
      ctx.fillText(`T+${simT.toFixed(2)}s  x${speedRef.current.toFixed(1)}`, 10, h - 10);
      ctx.textAlign = "right";
      ctx.fillText(over ? "MODE: OVERDRIVE" : "MODE: NOMINAL", w - 10, 14);
      ctx.fillText(
        mouseRef.current.active ? "INPUT: TRACKING" : "INPUT: IDLE",
        w - 10,
        h - 10
      );

      frameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [colorPreset, themeCtx]);

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in pointer-events-auto cursor-pointer"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-[#05050b] border border-cyan-400 rounded w-full max-w-2xl relative shadow-[0_0_25px_rgba(0,243,255,0.15)] flex flex-col overflow-hidden cursor-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Holographic lasers border flash */}
        <div className={`absolute top-0 left-0 right-0 h-[1px] ${themeCtx.pulseStatus}`} />
        
        {/* Title bar */}
        <div className="bg-cyan-950/20 border-b border-cyan-500/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 min-w-0">
            <Layers className={`w-4 h-4 ${themeCtx.text} animate-pulse shrink-0`} />
            <span className={`font-mono text-xs font-black tracking-widest ${themeCtx.textLight} uppercase truncate`}>
              HOLOGRAPHIC BLUEPRINT SCHEMATIC
            </span>
          </div>
          <button
            onClick={onClose}
            className={`font-mono text-[11px] hover:text-white cursor-pointer uppercase border px-2.5 py-1 rounded transition-colors shrink-0 flex items-center gap-1.5 ${themeCtx.modalCloseBtn}`}
            aria-label="Back to projects"
          >
            <span>&larr;</span>
            <span>BACK TO PROJECTS</span>
          </button>
        </div>

        {/* Outer Grid content */}
        <div className="p-4 space-y-4">
          {/* Blueprint schematic switcher: each project exposes its own set so
              the visualization differs per project and is selectable. */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Boxes className={`w-3.5 h-3.5 ${themeCtx.text} shrink-0`} />
              {blueprints.map((code, i) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => { synth.playClick(1150, 0.04); setActiveBp(i); }}
                  className={`font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded border transition-colors cursor-pointer ${
                    activeBp === i
                      ? "bg-fuchsia-950/40 border-fuchsia-400/70 text-fuchsia-200"
                      : "border-cyan-500/20 text-cyan-400/60 hover:border-cyan-400/50 hover:text-cyan-200"
                  }`}
                >
                  {BLUEPRINT_LABELS[code]}
                </button>
              ))}
            </div>
            <span className="font-mono text-[8px] uppercase tracking-widest text-cyan-500/45 flex items-center gap-1">
              <MousePointer2 className="w-3 h-3 text-fuchsia-400/70 shrink-0" />
              MOVE CURSOR TO INTERACT
            </span>
          </div>

          <div className="border border-cyan-500/15 rounded bg-black/50 overflow-hidden relative">
            <canvas
              ref={canvasRef}
              className="w-full block cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => { mouseRef.current.active = true; setHovering(true); }}
              onMouseLeave={() => { mouseRef.current.active = false; setHovering(false); }}
            />
            <div className={`absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 border border-cyan-500/20 rounded font-mono text-[8px] ${hovering ? "text-fuchsia-300" : themeCtx.text} animate-pulse uppercase tracking-wider`}>
              {hovering ? "[INTERACTIVE / TRACKING INPUT]" : "[SIMULATION MODE_REALTIME]"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className={`font-mono text-xs font-bold ${themeCtx.text} mb-2 uppercase`}>
                {project.title}
              </h4>
              <p className="font-mono text-[11px] leading-relaxed text-cyan-200/90">
                {project.description}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <span className={`font-mono text-[9px] ${themeCtx.category} block`}>TECHNICAL ARCHITECTURE SPECS:</span>
                <ul className="mt-1.5 space-y-1">
                  {project.specs.map((spec, i) => (
                    <li key={i} className={`font-mono text-[10px] ${themeCtx.textLight} flex items-center space-x-1.5`}>
                      <span className={`w-1.5 h-3 ${themeCtx.statusBarFill} rounded-full`} />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-cyan-500/10 pt-3 flex justify-between items-center text-[10px] font-mono">
                <span className="text-cyan-500/50 uppercase">ENERGY QUOTIENT:</span>
                <span className="text-fuchsia-400 font-bold">{project.quantumCost}</span>
              </div>

              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 px-3 py-2 border border-cyan-500/35 bg-cyan-950/40 hover:bg-cyan-900/50 hover:border-cyan-400 rounded font-mono text-[10px] uppercase tracking-widest text-cyan-200 hover:text-white transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                  <span>OPEN EXTERNAL TRANSMISSION</span>
                </a>
              )}
            </div>
          </div>

          {/* Exit affordance hint */}
          <div className="border-t border-cyan-500/10 pt-2.5 flex items-center justify-center gap-2 font-mono text-[9px] text-cyan-500/45 uppercase tracking-widest">
            <span className="px-1.5 py-0.5 border border-cyan-500/20 rounded bg-cyan-950/30 text-[#00f3ff]/70">ESC</span>
            <span>OR TAP OUTSIDE TO RETURN TO PROJECTS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type ThemeCtx = typeof THEME_MAP[keyof typeof THEME_MAP];

/* Classified placeholder: stands in for work that cannot be disclosed (NDA / enterprise).
   The card is intentionally theme-agnostic (fixed fuchsia), so themeCtx is accepted
   for call-site symmetry with the other cards but not consumed. */
function ClassifiedCard({ themeCtx: _themeCtx }: { themeCtx: ThemeCtx }) {
  return (
    <div
      className={`group bg-fuchsia-950/10 border border-dashed border-fuchsia-500/35 rounded p-4 relative overflow-hidden h-64 flex flex-col justify-between cursor-not-allowed select-none`}
      aria-label="Classified project, details cannot be shared"
    >
      {/* Corner accents in fuchsia to signal restricted */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-fuchsia-400" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-fuchsia-400" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-fuchsia-400" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-fuchsia-400" />

      {/* Diagonal redaction stripes */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,0,255,0.5) 0 6px, transparent 6px 14px)",
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-between border-b border-fuchsia-500/20 pb-2 mb-3">
          <span className="font-mono text-[9px] text-fuchsia-300/80 tracking-wider">RESTRICTED // NDA SEAL</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_5px_#ff00ff]" />
            <span className="font-mono text-[9px] text-fuchsia-200 font-bold">CLASSIFIED</span>
          </div>
        </div>

        <h3 className="font-mono text-xs font-black text-fuchsia-200 tracking-wide flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
          <span>PROJECT_REDACTED</span>
        </h3>
        <p className="font-mono text-[10px] text-fuchsia-400/70 font-medium mb-3 mt-1 leading-tight">
          Active enterprise engagement under non-disclosure.
        </p>

        <p className="font-mono text-[11px] text-fuchsia-200/70 leading-relaxed">
          Details for this work cannot be shared on a public channel. Scope, codebase, metrics, and counterparts are sealed under NDA. Ask in person.
        </p>
      </div>

      <div className="relative border-t border-fuchsia-500/20 pt-3 mt-4">
        <div className="flex justify-between items-center text-[8px] font-mono">
          <span className="text-fuchsia-400/55 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-fuchsia-400 animate-pulse shrink-0" />
            <span>CLEARANCE REQUIRED</span>
          </span>
          <span className="text-fuchsia-300 font-bold">[ ████████ ]</span>
        </div>
      </div>
    </div>
  );
}

