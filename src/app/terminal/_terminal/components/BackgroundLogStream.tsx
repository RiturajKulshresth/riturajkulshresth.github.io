/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useOverdrive } from "../contexts/OverdriveContext";

interface BackgroundLogStreamProps {
  colorPreset?: "GREEN" | "AMBER" | "COSMIC";
}

const ri = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const rf = (lo: number, hi: number, decimals = 1) =>
  (Math.random() * (hi - lo) + lo).toFixed(decimals);

// Self-contained log fragments so this ambient layer stays decoupled from the
// foreground telemetry feed in App.tsx. The vocabulary still references the real
// stack (AEGIS, Gemini, OpenSearch, raymarch, Bayer dither) so the wall of text
// reads as if it is genuinely streaming from this system.
const PREFIXES = ["SYS", "QNT", "NET", "SEC", "COG", "TLM", "GPU", "AEGIS"];

const FRAGMENTS = [
  () => `GC SWEEP DEALLOCATED ~${ri(4, 48)}MB FROM HEAP`,
  () => `RAYMARCH STEP COUNT CAPPED @ ${ri(48, 96)}`,
  () => `BAYER DITHER MATRIX REGENERATED`,
  () => `WEBSOCKET HEARTBEAT / RTT ${ri(6, 48)}ms`,
  () => `GEMINI 2.5 FLASH: ${ri(96, 184)} tok/s`,
  () => `RAG RETRIEVAL: ${ri(3, 12)} chunks > ${rf(0.72, 0.92, 2)} cos`,
  () => `TLS 1.3 HANDSHAKE OK / AES_256_GCM`,
  () => `CACHE WARMUP ${ri(40, 240)}/${ri(240, 480)} SEG`,
  () => `FRAME BUDGET ${rf(8.0, 16.7)}ms / 60fps LOCKED`,
  () => `EMBEDDING BATCH (${ri(40, 420)} docs) -> daisy-prod`,
  () => `SBOM ATTESTED / ${ri(380, 612)} PKGS`,
  () => `CPU OSC ${ri(28, 92)}% / NET ${rf(8, 96)}GB/s`,
  () => `ATTRACTOR LATTICE REPHASED`,
  () => `FRAG NOISE SEED -> 0x${ri(0x1000, 0xffff).toString(16).toUpperCase()}`,
  () => `INGRESS GET /api/sessions 200 (${ri(18, 142)}ms)`,
  () => `TOKEN VAULT UNSEALED / ${ri(8, 24)} SECRETS`,
  () => `QUANTIZATION DRIFT < ${rf(0.0005, 0.004, 4)}`,
  () => `WORKER POOL SCALED TO ${ri(4, 16)} THREADS`,
  () => `GPU TEMP STABLE @ ${ri(48, 72)}C`,
  () => `LATENCY P99 ${ri(80, 240)}ms / WITHIN SLO`,
  () => `KNOWLEDGE HUB SYNC: jira/confluence/s3 OK`,
  () => `BLOCH SPHERE PRECESSION TRACE LOCKED`,
  () => `EVENT LOOP TICK BUDGET ${rf(0.4, 2.1)}ms`,
  () => `CDN HIT RATE ${ri(82, 99)}% / 60s WINDOW`
];

// Theme accent as an "r, g, b" triple so individual lines can vary their alpha.
const COLOR_RGB: Record<string, string> = {
  GREEN: "52, 211, 153",
  AMBER: "251, 191, 36",
  COSMIC: "0, 243, 255"
};

const pad2 = (n: number) => n.toString().padStart(2, "0");

const makeLine = () => {
  const ts = `${pad2(ri(0, 23))}:${pad2(ri(0, 59))}:${pad2(ri(0, 59))}`;
  const tag = PREFIXES[ri(0, PREFIXES.length - 1)];
  const frag = FRAGMENTS[ri(0, FRAGMENTS.length - 1)]();
  return `${ts} [${tag}] ${frag}`;
};

