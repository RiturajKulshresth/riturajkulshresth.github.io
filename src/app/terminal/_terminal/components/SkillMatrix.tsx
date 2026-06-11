/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cybernetic skill lattice with three canvas views: Reactor, Rack, Constellation.
 * Four pillars map to real stack areas; overdrive toggle shares the global stamina
 * reserve from OverdriveContext and hot-shifts accent/speed across all views.
 */

import React, { useEffect, useRef, useState } from "react";
import { synth } from "../audio";
import { useOverdrive, useStamina } from "../contexts/OverdriveContext";
import {
  Zap,
  Cpu,
  Cloud,
  ShieldCheck,
  BarChart3,
  Radio,
  Atom,
  Server,
  Sparkles,
  Activity
} from "lucide-react";

// ------------------------------------------------------------------------
// Types and constants
// ------------------------------------------------------------------------

type ColorPreset = "GREEN" | "AMBER" | "COSMIC";
type ViewMode = "REACTOR" | "RACK" | "CONSTELLATION";

interface PillarMetrics {
  robustness: number;
  scalability: number;
  efficiency: number;
}

interface SkillPillar {
  id: string;
  category: string;
  codename: string;
  blurb: string;
  icon: React.ReactNode;
  // Hue used for canvas strokes/fills; matches the visual identity of the
  // pillar across the three views so the eye can track a module from the
  // reactor diagram to the rack to the constellation.
  hue: { r: number; g: number; b: number };
  bgClass: string;
  borderClass: string;
  accentClass: string;
  verifiedAt: string;
  description: string;
  technologies: string[];
  metrics: PillarMetrics;
}

const SKILL_PILLARS: SkillPillar[] = [
  {
    id: "p1",
    category: "AI & INTELLIGENT AGENTS",
    codename: "STREAM_DJ",
    blurb: "Multi-agent loops, model routing, RAG pipelines.",
    icon: <Zap className="w-5 h-5 text-fuchsia-400" />,
    hue: { r: 232, g: 121, b: 249 },
    bgClass: "bg-fuchsia-500/10",
    borderClass: "border-fuchsia-500/20",
    accentClass: "text-fuchsia-400",
    verifiedAt: "Warner Bros. Discovery (Daisy & ACME Platforms)",
    description:
      "Multi-agent orchestration, dynamic context routing, model failover strategies, and integration with LangGraph, LangChain, Vercel AI SDK, and AWS Bedrock API gateways.",
    technologies: [
      "LangGraph",
      "LangChain",
      "LangSmith",
      "Vercel AI SDK",
      "AWS Bedrock",
      "DeepEval",
      "Model Fallback Routing"
    ],
    metrics: { robustness: 96, scalability: 95, efficiency: 89 }
  },
  {
    id: "p2",
    category: "CLOUD INFRASTRUCTURE & IAC",
    codename: "SUBNET_PRIESTS",
    blurb: "Terraformed lattice, EKS clusters, serverless lambdas.",
    icon: <Cloud className="w-5 h-5 text-[#00f3ff]" />,
    hue: { r: 0, g: 243, b: 255 },
    bgClass: "bg-cyan-500/10",
    borderClass: "border-cyan-500/20",
    accentClass: "text-[#00f3ff]",
    verifiedAt: "WBD Deployments & Deloitte Lambda Migrations",
    description:
      "Designing scalable IaC blueprints using Terraform and Terragrunt, configuring Kubernetes (EKS), managing Helm charts, and building high-performance serverless AWS Lambdas.",
    technologies: [
      "Terraform",
      "Terragrunt",
      "Kubernetes (EKS)",
      "Helm",
      "AWS Lambda",
      "Docker",
      "Serverless Framework"
    ],
    metrics: { robustness: 94, scalability: 97, efficiency: 90 }
  },
  {
    id: "p3",
    category: "ENTERPRISE BACKENDS & DATA STORES",
    codename: "WORDSMITHS",
    blurb: "Async APIs, JSONB schemas, vector indices.",
    icon: <Cpu className="w-5 h-5 text-emerald-400" />,
    hue: { r: 52, g: 211, b: 153 },
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    accentClass: "text-emerald-400",
    verifiedAt: "WBD Knowledge Hub Architecture",
    description:
      "Writing asynchronous enterprise-grade API endpoints using FastAPI, designing optimized PostgreSQL schemas with JSONB versioning, and deploying high-throughput AWS OpenSearch search indices.",
    technologies: [
      "FastAPI",
      "PostgreSQL JSONB",
      "AWS OpenSearch",
      "Alembic",
      "SQLAlchemy",
      "Next.js",
      "React"
    ],
    metrics: { robustness: 97, scalability: 96, efficiency: 91 }
  },
  {
    id: "p4",
    category: "SECURITY HARDENING & OPTIMIZATION",
    codename: "ICE_BREAKERS",
    blurb: "Passport gates, SAST sweeps, vault rotations.",
    icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
    hue: { r: 251, g: 191, b: 36 },
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    accentClass: "text-amber-400",
    verifiedAt: "ACME Secure Execution Multi-Resource ACLs",
    description:
      "Hardening system perimeters (clearing high/critical SAST reports), integrating OIDC Okta authentication protocols, safeguarding secure vaults, and optimizing DB clusters for massive cloud cost savings.",
    technologies: [
      "Okta OIDC",
      "SAST Remediation",
      "AWS Secrets Manager",
      "Audit Trails",
      "DeepEval QA",
      "Cost Optimisation"
    ],
    metrics: { robustness: 99, scalability: 88, efficiency: 95 }
  }
];

// Deterministic per-tech "intensity" so the same tech name always lands at
// the same star size / LED brightness. Looks varied without being random.
function techIntensity(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const norm = (Math.abs(h) % 55) / 100;
  return 0.45 + norm; // 0.45 .. 0.99
}

function techHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 33 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function rgb(p: SkillPillar, alpha = 1): string {
  return `rgba(${p.hue.r}, ${p.hue.g}, ${p.hue.b}, ${alpha})`;
}

// ------------------------------------------------------------------------
// Reactor Core schematic view
// ------------------------------------------------------------------------

interface ViewProps {
  pillars: SkillPillar[];
  selectedId: string;
  onSelect: (id: string) => void;
  overclocked: boolean;
}

const REACTOR_HEIGHT = 480;

function ReactorView({ pillars, selectedId, onSelect, overclocked }: ViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoverRef = useRef<string | null>(null);
  // Stable refs so the animation loop reads the latest selection / state
  // without restarting on every parent re-render. Without this the loop
  // tears down and rebuilds the canvas on every mousemove from App, which
  // shows up to the user as the panel "going black" and dropped clicks.
  const selectedRef = useRef(selectedId);
  const overclockedRef = useRef(overclocked);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);
  useEffect(() => {
    overclockedRef.current = overclocked;
  }, [overclocked]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const t0 = performance.now();

    // Drifting ambient particles so the schematic always looks alive even
    // when nothing is selected.
    const particles = Array.from({ length: 28 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random(),
      speed: 0.15 + Math.random() * 0.4,
      size: 0.6 + Math.random() * 1.2
    }));

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor((rect.height || REACTOR_HEIGHT) * dpr));
      // Skip if nothing actually changed so a spurious resize callback
      // (parent re-render, scroll, etc.) cannot wipe the canvas.
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);
    resize();

    // Cache module positions so click hit-testing matches what we render.
    const modulePositions: { id: string; mx: number; my: number; r: number }[] = [];

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (const m of modulePositions) {
        const dx = x - m.mx;
        const dy = y - m.my;
        if (Math.sqrt(dx * dx + dy * dy) < m.r + 10) {
          synth.playClick(820, 0.04);
          onSelectRef.current(m.id);
          return;
        }
      }
    };

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let hit: string | null = null;
      for (const m of modulePositions) {
        const dx = x - m.mx;
        const dy = y - m.my;
        if (Math.sqrt(dx * dx + dy * dy) < m.r + 10) {
          hit = m.id;
          break;
        }
      }
      hoverRef.current = hit;
      canvas.style.cursor = hit ? "pointer" : "default";
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMove);

    const drawHex = (cx: number, cy: number, r: number, rot = 0) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i - Math.PI / 2 + rot;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const drawDial = (cx: number, cy: number, r: number, time: number, over: boolean) => {
      // Outer rotating ring with tick marks (spin slowly clockwise).
      const spin = time * (over ? 0.35 : 0.12);
      ctx.strokeStyle = "rgba(0, 243, 255, 0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // 36 ticks
      for (let i = 0; i < 36; i++) {
        const a = spin + (i * Math.PI * 2) / 36;
        const isMajor = i % 9 === 0;
        const inner = isMajor ? r - 8 : r - 4;
        ctx.strokeStyle = isMajor ? "rgba(0, 243, 255, 0.45)" : "rgba(0, 243, 255, 0.18)";
        ctx.lineWidth = isMajor ? 1.4 : 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      }

      // Cardinal labels at NE/SE/SW/NW
      ctx.fillStyle = "rgba(0, 243, 255, 0.4)";
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cardinals = [
        { label: "N", a: -Math.PI / 2 },
        { label: "E", a: 0 },
        { label: "S", a: Math.PI / 2 },
        { label: "W", a: Math.PI }
      ];
      cardinals.forEach((c) => {
        const a = c.a + spin;
        const x = cx + Math.cos(a) * (r + 10);
        const y = cy + Math.sin(a) * (r + 10);
        ctx.fillText(c.label, x, y);
      });
    };

    const drawCornerReadout = (
      x: number,
      y: number,
      align: "left" | "right",
      lines: string[]
    ) => {
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? "rgba(255, 0, 255, 0.55)" : "rgba(0, 243, 255, 0.55)";
        ctx.fillText(line, x, y + i * 10);
      });
    };

    const render = (now: number) => {
      const time = (now - t0) / 1000;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height || REACTOR_HEIGHT;
      const cx = W / 2;
      const cy = H / 2;
      const orbit = Math.min(W, H) * 0.30;
      const over = overclockedRef.current;
      const sel = selectedRef.current;
      const hov = hoverRef.current;

      ctx.clearRect(0, 0, W, H);

      // Background hex grid: very faint, fills negative space.
      ctx.strokeStyle = "rgba(0, 243, 255, 0.025)";
      ctx.lineWidth = 0.5;
      const hexR = 14;
      const hexH = hexR * Math.sqrt(3);
      for (let yy = -hexH; yy < H + hexH; yy += hexH) {
        for (let xx = -hexR * 1.5; xx < W + hexR * 1.5; xx += hexR * 3) {
          const offset = (Math.floor(yy / hexH) % 2) * hexR * 1.5;
          drawHex(xx + offset, yy, hexR);
          ctx.stroke();
        }
      }

      // Concentric rings + radial spokes (schematic chrome).
      ctx.strokeStyle = "rgba(0, 243, 255, 0.06)";
      ctx.lineWidth = 1;
      for (let ring = 1; ring <= 4; ring++) {
        ctx.beginPath();
        ctx.arc(cx, cy, orbit * (ring / 4), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(0, 243, 255, 0.04)";
      for (let s = 0; s < 12; s++) {
        const a = (s * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22);
        ctx.lineTo(cx + Math.cos(a) * orbit * 1.18, cy + Math.sin(a) * orbit * 1.18);
        ctx.stroke();
      }

      // Outer rotating dial bezel.
      drawDial(cx, cy, orbit * 1.22, time, over);

      // Drifting ambient particles between the rings.
      particles.forEach((p) => {
        p.a += 0.003 + p.speed * 0.002;
        const r = orbit * (0.25 + p.r * 0.85) + Math.sin(time * p.speed + p.a) * 6;
        const px = cx + Math.cos(p.a) * r;
        const py = cy + Math.sin(p.a) * r;
        ctx.fillStyle = over ? "rgba(255, 0, 255, 0.35)" : "rgba(0, 243, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Compute module positions for this frame.
      modulePositions.length = 0;
      pillars.forEach((p, i) => {
        const angle = (i / pillars.length) * Math.PI * 2 - Math.PI / 2;
        const mx = cx + Math.cos(angle) * orbit;
        const my = cy + Math.sin(angle) * orbit;
        modulePositions.push({ id: p.id, mx, my, r: 28 });
      });

      // Conduits (before modules so modules render on top).
      pillars.forEach((p, i) => {
        const { mx, my } = modulePositions[i];
        const isSel = sel === p.id;
        const isHov = hov === p.id;

        ctx.lineWidth = isSel ? 2.4 : 1.4;
        ctx.strokeStyle = over
          ? `rgba(255, 0, 255, ${isSel ? 0.6 : 0.28})`
          : rgb(p, isSel ? 0.6 : isHov ? 0.4 : 0.22);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(mx, my);
        ctx.stroke();

        // Travelling packets, more visible per conduit.
        const packetCount = 4;
        const speed = (over ? 0.95 : 0.4) * (isSel ? 1.4 : 1);
        for (let k = 0; k < packetCount; k++) {
          const tt = (time * speed + k / packetCount) % 1;
          const px = cx + (mx - cx) * tt;
          const py = cy + (my - cy) * tt;
          ctx.fillStyle = over
            ? "rgba(255, 0, 255, 0.95)"
            : rgb(p, isSel ? 0.95 : 0.6);
          ctx.beginPath();
          ctx.arc(px, py, isSel ? 2.6 : 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Core orb.
      const corePulse = 0.65 + Math.sin(time * (over ? 5.2 : 1.6)) * 0.35;
      const coreColor = over
        ? `rgba(255, 80, 80, ${0.85 * corePulse})`
        : `rgba(0, 243, 255, ${0.85 * corePulse})`;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 56);
      grad.addColorStop(0, coreColor);
      grad.addColorStop(0.55, over ? "rgba(255, 80, 80, 0.18)" : "rgba(0, 243, 255, 0.18)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 56, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = over ? "rgba(255, 80, 80, 0.95)" : "rgba(0, 243, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + corePulse * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Core inner ring (counter-rotating)
      ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
      ctx.lineWidth = 1.4;
      drawHex(cx, cy, 6, -time * 0.6);
      ctx.stroke();

      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.font = "bold 8.5px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("AEGIS", cx, cy);

      // Modules + labels + node count badges.
      pillars.forEach((p, i) => {
        const { mx, my } = modulePositions[i];
        const isSel = sel === p.id;
        const isHov = hov === p.id;

        // Module hex
        ctx.lineWidth = isSel ? 2.4 : 1.3;
        ctx.strokeStyle = over
          ? "rgba(255, 0, 255, 0.85)"
          : rgb(p, isSel ? 0.95 : isHov ? 0.75 : 0.55);
        ctx.fillStyle = isSel ? rgb(p, 0.25) : "rgba(5, 5, 11, 0.88)";
        drawHex(mx, my, 28);
        ctx.fill();
        ctx.stroke();

        // Inner hex outline for chrome
        ctx.strokeStyle = rgb(p, 0.25);
        ctx.lineWidth = 0.8;
        drawHex(mx, my, 22);
        ctx.stroke();

        // Codename + module id
        ctx.fillStyle = isSel ? rgb(p, 0.95) : rgb(p, 0.78);
        ctx.font = "bold 8.5px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(p.codename, mx, my - 1);

        ctx.fillStyle = "rgba(0, 243, 255, 0.65)";
        ctx.font = "7px 'JetBrains Mono', monospace";
        ctx.fillText(p.id.toUpperCase(), mx, my + 9);
      });

      // Satellites for ALL modules: every pillar shows its full tech list
      // fanned outward by default. The selected pillar pulses brighter so
      // the click acts as a highlight, not a "load more".
      pillars.forEach((p, i) => {
        const { mx, my } = modulePositions[i];
        const isSel = sel === p.id;
        const isHov = hov === p.id;

        const outward = Math.atan2(my - cy, mx - cx);
        const satRadius = 70;
        const total = p.technologies.length;
        const spread = Math.PI * 0.75;

        // Alpha multipliers: selected reads as full saturation, non-selected
        // stays clearly readable but dimmer so the eye groups them as
        // "context" not "primary".
        const baseAlpha = isSel ? 1.0 : isHov ? 0.85 : 0.65;
        const dotAlpha = baseAlpha;
        const labelAlpha = isSel ? 0.95 : isHov ? 0.85 : 0.7;
        const linkAlpha = isSel ? 0.35 : isHov ? 0.25 : 0.18;
        // Selected satellites pulse subtly so the eye tracks the highlight.
        const pulse = isSel ? 1 + Math.sin(time * 4 + i) * 0.18 : 1;

        p.technologies.forEach((tech, ti) => {
          const angle = outward - spread / 2 + (ti / Math.max(1, total - 1)) * spread;
          const sx = mx + Math.cos(angle) * satRadius;
          const sy = my + Math.sin(angle) * satRadius;
          const tIntensity = techIntensity(tech);

          // Link line from module to satellite
          ctx.strokeStyle = over ? `rgba(255, 0, 255, ${linkAlpha})` : rgb(p, linkAlpha);
          ctx.lineWidth = isSel ? 1.1 : 0.7;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(sx, sy);
          ctx.stroke();

          // Satellite dot
          ctx.fillStyle = over ? `rgba(255, 0, 255, ${dotAlpha})` : rgb(p, dotAlpha);
          ctx.beginPath();
          ctx.arc(sx, sy, (2 + tIntensity * 1.5) * pulse, 0, Math.PI * 2);
          ctx.fill();

          // Tech label, nudged outward so it never overlaps the dot
          ctx.fillStyle = `rgba(220, 220, 255, ${labelAlpha})`;
          ctx.font = isSel ? "bold 7.5px 'JetBrains Mono', monospace" : "7px 'JetBrains Mono', monospace";
          ctx.textAlign = Math.cos(angle) > 0 ? "left" : "right";
          ctx.textBaseline = "middle";
          const labelX = sx + (Math.cos(angle) > 0 ? 6 : -6);
          ctx.fillText(tech, labelX, sy);
        });
      });

      // Corner telemetry widgets so the panel never reads as empty.
      const coreTemp = 38 + Math.sin(time * 0.7) * 4 + (over ? 22 : 0);
      const fieldInt = 87 + Math.sin(time * 1.1) * 5;
      const arcLoss = 0.04 + (over ? 0.18 : 0) + Math.abs(Math.sin(time * 0.5)) * 0.03;
      const uptimeH = Math.floor(time / 3.6) % 24;
      drawCornerReadout(8, 22, "left", [
        "CORE_TEMP",
        `${coreTemp.toFixed(1)} C`,
        "FIELD_INT",
        `${fieldInt.toFixed(1)} %`
      ]);
      drawCornerReadout(W - 8, 22, "right", [
        "ARC_LOSS",
        `${arcLoss.toFixed(3)} dB`,
        "PHASE_LOCK",
        over ? "FORCED" : "AUTO"
      ]);
      drawCornerReadout(8, H - 50, "left", [
        "RUNTIME",
        `${uptimeH}h ${Math.floor((time * 60) % 60)}m`,
        "SUB_BUS",
        "SYNCED"
      ]);
      drawCornerReadout(W - 8, H - 50, "right", [
        "TX_QUEUE",
        `${(28 + Math.sin(time) * 8).toFixed(0)} pkt/s`,
        "GUARD_RAILS",
        "ARMED"
      ]);

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObs.disconnect();
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMove);
    };
    // pillars is a module constant so this effect mounts exactly once; the
    // refs above keep it informed of selection/overclock/callback changes.
  }, [pillars]);

  return (
    <div
      ref={containerRef}
      className="relative border border-cyan-500/15 rounded bg-black/55 overflow-hidden h-full w-full"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-1.5 left-2 font-mono text-[8.5px] uppercase tracking-widest text-fuchsia-400/70 animate-pulse pointer-events-none">
        [REACTOR_CORE_SCHEMATIC]
      </div>
      <div className="absolute bottom-1.5 right-2 font-mono text-[8px] uppercase text-cyan-400/55 pointer-events-none">
        TAP_ANY_MODULE_TO_HIGHLIGHT_CHANNEL
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------
// Wireframe Rack view
// ------------------------------------------------------------------------

function RackGauge({
  label,
  value,
  overclocked,
  danger
}: {
  label: string;
  value: number; // 0..100
  overclocked: boolean;
  danger?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 96;
    const h = 64;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frame = 0;
    let t0 = performance.now();

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h - 8;
      const radius = 36;
      const start = Math.PI;
      const end = 2 * Math.PI;

      // Baseline arc
      ctx.strokeStyle = "rgba(0, 243, 255, 0.18)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, end);
      ctx.stroke();

      // Live arc with subtle breathing motion
      const jitter = Math.sin(t * (overclocked ? 6.5 : 1.4)) * (overclocked ? 6 : 2.5);
      const v = Math.max(0, Math.min(100, value + jitter));
      const liveEnd = start + ((end - start) * v) / 100;
      const isDanger = danger || v > 80;
      ctx.strokeStyle = isDanger
        ? "rgba(239, 68, 68, 0.85)"
        : overclocked
        ? "rgba(255, 0, 255, 0.85)"
        : "rgba(0, 243, 255, 0.85)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, liveEnd);
      ctx.stroke();

      // Needle
      ctx.strokeStyle = "rgba(255, 0, 255, 0.95)";
      ctx.lineWidth = 1.4;
      const nx = cx + Math.cos(liveEnd) * (radius - 3);
      const ny = cy + Math.sin(liveEnd) * (radius - 3);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // Hub
      ctx.fillStyle = "rgba(255, 0, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Numeric readout
      ctx.fillStyle = isDanger ? "rgba(239, 68, 68, 0.95)" : "rgba(0, 243, 255, 0.95)";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${v.toFixed(0)}%`, cx, cy - 12);

      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [value, overclocked, danger]);

  return (
    <div className="border border-cyan-500/15 rounded bg-black/40 p-2 flex flex-col items-center justify-center gap-1">
      <span className="font-mono text-[7.5px] uppercase tracking-wider text-cyan-500/60">
        {label}
      </span>
      <canvas ref={canvasRef} style={{ width: 96, height: 64 }} />
    </div>
  );
}

function RackView({ pillars, selectedId, onSelect, overclocked }: ViewProps) {
  // Cross-pillar averages drive the global gauges so the rack feels like
  // one system reading off shared sensors.
  const avg = pillars.reduce(
    (acc, p) => {
      acc.r += p.metrics.robustness;
      acc.s += p.metrics.scalability;
      acc.e += p.metrics.efficiency;
      return acc;
    },
    { r: 0, s: 0, e: 0 }
  );
  const denom = pillars.length;
  const power = avg.s / denom;
  const integrity = avg.r / denom;
  const heat = overclocked ? Math.min(98, avg.e / denom + 22) : avg.e / denom - 8;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 h-full content-start ${overclocked ? "animate-[rackShake_0.4s_ease-in-out_infinite]" : ""}`}>
      {/* Local keyframes so the rack jiggles only when overclocked */}
      <style>{`
        @keyframes rackShake {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-1px, 1px); }
          50%  { transform: translate(1px, -1px); }
          75%  { transform: translate(-1px, -1px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>

      {/* Chassis stack: grid-rows-4 distributes the four chassis evenly
          across the fixed 480px rack footprint. */}
      <div className="lg:col-span-9 grid grid-rows-4 gap-2.5 h-full min-h-[440px]">
        {pillars.map((p, idx) => {
          const isSel = p.id === selectedId;
          const accent = isSel ? rgb(p, 0.85) : rgb(p, 0.35);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                synth.playClick(820, 0.04);
                onSelect(p.id);
              }}
              className={`group text-left rounded relative overflow-hidden transition-all duration-200 cursor-pointer border ${
                isSel ? "border-cyan-400/70 bg-[#04101a]/80 shadow-[0_0_10px_rgba(0,243,255,0.08)]" : "border-cyan-500/15 bg-[#05050b]/55 hover:border-cyan-500/35"
              }`}
            >
              {/* Left selection bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: accent, boxShadow: isSel ? `0 0 6px ${accent}` : "none" }}
              />

              <div className="flex items-center gap-3 p-3">
                {/* Chassis spec strip */}
                <div className="shrink-0 flex flex-col items-center font-mono text-cyan-500/50 leading-none">
                  <span className="text-[10px] font-bold">U{idx + 1}</span>
                  <span className="text-[7px] mt-0.5">2U</span>
                </div>

                {/* Category + codename + per-tech LED rows */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="shrink-0">{p.icon}</span>
                    <div className="min-w-0">
                      <h4 className="font-mono text-[10.5px] font-black uppercase tracking-wider text-cyan-100 truncate">
                        {p.category}
                      </h4>
                      <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: rgb(p, 0.85) }}>
                        codename: {p.codename}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1">
                    {p.technologies.map((tech) => {
                      const intensity = techIntensity(tech);
                      const ledWidth = Math.round(intensity * 100);
                      return (
                        <div key={tech} className="flex items-center gap-1.5 font-mono text-[9px] text-cyan-300/85 truncate">
                          <span className="w-1 h-1 rounded-full bg-fuchsia-500/80 shrink-0" />
                          <span className="truncate">{tech}</span>
                          <div className="flex-1 h-[3px] bg-black/60 border border-cyan-500/10 rounded overflow-hidden ml-auto min-w-[20px] max-w-[60px]">
                            <div
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${ledWidth}%`,
                                background: overclocked ? "rgba(255, 0, 255, 0.85)" : accent,
                                boxShadow: overclocked ? "0 0 4px rgba(255, 0, 255, 0.6)" : "none"
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Global gauges: also a 4-row grid so this column mirrors the
          chassis stack and fills the 480px footprint. */}
      <div className="lg:col-span-3 grid grid-rows-4 gap-2.5 h-full min-h-[440px]">
        <RackGauge label="HEAT" value={heat} overclocked={overclocked} danger={overclocked} />
        <RackGauge label="POWER_DRAW" value={power} overclocked={overclocked} />
        <RackGauge label="INTEGRITY" value={integrity} overclocked={overclocked} />
        <div className="border border-cyan-500/10 rounded bg-black/40 p-2 flex flex-col items-center justify-center">
          <span className="font-mono text-[7.5px] uppercase tracking-widest text-cyan-500/55 block">
            CHASSIS_BUS
          </span>
          <span className="font-mono text-[10px] font-black text-cyan-300">
            {overclocked ? "1.20 GHz / SATURATED" : "850 MHz / NOMINAL"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------
// Constellation star-chart view
// ------------------------------------------------------------------------

const CONSTELLATION_HEIGHT = 480;

function ConstellationView({ pillars, selectedId, onSelect, overclocked }: ViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedRef = useRef(selectedId);
  const overclockedRef = useRef(overclocked);
  const onSelectRef = useRef(onSelect);
  const hoverRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);
  useEffect(() => {
    overclockedRef.current = overclocked;
  }, [overclocked]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const t0 = performance.now();

    // Background dust particles, stable across the whole effect lifecycle
    // so they look like persistent stars instead of teleporting noise.
    const dust = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() < 0.85 ? 0.5 : 1.2,
      blink: Math.random() * Math.PI * 2
    }));

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor((rect.height || CONSTELLATION_HEIGHT) * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Per-pillar anchor positions. Stars are spread around the anchor with
    // deterministic hashes so layout is stable but feels hand-placed.
    const cornerFor = (i: number, W: number, H: number) => {
      const layouts = [
        { x: W * 0.26, y: H * 0.30 },
        { x: W * 0.74, y: H * 0.30 },
        { x: W * 0.26, y: H * 0.70 },
        { x: W * 0.74, y: H * 0.70 }
      ];
      return layouts[i % layouts.length];
    };

    const buildStars = (W: number, H: number) => {
      const all: {
        pillarId: string;
        tech: string;
        x: number;
        y: number;
        size: number;
        intensity: number;
        p: SkillPillar;
      }[] = [];
      pillars.forEach((p, i) => {
        const anchor = cornerFor(i, W, H);
        const radius = Math.min(W, H) * 0.20;
        const total = p.technologies.length;
        p.technologies.forEach((tech, ti) => {
          const h = techHash(tech);
          const baseAngle = (ti / Math.max(1, total)) * Math.PI * 2;
          const wobble = ((h % 100) / 100 - 0.5) * 1.1;
          const rad = radius * (0.45 + ((h % 70) / 100));
          const x = anchor.x + Math.cos(baseAngle + wobble) * rad;
          const y = anchor.y + Math.sin(baseAngle + wobble) * rad * 0.82;
          const intensity = techIntensity(tech);
          const size = 2 + intensity * 4;
          all.push({ pillarId: p.id, tech, x, y, size, intensity, p });
        });
      });
      return all;
    };

    let starsCache: ReturnType<typeof buildStars> | null = null;
    let lastSize = { w: 0, h: 0 };

    const hitTest = (x: number, y: number) => {
      if (!starsCache) return null;
      let bestId: string | null = null;
      let bestDist = 26;
      for (const s of starsCache) {
        const dx = x - s.x;
        const dy = y - s.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestDist) {
          bestDist = d;
          bestId = s.pillarId;
        }
      }
      return bestId;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const id = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (id) {
        synth.playClick(880, 0.04);
        onSelectRef.current(id);
      }
    };

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const id = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      hoverRef.current = id;
      canvas.style.cursor = id ? "pointer" : "crosshair";
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMove);

    const render = (now: number) => {
      const time = (now - t0) / 1000;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height || CONSTELLATION_HEIGHT;

      if (lastSize.w !== W || lastSize.h !== H || !starsCache) {
        starsCache = buildStars(W, H);
        lastSize = { w: W, h: H };
      }

      ctx.clearRect(0, 0, W, H);

      const over = overclockedRef.current;
      const sel = selectedRef.current;
      const hov = hoverRef.current;

      // ----- Coordinate grid: sparse dashed lines for cyberpunk sky chrome.
      ctx.strokeStyle = "rgba(0, 243, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      const gridStep = 80;
      for (let xx = 0; xx < W; xx += gridStep) {
        ctx.beginPath();
        ctx.moveTo(xx, 0);
        ctx.lineTo(xx, H);
        ctx.stroke();
      }
      for (let yy = 0; yy < H; yy += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(W, yy);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ----- Background dust stars (persistent positions, twinkle phase).
      dust.forEach((d, i) => {
        const px = d.x * W;
        const py = d.y * H;
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.5 + d.blink));
        ctx.fillStyle = `rgba(${i % 3 === 0 ? "255, 0, 255" : "0, 243, 255"}, ${0.18 * twinkle})`;
        ctx.fillRect(px, py, d.size, d.size);
      });

      // ----- Nebula glow behind each cluster.
      pillars.forEach((p, i) => {
        const a = cornerFor(i, W, H);
        const isSel = sel === p.id;
        const dim = !isSel && sel ? 0.07 : 0.16;
        const radius = Math.min(W, H) * 0.30;
        const g = ctx.createRadialGradient(a.x, a.y, 4, a.x, a.y, radius);
        g.addColorStop(0, rgb(p, dim));
        g.addColorStop(1, rgb(p, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(a.x, a.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // ----- Connecting lines within each constellation.
      pillars.forEach((p) => {
        const isSel = sel === p.id;
        const dim = !isSel && sel ? 0.18 : 0.5;
        const stars = starsCache!.filter((s) => s.pillarId === p.id);
        ctx.strokeStyle = rgb(p, dim);
        ctx.lineWidth = isSel ? 1.1 : 0.65;
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            if (((i + j) % 3) === 0) {
              ctx.beginPath();
              ctx.moveTo(stars[i].x, stars[i].y);
              ctx.lineTo(stars[j].x, stars[j].y);
              ctx.stroke();
            }
          }
        }
      });

      // ----- Cross-constellation lightning when overclocked.
      if (over) {
        const anchors = pillars.map((_, i) => cornerFor(i, W, H));
        ctx.strokeStyle = "rgba(255, 0, 255, 0.4)";
        ctx.lineWidth = 0.8;
        for (let i = 0; i < anchors.length; i++) {
          for (let j = i + 1; j < anchors.length; j++) {
            const a = anchors[i];
            const b = anchors[j];
            const phase = (time * 0.7 + (i + j) * 0.21) % 1;
            const mx = a.x + (b.x - a.x) * phase;
            const my = a.y + (b.y - a.y) * phase;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.fillStyle = "rgba(255, 0, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(mx, my, 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ----- Stars + flare. Selected cluster brighter, hovered star flares.
      starsCache.forEach((s) => {
        const isSelCluster = sel === s.pillarId;
        const isHovCluster = hov === s.pillarId;
        const dim = !isSelCluster && sel ? 0.35 : 1.0;
        const flareMul = isSelCluster
          ? 1.0 + Math.sin(time * 4 + s.x * 0.05) * 0.25
          : isHovCluster
          ? 1.1
          : 1.0;

        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 5);
        glow.addColorStop(0, rgb(s.p, 0.75 * dim * flareMul));
        glow.addColorStop(1, rgb(s.p, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = over ? `rgba(255, 0, 255, ${0.9 * dim})` : rgb(s.p, 0.95 * dim);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * flareMul, 0, Math.PI * 2);
        ctx.fill();
      });

      // ----- Always-on tech labels for the top 3 stars per cluster so the
      // chart reads as populated even before any click.
      pillars.forEach((p) => {
        const stars = starsCache!
          .filter((s) => s.pillarId === p.id)
          .sort((a, b) => b.intensity - a.intensity)
          .slice(0, 3);
        const isSel = sel === p.id;
        const isHov = hov === p.id;
        const alpha = isSel ? 0.95 : isHov ? 0.85 : 0.55;
        ctx.fillStyle = `rgba(220, 220, 255, ${alpha})`;
        ctx.font = "7.5px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        stars.forEach((s) => {
          ctx.fillText(s.tech, s.x + s.size + 4, s.y);
        });
      });

      // ----- Selected cluster: show ALL tech labels.
      if (sel) {
        const selPillar = pillars.find((p) => p.id === sel);
        if (selPillar) {
          const stars = starsCache!.filter((s) => s.pillarId === sel);
          ctx.fillStyle = "rgba(220, 220, 255, 0.95)";
          ctx.font = "7.5px 'JetBrains Mono', monospace";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          stars.forEach((s) => {
            ctx.fillText(s.tech, s.x + s.size + 4, s.y);
          });
        }
      }

      // ----- Gang codename + member count + status label per cluster.
      pillars.forEach((p, i) => {
        const a = cornerFor(i, W, H);
        const isSel = sel === p.id;
        const labelY = a.y - Math.min(W, H) * 0.22;

        // Background card behind the label so it never gets lost in the
        // glow of the nebula.
        const codename = p.codename;
        const memberStr = `${p.technologies.length} STARS`;
        const statusStr = isSel ? "FOCUSED" : over ? "OVERCLOCKED" : "STANDBY";

        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        const cw = Math.max(
          ctx.measureText(codename).width,
          90
        );
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.strokeStyle = rgb(p, isSel ? 0.85 : 0.45);
        ctx.lineWidth = 1;
        const bx = a.x - cw / 2 - 8;
        const by = labelY - 12;
        ctx.beginPath();
        ctx.rect(bx, by, cw + 16, 30);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSel ? rgb(p, 0.95) : rgb(p, 0.7);
        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(codename, a.x, labelY - 3);

        ctx.fillStyle = "rgba(0, 243, 255, 0.7)";
        ctx.font = "7px 'JetBrains Mono', monospace";
        ctx.fillText(`${memberStr} // ${statusStr}`, a.x, labelY + 9);
      });

      // ----- Vertical scan beam sweeping the chart.
      const scanX = ((time * 0.18) % 1) * W;
      const scanGrad = ctx.createLinearGradient(scanX - 30, 0, scanX + 30, 0);
      scanGrad.addColorStop(0, "rgba(255, 0, 255, 0)");
      scanGrad.addColorStop(0.5, over ? "rgba(255, 0, 255, 0.18)" : "rgba(0, 243, 255, 0.12)");
      scanGrad.addColorStop(1, "rgba(255, 0, 255, 0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(scanX - 30, 0, 60, H);

      // ----- Corner readouts so the empty edges feel instrumented.
      const drawReadout = (
        x: number,
        y: number,
        align: "left" | "right",
        lines: string[]
      ) => {
        ctx.font = "7px 'JetBrains Mono', monospace";
        ctx.textAlign = align;
        ctx.textBaseline = "top";
        lines.forEach((line, i) => {
          ctx.fillStyle = i === 0 ? "rgba(255, 0, 255, 0.55)" : "rgba(0, 243, 255, 0.55)";
          ctx.fillText(line, x, y + i * 10);
        });
      };
      drawReadout(8, 22, "left", [
        "SECTOR",
        "47.2.NB-CYG",
        "PARALLAX",
        over ? "FORCED" : "LOCKED"
      ]);
      drawReadout(W - 8, 22, "right", [
        "MAG_FILTER",
        "ENABLED",
        "GANGS",
        `${pillars.length}/4`
      ]);
      drawReadout(8, H - 50, "left", [
        "DRIFT",
        `${(time * 0.04 % 1).toFixed(3)}`,
        "TX_SAT",
        "SYNC"
      ]);
      drawReadout(W - 8, H - 50, "right", [
        "STARS_TOTAL",
        `${starsCache.length}`,
        "AUTO_PAN",
        "OFF"
      ]);

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMove);
    };
  }, [pillars]);

  return (
    <div
      className="relative border border-cyan-500/15 rounded bg-black/65 overflow-hidden h-full w-full"
    >
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
      <div className="absolute top-1.5 left-2 font-mono text-[8.5px] uppercase tracking-widest text-fuchsia-400/70 animate-pulse pointer-events-none">
        [SECTOR_STAR_CHART // GANG_LEDGER]
      </div>
      <div className="absolute bottom-1.5 right-2 font-mono text-[8px] uppercase text-cyan-400/55 pointer-events-none">
        HOVER_OR_TAP_ANY_STAR_TO_FOCUS_GANG
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------
// Main export: SkillMatrix with view-mode toggle
// ------------------------------------------------------------------------

export default function SkillMatrix({ colorPreset = "COSMIC" }: { colorPreset?: ColorPreset }) {
  // Overclock is now the shared global "overdrive" so this toggle stays in
  // sync with the header button and every other visualizer, including the
  // stamina reserve.
  const { overdrive: isOverclocked, toggleOverdrive, depleted } = useOverdrive();
  const stamina = useStamina();
  const [selectedPillarId, setSelectedPillarId] = useState<string>("p1");
  const [viewMode, setViewMode] = useState<ViewMode>("REACTOR");

  const selectedPillar =
    SKILL_PILLARS.find((p) => p.id === selectedPillarId) || SKILL_PILLARS[0];

  const handlePillarChange = (id: string) => {
    setSelectedPillarId(id);
  };

  const overclockLocked = !isOverclocked && (depleted || stamina <= 1);

  const toggleOverclock = () => {
    if (overclockLocked) {
      synth.playClick(220, 0.12);
      return;
    }
    synth.playOverclock(isOverclocked ? 500 : 1000);
    toggleOverdrive();
  };

  const switchView = (mode: ViewMode) => {
    synth.playClick(1100, 0.04);
    setViewMode(mode);
  };

  const viewIcons: Record<ViewMode, React.ReactNode> = {
    REACTOR: <Atom className="w-3 h-3 shrink-0" />,
    RACK: <Server className="w-3 h-3 shrink-0" />,
    CONSTELLATION: <Sparkles className="w-3 h-3 shrink-0" />
  };

  // Suppress the unused-prop lint while still accepting colorPreset for
  // parity with sibling visualizers; future colour theming can hook in here.
  void colorPreset;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-cyan-500/10 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            <h2 className="font-mono text-sm font-black uppercase tracking-widest text-cyan-400">
              [ACTIVE_REPERTOIRE_GATEWAY]
            </h2>
          </div>
          <p className="font-mono text-[9px] text-cyan-500/40 mt-1">
            CYBERNETIC SKILL LATTICE / 4 MODULES / 27 TECH NODES
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {(["REACTOR", "RACK", "CONSTELLATION"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => switchView(mode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[9.5px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                viewMode === mode
                  ? "bg-cyan-950/40 border-cyan-400/70 text-cyan-200 shadow-[0_0_8px_rgba(0,243,255,0.15)]"
                  : "border-cyan-500/15 text-cyan-500/55 hover:border-cyan-400/40 hover:text-cyan-300"
              }`}
            >
              {viewIcons[mode]}
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Active view: pinned to a fixed footprint so flipping between the
          three modes never reflows the rest of the page. */}
      <div className="h-[480px]">
        {viewMode === "REACTOR" && (
          <ReactorView
            pillars={SKILL_PILLARS}
            selectedId={selectedPillarId}
            onSelect={handlePillarChange}
            overclocked={isOverclocked}
          />
        )}
        {viewMode === "RACK" && (
          <RackView
            pillars={SKILL_PILLARS}
            selectedId={selectedPillarId}
            onSelect={handlePillarChange}
            overclocked={isOverclocked}
          />
        )}
        {viewMode === "CONSTELLATION" && (
          <ConstellationView
            pillars={SKILL_PILLARS}
            selectedId={selectedPillarId}
            onSelect={handlePillarChange}
            overclocked={isOverclocked}
          />
        )}
      </div>

      {/* Shared detail readout: selected module info + metrics + overclock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: identity + description */}
        <div className="lg:col-span-7 border border-cyan-500/15 rounded bg-[#05050b]/60 p-4">
          <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                FOCUSED MODULE
              </span>
            </div>
            <span
              className="font-mono text-[9px] uppercase tracking-widest"
              style={{ color: rgb(selectedPillar, 0.9) }}
            >
              codename: {selectedPillar.codename}
            </span>
          </div>

          <h4 className="font-mono text-xs font-black uppercase tracking-wider text-cyan-100">
            {selectedPillar.category}
          </h4>
          <p className="font-mono text-[10.5px] leading-relaxed text-cyan-200/85 mt-2">
            {selectedPillar.description}
          </p>

          <div className="mt-3 p-2.5 bg-fuchsia-950/15 border border-fuchsia-500/15 rounded">
            <span className="font-mono text-[8px] uppercase tracking-widest text-fuchsia-400 font-black block">
              VERIFIED DEPLOYMENT RECORD
            </span>
            <p className="font-mono text-[9.5px] text-fuchsia-200/90 mt-1 leading-snug font-semibold">
              {selectedPillar.verifiedAt}
            </p>
          </div>
        </div>

        {/* Right: metrics + overclock */}
        <div className="lg:col-span-5 border border-cyan-500/15 rounded bg-[#05050b]/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#00f3ff]">
                  [DIAGNOSTICS_MATRIX]
                </span>
              </div>
              <span className="font-mono text-[9px] text-fuchsia-400/65 uppercase">
                {isOverclocked ? "SATURATED" : "STEADY"}
              </span>
            </div>

            {(() => {
              const m = selectedPillar.metrics;
              const r = isOverclocked ? Math.min(m.robustness + 4, 100) : m.robustness;
              const s = isOverclocked ? Math.min(m.scalability + 3, 100) : m.scalability;
              const e = isOverclocked ? Math.min(m.efficiency + 5, 100) : m.efficiency;
              const bars = [
                { label: "PRODUCTION ROBUSTNESS", value: r },
                { label: "SYSTEM SCALABILITY", value: s },
                { label: "CLOUD COST INDEX", value: e }
              ];
              return (
                <div className="space-y-3 font-mono text-[10px]">
                  {bars.map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-[9px] mb-1">
                        <span className="text-cyan-300">{b.label}</span>
                        <span className="text-cyan-400 font-bold">{b.value}%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-950/60 border border-cyan-500/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverclocked ? "bg-fuchsia-500 shadow-[0_0_8px_#ff00ff]" : "bg-cyan-400"
                          }`}
                          style={{ width: `${b.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="border-t border-cyan-500/10 pt-3 mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] text-[#00f3ff]/40 uppercase">CORE FREQUENCY:</span>
              <span className="font-mono text-[9px] text-cyan-400 font-bold">
                {isOverclocked ? "1.20 GHZ (STABLE)" : "850 MHZ (IDLE)"}
              </span>
            </div>
            {/* Same stamina reserve as the header OVERDRIVE button: the fill
                drains while engaged and recharges while idle. */}
            <button
              onClick={toggleOverclock}
              type="button"
              disabled={overclockLocked}
              title={
                overclockLocked
                  ? "Reactor recharging — overclock locked until reserve recovers"
                  : "Toggle global overdrive (consumes stamina)"
              }
              className={`relative overflow-hidden w-full py-2.5 font-mono text-[10px] font-black uppercase rounded border transition-colors duration-300 flex items-center gap-2 px-3 ${
                overclockLocked ? "cursor-not-allowed" : "cursor-pointer"
              } ${
                isOverclocked
                  ? "border-fuchsia-400 text-fuchsia-100 shadow-[0_0_12px_rgba(255,0,255,0.25)]"
                  : depleted
                  ? "border-red-500/60 text-red-300"
                  : "border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
              }`}
            >
              <span
                aria-hidden
                className={`absolute inset-y-0 left-0 transition-[width] duration-100 ease-linear ${
                  isOverclocked ? "bg-fuchsia-600/45" : depleted ? "bg-red-700/35" : "bg-cyan-600/30"
                }`}
                style={{ width: `${stamina}%` }}
              />
              <span
                aria-hidden
                className={`absolute inset-y-0 w-[2px] transition-[left] duration-100 ease-linear ${
                  isOverclocked ? "bg-fuchsia-300/90" : depleted ? "bg-red-400/80" : "bg-cyan-300/80"
                }`}
                style={{ left: `calc(${stamina}% - 1px)` }}
              />
              <Zap className={`relative w-3.5 h-3.5 shrink-0 ${isOverclocked ? "animate-pulse" : ""}`} />
              <span className="relative flex-1 text-left">
                {isOverclocked ? "OVERDRIVE" : depleted ? "RECHARGING" : "OVERDRIVE"}
              </span>
              <span className="relative tabular-nums text-[9px] opacity-80">
                {Math.round(stamina)}%
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
