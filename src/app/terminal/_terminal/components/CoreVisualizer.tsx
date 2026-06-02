/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { synth } from "../audio";
import { useOverdrive } from "../contexts/OverdriveContext";
import { Maximize2, Shield, Zap } from "lucide-react";

interface CoreVisualizerProps {
  colorPreset?: "GREEN" | "AMBER" | "COSMIC";
}

const THEME_MAP = {
  GREEN: {
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
    corners: "border-emerald-400",
    canvasCoreLine: "rgba(16, 185, 129, 0.45)",
    canvasAuxLine: "rgba(16, 185, 129, 0.15)",
    canvasNode: "rgba(16, 185, 129, 0.85)",
    canvasCoreOrb: "rgba(245, 158, 11, 0.85)", 
    textLight: "text-emerald-300",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.06)]"
  },
  AMBER: {
    accent: "text-amber-500",
    border: "border-amber-500/20",
    corners: "border-amber-500",
    canvasCoreLine: "rgba(245, 158, 11, 0.45)",
    canvasAuxLine: "rgba(245, 158, 11, 0.15)",
    canvasNode: "rgba(245, 158, 11, 0.85)",
    canvasCoreOrb: "rgba(239, 68, 68, 0.85)",
    textLight: "text-amber-300/90",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.06)]"
  },
  COSMIC: {
    accent: "text-[#00f3ff]",
    border: "border-cyan-500/20",
    corners: "border-cyan-400",
    canvasCoreLine: "rgba(0, 243, 255, 0.45)",
    canvasAuxLine: "rgba(0, 243, 255, 0.15)",
    canvasNode: "rgba(0, 243, 255, 0.85)",
    canvasCoreOrb: "rgba(255, 0, 255, 0.85)",
    textLight: "text-cyan-300",
    glow: "shadow-[0_0_12px_rgba(0,243,255,0.06)]"
  }
};

// 3D Point class
interface Point3D {
  x: number;
  y: number;
  z: number;
  label?: string;
}

// 3D Projection & Math helpers
function rotateX(point: Point3D, angle: number): Point3D {
  const rad = angle;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
    label: point.label
  };
}

function rotateY(point: Point3D, angle: number): Point3D {
  const rad = angle;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: point.z * sin + point.x * cos,
    y: point.y,
    z: point.z * cos - point.x * sin,
    label: point.label
  };
}

function rotateZ(point: Point3D, angle: number): Point3D {
  const rad = angle;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z,
    label: point.label
  };
}

// Pre-generated 3D structures:
// 1. Double Helix / Nested Ribbons (beautiful futuristic look)
// 2. Geodesic Sphere Nodes
const NODES_3D: Point3D[] = [
  // Core octahedron vertices
  { x: 0, y: 35, z: 0, label: "PLAT_A" },
  { x: 0, y: -35, z: 0, label: "PLAT_B" },
  { x: 35, y: 0, z: 0, label: "RAG_HUB" },
  { x: -35, y: 0, z: 0, label: "DAISY_CH" },
  { x: 0, y: 0, z: 35, label: "ACME" },
  { x: 0, y: 0, z: -35, label: "BOLT" },

  // Outer orbital nodes
  { x: 70, y: 30, z: 30, label: "EVAL" },
  { x: -70, y: -30, z: -30, label: "OIDC" },
  { x: 30, y: 70, z: -30, label: "SAST" },
  { x: -30, y: -70, z: 30, label: "BEDDR" },
  { x: -30, y: 30, z: 70, label: "OPNS" },
  { x: 30, y: -30, z: -70, label: "TF_IAC" },
];