// A single column types one log line at a time, character by character, then
// commits it and starts the next, exactly like tailing a live console. Older
// lines stack upward and clip out under the top vignette. Driven by recursive
// setTimeout (not CSS) so the cadence is genuinely "typed" rather than scrolled.
interface LogColumnProps {
  rgb: string;
  charMs: number;
  maxLines: number;
}

function LogColumn({ rgb, charMs, maxLines }: LogColumnProps) {
  // Seed with a full screen of history so the column reads as an already-running
  // log the instant it mounts, instead of an empty box that fills over a minute.
  const [lines, setLines] = useState<Array<{ text: string; alpha: number }>>(() =>
    Array.from({ length: maxLines }, () => ({
      text: makeLine(),
      alpha: 0.3 + Math.random() * 0.55
    }))
  );
  const [current, setCurrent] = useState("");

  const targetRef = useRef(makeLine());
  const idxRef = useRef(0);

  // Read overdrive speed live without restarting the timer loop.
  const { speedMul } = useOverdrive();
  const speedRef = useRef(speedMul);
  useEffect(() => { speedRef.current = speedMul; }, [speedMul]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const target = targetRef.current;
      idxRef.current += 1;
      setCurrent(target.slice(0, idxRef.current));

      if (idxRef.current >= target.length) {
        // Line finished: commit it, then pause briefly before the next one.
        setLines((prev) => {
          const next = [...prev, { text: target, alpha: 0.3 + Math.random() * 0.55 }];
          if (next.length > maxLines) next.shift();
          return next;
        });
        setCurrent("");
        idxRef.current = 0;
        targetRef.current = makeLine();
        const pause = (260 + Math.random() * 520) / Math.max(speedRef.current, 0.001);
        timer = setTimeout(tick, pause);
      } else {
        // Slight per-char jitter makes the typing feel organic, not metronomic.
        const jitter = charMs * (0.6 + Math.random() * 0.8);
        timer = setTimeout(tick, jitter / Math.max(speedRef.current, 0.001));
      }
    };

    timer = setTimeout(tick, Math.random() * 1200);
    return () => clearTimeout(timer);
  }, [charMs, maxLines]);

  return (
    <div className="bg-log-col flex-1 h-full flex flex-col justify-end">
      {lines.map((line, i) => (
        <div
          key={i}
          className="text-[10px] leading-5 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ color: `rgba(${rgb}, ${line.alpha})` }}
        >
          {line.text}
        </div>
      ))}
      <div
        className="text-[10px] leading-5 tracking-tight whitespace-nowrap overflow-hidden"
        style={{ color: `rgba(${rgb}, 0.9)` }}
      >
        {current}
        <span className="bg-log-caret" style={{ background: `rgba(${rgb}, 0.9)` }} />
      </div>
    </div>
  );
}

export default function BackgroundLogStream({ colorPreset = "COSMIC" }: BackgroundLogStreamProps) {
  const rgb = COLOR_RGB[colorPreset] || COLOR_RGB.COSMIC;

  // Each column types at a slightly different cadence so they never sync up.
  const columns = [
    { charMs: 34, cls: "" },
    { charMs: 46, cls: "hidden sm:flex" },
    { charMs: 30, cls: "hidden md:flex" },
    { charMs: 40, cls: "hidden lg:flex" }
  ];

  return (
    <div
      className="bg-log-stream fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex justify-between gap-6 px-4 pt-3 pb-24">
        {columns.map((col, ci) => (
          <div key={ci} className={`flex-1 h-full ${col.cls}`}>
            <LogColumn rgb={rgb} charMs={col.charMs} maxLines={80} />
          </div>
        ))}
      </div>
      {/* Top/bottom fade so the stream dissolves into the void instead of
          hard-cutting at the viewport edges. */}
      <div className="bg-log-vignette absolute inset-0" />
    </div>
  );
}