export default function CoreVisualizer({ colorPreset = "COSMIC" }: CoreVisualizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [modelMode, setModelMode] = useState<"NEURAL" | "ORBIT" | "MATRIX">("NEURAL");
  const [frameTicks, setFrameTicks] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Global overdrive: speeds up rotation and hot-shifts the accent. Mirrored
  // into refs so the rAF loop reads live values without restarting.
  const { speedMul, overdrive } = useOverdrive();
  const speedMulRef = useRef(speedMul);
  const overdriveRef = useRef(overdrive);
  useEffect(() => { speedMulRef.current = speedMul; }, [speedMul]);
  useEffect(() => { overdriveRef.current = overdrive; }, [overdrive]);

  // Use refs for mouse tracking to completely bypass React rerender cycles and enable sleek linear interpolation
  const mouseRef = useRef({
    rx: 0,
    ry: 0,
    targetRx: 0,
    targetRy: 0,
    hoverFade: 0,
    isHovered: false
  });

  const theme = THEME_MAP[colorPreset] || THEME_MAP.COSMIC;

  // Track hover coordinate target values smoothly
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 to +1
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 to +1
    
    mouseRef.current.targetRx = x * 0.4;
    mouseRef.current.targetRy = y * 0.4;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let angleX = 0.006;
    let angleY = 0.009;
    let angleZ = 0.004;

    // Handle auto-resize safely based on parent size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 175; // Slightly taller to host the new HUD overlay.
      }
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    let localTicks = 0;

    const render = () => {
      localTicks += speedMulRef.current;
      setFrameTicks(localTicks);
      const over = overdriveRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw faint dither pattern block.
      ctx.fillStyle = "rgba(0, 243, 255, 0.02)";
      for (let y = 0; y < canvas.height; y += 4) {
        for (let x = (y % 8 === 0 ? 0 : 4); x < canvas.width; x += 8) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // 5-line horizontal / vertical reference grid so the background reads
      // as a proper coordinate space rather than just two crosshairs.
      ctx.strokeStyle = "rgba(0, 243, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let r = 1; r <= 4; r++) {
        const yy = (canvas.height * r) / 5;
        ctx.moveTo(0, yy);
        ctx.lineTo(canvas.width, yy);
      }
      for (let c = 1; c <= 6; c++) {
        const xx = (canvas.width * c) / 7;
        ctx.moveTo(xx, 0);
        ctx.lineTo(xx, canvas.height);
      }
      ctx.stroke();

      // Heavier crosshair so the centre still pops.
      ctx.strokeStyle = "rgba(0, 243, 255, 0.08)";
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvas.height);
      ctx.stroke();

      // Rotating outer sweep beam: a thin arc sliding around the centre.
      const sweepRadius = Math.min(cx, cy) - 10;
      const sweepStart = (localTicks * 0.04) % (Math.PI * 2);
      ctx.strokeStyle = over ? "rgba(255, 0, 255, 0.5)" : "rgba(255, 0, 255, 0.18)";
      ctx.lineWidth = over ? 2.4 : 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, sweepRadius, sweepStart, sweepStart + (over ? 1.1 : 0.6));
      ctx.stroke();

      // Read & smoothly update the interpolated mouse states
      const m = mouseRef.current;
      m.rx += (m.targetRx - m.rx) * 0.08;
      m.ry += (m.targetRy - m.ry) * 0.08;
      m.hoverFade += ((m.isHovered ? 1.0 : 0.0) - m.hoverFade) * 0.08;

      // Dynamic rotation offsets from mouse and time with zero popping
      const finalAngleX = angleX * localTicks + (m.ry * 3.14);
      const finalAngleY = angleY * localTicks + (m.rx * 3.14);
      const finalAngleZ = angleZ * localTicks;

      // Perspective projection values
      const fov = 160;

      // Project all nodes
      const projected: { sx: number; sy: number; prj: Point3D; depth: number }[] = NODES_3D.map((node) => {
        // Rotate in 3D
        let r = rotateX(node, finalAngleX);
        r = rotateY(r, finalAngleY);
        r = rotateZ(r, finalAngleZ);

        // Perspective scaling
        const dist = 180; // Distance of camera
        const scale = fov / (dist + r.z);
        const sx = cx + r.x * scale;
        const sy = cy + r.y * scale;

        return { sx, sy, prj: r, depth: r.z };
      });

      // Sort by depth (painters algorithm) so back elements render below
      const sorted = [...projected].sort((a, b) => b.depth - a.depth);

      if (modelMode === "NEURAL") {
        // Draw inner octahedron links (lines between core node points 0 to 5)
        ctx.strokeStyle = theme.canvasCoreLine;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 4 + m.hoverFade * 4;
        ctx.shadowColor = theme.canvasCoreLine;

        const octaLines = [
          [0, 2], [0, 3], [0, 4], [0, 5],
          [1, 2], [1, 3], [1, 4], [1, 5],
          [2, 4], [4, 3], [3, 5], [5, 2]
        ];

        ctx.beginPath();
        octaLines.forEach(([start, end]) => {
          const ptA = projected[start];
          const ptB = projected[end];
          if (ptA && ptB) {
            ctx.moveTo(ptA.sx, ptA.sy);
            ctx.lineTo(ptB.sx, ptB.sy);
          }
        });
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Draw auxiliary thin dotted cords linking outer vertices to core
        ctx.strokeStyle = theme.canvasAuxLine;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        for (let i = 6; i < projected.length; i++) {
          const ptA = projected[i];
          const ptCore = projected[i % 6]; 
          if (ptA && ptCore) {
            ctx.moveTo(ptA.sx, ptA.sy);
            ctx.lineTo(ptCore.sx, ptCore.sy);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Render point vertices (nodes).
        sorted.forEach(({ sx, sy, prj, depth }) => {
          const size = Math.max(1, (78 - depth) * 0.075);
          const isCore = projected.findIndex(p => p.prj === prj) < 6;

          ctx.shadowBlur = size * (1.2 + m.hoverFade * 0.8);
          ctx.shadowColor = isCore ? theme.canvasCoreOrb : theme.canvasNode;

          ctx.fillStyle = isCore ? theme.canvasCoreOrb : theme.canvasNode;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;

          // Label policy: core nodes are always faintly labelled so the
          // viewer can read the system map without hovering; non-core nodes
          // only label on hover. Hover brightens both.
          if (prj.label) {
            if (isCore) {
              ctx.fillStyle = `rgba(0, 243, 255, ${0.45 + m.hoverFade * 0.5})`;
              ctx.font = "bold 7px 'JetBrains Mono', monospace";
              ctx.fillText(prj.label, sx + 5, sy - 2);
            } else if (m.hoverFade > 0.05) {
              ctx.fillStyle = `rgba(255, 0, 255, ${m.hoverFade * 0.8})`;
              ctx.font = "7px 'JetBrains Mono', monospace";
              ctx.fillText(prj.label, sx + 5, sy - 2);
            }
          }
        });

      } else if (modelMode === "ORBIT") {
        // Draw elegant circular concentric orbital rings warped in perspective
        ctx.strokeStyle = theme.canvasAuxLine;
        ctx.lineWidth = 1;

        const rings = [45, 65, 85];
        rings.forEach((radius) => {
          ctx.beginPath();
          for (let a = 0; a < Math.PI * 2; a += 0.05) {
            let orbitPt = {
              x: Math.cos(a) * radius,
              y: 0,
              z: Math.sin(a) * radius
            };

            // Rotate matching viewport
            let r = rotateX(orbitPt, finalAngleX);
            r = rotateY(r, finalAngleY);
            r = rotateZ(r, finalAngleZ);

            const dist = 180;
            const scale = fov / (dist + r.z);
            const sx = cx + r.x * scale;
            const sy = cy + r.y * scale;

            if (a === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.stroke();
        });

        // Track floating node orbitals sweeping the ring
        sorted.forEach(({ sx, sy, prj }) => {
          const isCore = projected.findIndex(p => p.prj === prj) < 6;
          if (!isCore) {
            ctx.fillStyle = theme.canvasNode;
            ctx.beginPath();
            ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Direct scan pulse coordinates line with soft fade
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.1 + m.hoverFade * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(cx, cy);
            ctx.stroke();
          } else {
            ctx.fillStyle = theme.canvasCoreOrb;
            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

      } else if (modelMode === "MATRIX") {
        // Matrix style technical vectors grid with float coordinate tags
        ctx.fillStyle = "rgba(0, 243, 255, 0.5)";
        ctx.font = "6.5px 'JetBrains Mono', monospace";

        projected.forEach(({ sx, sy, prj }) => {
          ctx.fillText(`X:${prj.x.toFixed(0)} Y:${prj.y.toFixed(0)}`, sx - 15, sy + 3);
          ctx.fillText(`[${prj.label || "REG"}]`, sx - 10, sy - 5);
          
          ctx.fillStyle = theme.canvasCoreOrb;
          ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
          ctx.fillStyle = "rgba(0, 243, 255, 0.5)";
        });

        // Fast scanner line sweeping the bounding box
        const scanY = (Math.sin(localTicks * 0.05) * 0.5 + 0.5) * canvas.height;
        ctx.strokeStyle = "rgba(255, 0, 255, 0.35)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(10, scanY);
        ctx.lineTo(canvas.width - 10, scanY);
        ctx.stroke();
      }

      // Scanner laser sweeping top boundary
      ctx.strokeStyle = "rgba(0, 243, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + Math.sin(localTicks * 0.03) * 6, 0, Math.PI * 2);
      ctx.stroke();

      // --- Corner HUD overlay -------------------------------------------------
      // Convert rotation refs to degree-ish readouts so the viewer sees the
      // 3D structure's live orientation rather than just abstract motion.
      const degX = ((finalAngleX * 180) / Math.PI) % 360;
      const degY = ((finalAngleY * 180) / Math.PI) % 360;
      const degZ = ((finalAngleZ * 180) / Math.PI) % 360;
      let minDepth = Infinity;
      let maxDepth = -Infinity;
      let frontMost: Point3D | null = null;
      let frontDepth = Infinity;
      projected.forEach((p) => {
        if (p.depth < minDepth) minDepth = p.depth;
        if (p.depth > maxDepth) maxDepth = p.depth;
        if (p.depth < frontDepth) {
          frontDepth = p.depth;
          frontMost = p.prj;
        }
      });

      ctx.font = "6.5px 'JetBrains Mono', monospace";
      ctx.textBaseline = "alphabetic";

      // Top-left: rotation block.
      ctx.fillStyle = "rgba(0, 243, 255, 0.55)";
      ctx.textAlign = "left";
      ctx.fillText(`ROT.X ${degX.toFixed(0).padStart(4, " ")}°`, 6, 9);
      ctx.fillText(`ROT.Y ${degY.toFixed(0).padStart(4, " ")}°`, 6, 17);
      ctx.fillText(`ROT.Z ${degZ.toFixed(0).padStart(4, " ")}°`, 6, 25);

      // Top-right: structural counts.
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255, 0, 255, 0.65)";
      ctx.fillText(`NODES ${NODES_3D.length.toString().padStart(2, " ")}`, canvas.width - 6, 9);
      ctx.fillStyle = "rgba(0, 243, 255, 0.55)";
      ctx.fillText(`EDGES 12`, canvas.width - 6, 17);
      ctx.fillText(`MODE  ${modelMode}`, canvas.width - 6, 25);

      // Bottom-left: depth range.
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0, 243, 255, 0.5)";
      ctx.fillText(
        `DEPTH ${Math.round(minDepth).toString().padStart(4, " ")} ..${Math.round(maxDepth).toString().padStart(4, " ")}`,
        6,
        canvas.height - 16
      );
      if (frontMost && (frontMost as Point3D).label) {
        ctx.fillStyle = "rgba(255, 0, 255, 0.6)";
        ctx.fillText(`FRONT [${(frontMost as Point3D).label}]`, 6, canvas.height - 7);
      }

      // Bottom-right: mode-specific HUD readout (overrides the static
      // SENSOR_LOCK string from the JSX overlay with something live).
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(0, 243, 255, 0.55)";
      if (modelMode === "NEURAL") {
        const stress = (60 + Math.sin(localTicks * 0.04) * 14).toFixed(1);
        ctx.fillText(`STRESS ${stress} kPa`, canvas.width - 6, canvas.height - 16);
        ctx.fillStyle = "rgba(16, 185, 129, 0.85)";
        ctx.fillText(`INTEGRITY 99.${(7 + (localTicks % 3)).toString()}%`, canvas.width - 6, canvas.height - 7);
      } else if (modelMode === "ORBIT") {
        const period = (4 + Math.sin(localTicks * 0.01) * 0.5).toFixed(2);
        ctx.fillText(`PERIOD ${period}s`, canvas.width - 6, canvas.height - 16);
        ctx.fillStyle = "rgba(16, 185, 129, 0.85)";
        ctx.fillText(`ORBITS 6 LOCKED`, canvas.width - 6, canvas.height - 7);
      } else {
        const total = projected.length;
        const line = (localTicks % (total * 4)) >> 2;
        ctx.fillText(`SCAN_LINE ${line + 1}/${total}`, canvas.width - 6, canvas.height - 16);
        ctx.fillStyle = "rgba(16, 185, 129, 0.85)";
        ctx.fillText(`REG_OK`, canvas.width - 6, canvas.height - 7);
      }

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
      observer.disconnect();
    };
  }, [colorPreset, modelMode]); // mouseRef avoids continuous hooks trigger completely

  const toggleInteractiveHover = (state: boolean) => {
    mouseRef.current.isHovered = state;
    setIsHovered(state);
    if (!state) {
      mouseRef.current.targetRx = 0;
      mouseRef.current.targetRy = 0;
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => toggleInteractiveHover(true)}
      onMouseLeave={() => toggleInteractiveHover(false)}
      className={`border ${overdrive ? "border-fuchsia-500/40 shadow-[0_0_16px_rgba(255,0,255,0.12)]" : `${theme.border} ${theme.glow}`} p-3.5 rounded relative overflow-hidden bg-[#05050b]/60 flex flex-col justify-between transition-colors duration-300`}
    >
      {/* Corner Brackets */}
      <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t border-l ${theme.corners}`} />
      <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t border-r ${theme.corners}`} />
      <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l ${theme.corners}`} />
      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r ${theme.corners}`} />

      {/* Title block */}
      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 mb-2">
        <div className="flex items-center space-x-1.5">
          <Zap className={`w-3.5 h-3.5 ${theme.accent} animate-pulse shrink-0`} />
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#00f3ff]">
            SYSTEM_COGNITION_MAP // 3D
          </h3>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[8.5px]">
          <button
            onClick={() => { synth.playClick(1000, 0.04); setModelMode("NEURAL"); }}
            className={`px-1.5 py-0.5 rounded border transition-colors ${
              modelMode === "NEURAL"
                ? "bg-[#00f3ff]/20 border-[#00f3ff]/50 text-[#00f3ff]"
                : "border-cyan-500/15 text-cyan-500/40 hover:text-cyan-300"
            }`}
          >
            NEURAL
          </button>
          <button
            onClick={() => { synth.playClick(1000, 0.04); setModelMode("ORBIT"); }}
            className={`px-1.5 py-0.5 rounded border transition-colors ${
              modelMode === "ORBIT"
                ? "bg-[#00f3ff]/20 border-[#00f3ff]/50 text-[#00f3ff]"
                : "border-cyan-500/15 text-cyan-500/40 hover:text-cyan-300"
            }`}
          >
            ORBIT
          </button>
          <button
            onClick={() => { synth.playClick(1000, 0.04); setModelMode("MATRIX"); }}
            className={`px-1.5 py-0.5 rounded border transition-colors ${
              modelMode === "MATRIX"
                ? "bg-[#00f3ff]/20 border-[#00f3ff]/50 text-[#00f3ff]"
                : "border-cyan-500/15 text-cyan-500/40 hover:text-cyan-300"
            }`}
          >
            MATRIX
          </button>
        </div>
      </div>

      {/* Interactive 3D Canvas element. The canvas itself now paints its
          own corner HUDs (ROT/NODES/DEPTH/MODE), so the JSX overlays only
          render the centred hover-state badge to avoid collisions. */}
      <div className="relative border border-cyan-500/5 bg-black/35 rounded overflow-hidden cursor-crosshair">
        <canvas ref={canvasRef} className="w-full block" />
        <div className="absolute top-1 left-1/2 -translate-x-1/2 font-mono text-[7px] text-fuchsia-400/55 uppercase tracking-widest animate-pulse pointer-events-none">
          {isHovered ? "[DAMPENING_TORQUE / INTERACTIVE]" : "[AUTONOMOUS_ORBIT / IDLE]"}
        </div>
      </div>

      {/* Understory telemetry strip: three live readouts driven by the
          frameTicks counter so the bottom bar reads as real instrumentation
          instead of static placeholder text. */}
      <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[7.5px] uppercase">
        <div className="px-1.5 py-1 border border-cyan-500/10 rounded bg-neutral-950/55 flex flex-col">
          <span className="text-cyan-500/40 flex items-center gap-1">
            <Shield className="w-2 h-2 text-fuchsia-500/70" />
            CORE_VECTOR
          </span>
          <span className="text-cyan-300 font-bold tracking-wider truncate">
            cos_x / sin_y
          </span>
        </div>
        <div className="px-1.5 py-1 border border-cyan-500/10 rounded bg-neutral-950/55 flex flex-col">
          <span className="text-cyan-500/40 flex items-center gap-1">
            <Maximize2 className="w-2 h-2 text-fuchsia-500/70" />
            HZ_LOCK
          </span>
          <span className="text-cyan-300 font-bold tracking-wider">
            {(60 + Math.sin(frameTicks * 0.01) * 2).toFixed(1)} hz
          </span>
        </div>
        <div className="px-1.5 py-1 border border-cyan-500/10 rounded bg-neutral-950/55 flex flex-col">
          <span className="text-cyan-500/40">STABILITY</span>
          <span className={`font-bold tracking-wider ${isHovered ? "text-fuchsia-300 animate-pulse" : "text-emerald-300"}`}>
            {isHovered ? "MANIPULATING" : "LOCKED"}
          </span>
        </div>
      </div>
    </div>
  );
}
