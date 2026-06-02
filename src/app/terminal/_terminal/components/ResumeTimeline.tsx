/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { synth } from "../audio";
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  TrendingDown, 
  ShieldCheck, 
  CheckCircle, 
  Server, 
  Database,
  ArrowRight,
  TrendingUp,
  LineChart,
  Lock,
  ShieldAlert
} from "lucide-react";

interface TimelineProps {
  colorPreset: "GREEN" | "AMBER" | "COSMIC";
}

export default function ResumeTimeline({ colorPreset }: TimelineProps) {
  const [activeTab, setActiveTab] = useState<"WBD" | "DELOITTE" | "OYO" | "ACADEMICS" | "ACCOLADES">("WBD");
  const [activeWbdSub, setActiveWbdSub] = useState<"ACME" | "KNOWLEDGE" | "DAISY">("ACME");
  const [activeDeloitteSub, setActiveDeloitteSub] = useState<"OUTLOOK" | "ARCHIVAL" | "OPS">("OUTLOOK");

  const getThemeClasses = () => {
    switch (colorPreset) {
      case "GREEN":
        return {
          text: "text-emerald-400",
          textLight: "text-emerald-200",
          textDark: "text-emerald-600/80",
          border: "border-emerald-500/20",
          borderActive: "border-emerald-400",
          bg: "bg-emerald-950/20",
          bgMuted: "bg-emerald-950/10",
          accentLine: "bg-emerald-500/30",
          glow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
          glowText: "shadow-[0_0_8px_rgba(16,185,129,0.4)]",
          bullet: "bg-emerald-500",
          fill: "bg-emerald-500",
          buttonActive: "bg-emerald-950/60 border-emerald-400 text-emerald-300",
          buttonInactive: "border-emerald-800/30 text-emerald-500/70 hover:border-emerald-500/50 hover:text-emerald-400"
        };
      case "AMBER":
        return {
          text: "text-amber-500",
          textLight: "text-amber-200",
          textDark: "text-amber-700/80",
          border: "border-amber-500/25",
          borderActive: "border-amber-500",
          bg: "bg-amber-950/20",
          bgMuted: "bg-amber-950/10",
          accentLine: "bg-amber-500/30",
          glow: "shadow-[0_0_12px_rgba(245,158,11,0.15)]",
          glowText: "shadow-[0_0_8px_rgba(245,158,11,0.4)]",
          bullet: "bg-amber-500",
          fill: "bg-amber-500",
          buttonActive: "bg-amber-950/60 border-amber-500 text-amber-400",
          buttonInactive: "border-amber-900/40 text-amber-600/70 hover:border-amber-500/50 hover:text-amber-400"
        };
      case "COSMIC":
      default:
        return {
          text: "text-[#00f3ff]",
          textLight: "text-cyan-200",
          textDark: "text-cyan-600/70",
          border: "border-cyan-500/20",
          borderActive: "border-cyan-400",
          bg: "bg-cyan-950/20",
          bgMuted: "bg-[#05050b]/40",
          accentLine: "bg-cyan-500/30",
          glow: "shadow-[0_0_15px_rgba(0,243,255,0.05)]",
          glowText: "shadow-[0_0_8px_rgba(0,243,255,0.3)]",
          bullet: "bg-[#00f3ff]",
          fill: "bg-cyan-500",
          buttonActive: "bg-cyan-950/40 border-cyan-400 text-[#00f3ff]",
          buttonInactive: "border-cyan-950/20 text-cyan-500/60 hover:border-cyan-400/40 hover:text-cyan-300"
        };
    }
  };

  const themeCtx = getThemeClasses();

  const playClick = () => {
    synth.playClick(750, 0.04);
  };

  return (
    <div className={`quantum-card border ${themeCtx.border} p-5 rounded relative overflow-hidden backdrop-blur-md ${themeCtx.glow} transition-colors duration-300`}>
      {/* Structural corners */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${themeCtx.borderActive}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${themeCtx.borderActive}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${themeCtx.borderActive}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${themeCtx.borderActive}`} />

      {/* Header telemetry bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b ${themeCtx.border} pb-3.5 mb-4 gap-2`}>
        <div className="flex items-center space-x-2">
          <Briefcase className="w-4 h-4 text-fuchsia-500" />
          <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${themeCtx.text}`}>
            [CAREER_TIMELINE_DISPATCH]
          </h2>
        </div>
        <span className="font-mono text-[9px] text-fuchsia-500/70 animate-pulse">
          STATUS: VERIFIED SECURE RESUME_INDEX
        </span>
      </div>

      {/* Main navigation ledger buttons */}
      <div className="flex flex-wrap gap-2 border-b border-cyan-500/10 pb-4 mb-4">
        {(["WBD", "DELOITTE", "OYO", "ACADEMICS", "ACCOLADES"] as const).map((tab) => {
          const isSelected = activeTab === tab;
          let label = "";
          if (tab === "WBD") label = "WARNER BROS. DISCOVERY";
          else if (tab === "DELOITTE") label = "DELOITTE CONS.";
          else if (tab === "OYO") label = "OYO (INTERN)";
          else if (tab === "ACADEMICS") label = "ACADEMICS (IIT J.)";
          else label = "ACCOLADES & HONORS";

          return (
            <button
              key={tab}
              onClick={() => {
                playClick();
                setActiveTab(tab);
              }}
              className={`px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase border rounded pointer-events-auto cursor-pointer transition-all duration-300 ${
                isSelected ? themeCtx.buttonActive : themeCtx.buttonInactive
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Panel Contents */}
      <div className="space-y-4">
        {/* TAB 1: WARNER BROS. DISCOVERY CARD */}
        {activeTab === "WBD" && (
          <div className="animate-fade-in space-y-4">
            {/* Header company spec */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 border ${themeCtx.border} rounded-sm ${themeCtx.bg}`}>
              <div>
                <span className="font-mono text-[9px] text-fuchsia-400 block tracking-wider uppercase font-black">ACTIVE POSITION // APPORTIONED STAFF</span>
                <h3 className="font-mono text-sm font-bold text-white uppercase mt-0.5">
                  Software Development Engineer 2 (AI Platforms)
                </h3>
                <p className="font-mono text-xxs text-cyan-400/70 mt-1 uppercase">
                  Warner Bros. Discovery &bull; Hyderabad, India &bull; Nov 2024 - Present
                </p>
              </div>
              <div className="mt-2 md:mt-0 px-2 py-1 border border-cyan-500/20 bg-black/40 rounded text-center md:text-right shrink-0">
                <span className="font-mono text-[9px] text-[#00f3ff]/40 uppercase block">TEAM LOAD:</span>
                <span className="font-mono text-[11.5px] text-cyan-300 font-bold uppercase tracking-wider">&lt;11+ TEAMS INTR.S&gt;</span>
              </div>
            </div>

            {/* Core RAG & Agent Platforms switch tabs */}
            <div className="grid grid-cols-3 gap-2">
              {(["ACME", "KNOWLEDGE", "DAISY"] as const).map((wSub) => {
                const isSelected = activeWbdSub === wSub;
                let title = "";
                let tag = "";
                if (wSub === "ACME") {
                  title = "ACME Agent System";
                  tag = "AUTH & SECURITY";
                } else if (wSub === "KNOWLEDGE") {
                  title = "Knowledge Hub";
                  tag = "RAG ENGINE";
                } else {
                  title = "Daisy Platforms";
                  tag = "MULTI-AGENT";
                }

                return (
                  <button
                    key={wSub}
                    onClick={() => {
                      playClick();
                      setActiveWbdSub(wSub);
                    }}
                    className={`p-2 border rounded-sm font-mono text-left cursor-pointer transition-all duration-300 pointer-events-auto ${
                      isSelected 
                        ? `${themeCtx.borderActive} bg-cyan-950/30 text-white shadow-[0_0_8px_rgba(0,243,255,0.06)]` 
                        : `${themeCtx.border} hover:border-[#00f3ff]/40 bg-neutral-900/30 text-cyan-500/60`
                    }`}
                  >
                    <span className="text-[8px] opacity-40 uppercase block tracking-wider">{tag}</span>
                    <span className="text-[10px] font-bold block truncate">{title}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-tab details */}
            <div className="p-4 border border-cyan-500/10 rounded-sm bg-neutral-950/60 space-y-3.5">
              {activeWbdSub === "ACME" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-[#00f3ff] uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-cyan-500 shrink-0" />
                      ACME: Agent Core for Managed Execution
                    </h4>
                    <p className="font-mono text-[11px] text-cyan-200/90 leading-relaxed mt-1">
                      Designed and launched the entire credentials security and authorization architecture for ACME, implementing a strict <strong>four-resource authorization hierarchy</strong> (Team, App, Agent, Sub-agent) with split permissions models.
                    </p>
                  </div>

                  <ul className="space-y-2 text-[10.5px] font-mono text-cyan-300">
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Rigorous Safety Core:</strong> Built cross-team call models where only the immediate caller’s verified passport identity propagates through multi-agent orchestration hooks, making sub-agent execution completely modular and secure by design.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Interactive Playground Console:</strong> Shipped ACME Playground, an interactive staging interface where teams prompt-test configuration parameters, audit granular tool calls, trace stream tokens, and validate chains.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>State Register Lifecycle:</strong> Refactored legacy agent configurations off flat YAML matrices into dynamic PostgreSQL (JSONB) registry databases with state indicators (Draft, Published, Archived) and dual runtime environments.</span>
                    </li>
                  </ul>

                  {/* Interactivity: Holographic SAST Hardening telemetry visualization */}
                  <div className="p-3 border border-fuchsia-500/20 rounded bg-fuchsia-950/10 flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div>
                      <span className="font-mono text-[9px] text-fuchsia-400 font-bold block uppercase tracking-wider">
                        SECURE SHIELD AUDIT: SAST SAST_CLEANSE PASS:
                      </span>
                      <p className="font-mono text-xxs text-cyan-400 mt-0.5 uppercase">
                        Drove codebase from high/critical vulnerabilities down to absolute zero in a single sprint.
                      </p>
                    </div>

                    <div className="flex items-center space-x-6 shrink-0">
                      <div className="text-center font-mono">
                        <div className="text-[8px] text-cyan-500/40 uppercase">INITIAL</div>
                        <div className="text-sm text-fuchsia-500 font-bold tracking-tight">CRITICAL</div>
                      </div>
                      <div className="text-cyan-500/40 font-mono text-xs animate-pulse font-black">&gt;&gt;&gt;</div>
                      <div className="text-center font-mono">
                        <div className="text-[8px] text-cyan-500/40 uppercase">RELEASE POSTURE</div>
                        <div className="text-sm text-[#00f3ff] font-extrabold flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          <span>0 VERIFIED</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <RedactedBriefing
                    title="INTERNAL HARDENING LOG"
                    subject="Threat model notes, finding-by-finding fix ledgers, and internal RFC review threads for ACME's identity layer cannot be reproduced on a public channel."
                    lines={2}
                  />
                </div>
              )}

              {activeWbdSub === "KNOWLEDGE" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-[#00f3ff] uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-cyan-500 shrink-0" />
                      Knowledge Hub: Enterprise RAG-as-a-Service
                    </h4>
                    <p className="font-mono text-[11px] text-cyan-200/90 leading-relaxed mt-1">
                      Architected and coded Knowledge Hub end-to-end: a high-throughput, self-serve RAG document search/retrieval service built on AWS OpenSearch, enabling teams to index document catalogues across shared ecosystems.
                    </p>
                  </div>

                  <ul className="space-y-2 text-[10.5px] font-mono text-cyan-300">
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Multi-Source Pipeline:</strong> Authored unified connectors scraping Jira, Confluence, S3, GitHub, Airflow execution logs, and arbitrary file indices, utilizing bulk uploading routines with modular chunk sizing.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Semantic Fragment Splitter:</strong> Pioneered semantic chunking algorithms to partition documents elegantly on contextual threshold transitions rather than rigid character indices.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Multimodal Integrations:</strong> Deployed AWS Bedrock Titan & Claude embeddings plus hyperspectral analysis over diagrams, blueprint layouts, and scanned PDFs.</span>
                    </li>
                  </ul>

                  {/* Architecture Diagram badge */}
                  <div className="flex justify-between items-center bg-cyan-950/20 px-3 py-2 border border-cyan-500/15 rounded-sm">
                    <div className="flex items-center space-x-2">
                      <Database className="w-3.5 h-3.5 text-fuchsia-500" />
                      <span className="font-mono text-[10px] text-[#00f3ff] font-bold">AWS OPENSEARCH INDICES:</span>
                    </div>
                    <span className="font-mono text-[10px] text-cyan-300 bg-cyan-900/40 px-1.5 py-0.2 rounded border border-cyan-500/30">
                      CROSS-TEAM REUSE ENABLED
                    </span>
                  </div>

                  <RedactedBriefing
                    title="INDEX CATALOGUE"
                    subject="Specific tenant onboarding orders, indexed corpora, embedding budgets, and source-system credentials for Knowledge Hub are scoped to internal-only channels."
                    lines={3}
                  />
                </div>
              )}

              {activeWbdSub === "DAISY" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-[#00f3ff] uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-cyan-500 shrink-0" />
                      Daisy: Data Analytics Multi-Agent AI App
                    </h4>
                    <p className="font-mono text-[11px] text-cyan-200/90 leading-relaxed mt-1">
                      Spearheaded the development of Daisy, an internal multi-agent AI interface used daily by 11+ product and business teams containing modular SQL/Text querying systems via FastAPI and LangChain.
                    </p>
                  </div>

                  <ul className="space-y-2 text-[10.5px] font-mono text-cyan-300">
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Stochastic Quality Guardgates:</strong> Set up algorithmic model assessment frameworks using DeepEval and tailored telemetry indexes to measure prompt drift, climbing overall correctness by 27%.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Memory Compression Engine:</strong> Cut persistent chat storage footprints by 66% through aggressive telemetry log optimization in Vercel AI SDK structures.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Visualisation Layer:</strong> Added chart generation from Databricks and Snowflake datasets so chatbots produce inline plots, not just tables.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Notebook Ingestion:</strong> Enabled .ipynb notebook ingestion into Knowledge Hub so internal documentation written in Jupyter is searchable alongside the rest of the corpus.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Zero-Downtime Migration:</strong> Led the platform's lift from the legacy Discovery AWS account onto the org's standardised IaC AWS accounts during the org split, with zero downtime across all environments. Authored architecture docs (Evaluation Platform, Daisy Vector DB API) published org-wide; ran code reviews for a 7-engineer team.</span>
                    </li>
                  </ul>

                  {/* ENHANCEMENT: Cost Savings Visual Telemetry */}
                  <div className="p-3 border border-emerald-500/25 bg-emerald-950/15 rounded space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        CLOUDFRONT / AWS METRIC SPEND REPORT [-~70% BUDGET OVERHEAD]:
                      </span>
                      <span className="text-emerald-300 font-bold font-mono">OPTIMIZED</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-1 font-mono text-[10px]">
                      <div className="p-2 border border-emerald-500/10 rounded-sm bg-neutral-900/50">
                        <div className="text-cyan-500/60 uppercase text-[8px]">DEV / INT / STG</div>
                        <div className="flex items-baseline space-x-1.5 mt-1">
                          <span className="line-through text-red-400/70">~$700</span>
                          <span className="text-white font-bold">&gt;&gt;</span>
                          <span className="text-emerald-400 font-extrabold text-sm font-sans">~$200</span>
                        </div>
                      </div>

                      <div className="p-2 border border-emerald-500/10 rounded-sm bg-neutral-900/50">
                        <div className="text-cyan-500/60 uppercase text-[8px]">PROD CONTAINER</div>
                        <div className="flex items-baseline space-x-1.5 mt-1">
                          <span className="line-through text-red-400/70">~$1000</span>
                          <span className="text-white font-bold">&gt;&gt;</span>
                          <span className="text-emerald-400 font-extrabold text-sm font-sans">~$800</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DELOITTE */}
        {activeTab === "DELOITTE" && (
          <div className="animate-fade-in space-y-4">
            {/* Header company spec */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 border ${themeCtx.border} rounded-sm ${themeCtx.bg}`}>
              <div>
                <span className="font-mono text-[9px] text-fuchsia-400 block tracking-wider uppercase font-black">PREVIOUS ENGAGEMENT // ANALYST</span>
                <h3 className="font-mono text-sm font-bold text-white uppercase mt-0.5">
                  Software Engineer (Analyst)
                </h3>
                <p className="font-mono text-xxs text-cyan-400/70 mt-1 uppercase">
                  Deloitte &bull; Hyderabad, India &bull; July 2022 - Nov 2024
                </p>
              </div>
              <div className="mt-2 md:mt-0 px-2 py-1 border border-cyan-500/20 bg-black/40 rounded text-center md:text-right shrink-0">
                <span className="font-mono text-[9px] text-[#00f3ff]/40 uppercase block">CLIENT SCOPE:</span>
                <span className="font-mono text-[11.5px] text-cyan-300 font-bold uppercase tracking-wider">&lt;ENTERPRISE_DOC FLOW&gt;</span>
              </div>
            </div>

            {/* Deloitte sub-tab switcher (mirrors the WBD ACME/Knowledge/Daisy pattern) */}
            <div className="grid grid-cols-3 gap-2">
              {(["OUTLOOK", "ARCHIVAL", "OPS"] as const).map((dSub) => {
                const isSelected = activeDeloitteSub === dSub;
                let title = "";
                let tag = "";
                if (dSub === "OUTLOOK") {
                  title = "S2SACC + S2EDS";
                  tag = "OUTLOOK FLEET";
                } else if (dSub === "ARCHIVAL") {
                  title = "Doc Archival + Migrations";
                  tag = "BACKEND + DATA";
                } else {
                  title = "Platform Ops + Upgrades";
                  tag = "OPENTEXT + SYSTEMWARE";
                }

                return (
                  <button
                    key={dSub}
                    onClick={() => {
                      playClick();
                      setActiveDeloitteSub(dSub);
                    }}
                    className={`p-2 border rounded-sm font-mono text-left cursor-pointer transition-all duration-300 pointer-events-auto ${
                      isSelected
                        ? `${themeCtx.borderActive} bg-cyan-950/30 text-white shadow-[0_0_8px_rgba(0,243,255,0.06)]`
                        : `${themeCtx.border} hover:border-[#00f3ff]/40 bg-neutral-900/30 text-cyan-500/60`
                    }`}
                  >
                    <span className="text-[8px] opacity-40 uppercase block tracking-wider">{tag}</span>
                    <span className="text-[10px] font-bold block truncate">{title}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-tab details */}
            <div className="p-4 border border-cyan-500/10 rounded-sm bg-neutral-950/60 space-y-3.5">
              {activeDeloitteSub === "OUTLOOK" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-[#00f3ff] uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-cyan-500 shrink-0" />
                      Outlook Add-In Fleet: S2SACC and S2EDS
                    </h4>
                    <p className="font-mono text-[11px] text-cyan-200/90 leading-relaxed mt-1">
                      Two Microsoft Outlook add-ins moving documents straight from the inbox into enterprise archival, both built on Yeoman scaffolding and shipped to thousands of users.
                    </p>
                  </div>

                  <ul className="space-y-2 text-[10.5px] font-mono text-cyan-300">
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>S2SACC Document Vault:</strong> Yeoman add-in using MS Graph API to process attachments, with strict distribution-group security configurations. Empowered <strong>1000+ active enterprise participants</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>S2EDS Outlook Node:</strong> ReactJS extension on Yeoman scaffolding, serving <strong>500+ users</strong> for high-velocity transfer routines into enterprise servers.</span>
                    </li>
                  </ul>

                  {/* Adoption telemetry */}
                  <div className="p-3 border border-cyan-500/15 rounded bg-cyan-950/15 flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div>
                      <span className="font-mono text-[9px] text-fuchsia-400 font-bold block uppercase tracking-wider">
                        DEPLOYED FOOTPRINT // ENTERPRISE ROLLOUT:
                      </span>
                      <p className="font-mono text-xxs text-cyan-400 mt-0.5 uppercase">
                        Two add-ins running in production across distribution-group secured environments.
                      </p>
                    </div>
                    <div className="flex items-center space-x-6 shrink-0">
                      <div className="text-center font-mono">
                        <div className="text-[8px] text-cyan-500/40 uppercase">S2SACC</div>
                        <div className="text-sm text-[#00f3ff] font-extrabold">1000+ USERS</div>
                      </div>
                      <div className="text-cyan-500/40 font-mono text-xs animate-pulse font-black">&gt;&gt;&gt;</div>
                      <div className="text-center font-mono">
                        <div className="text-[8px] text-cyan-500/40 uppercase">S2EDS</div>
                        <div className="text-sm text-[#00f3ff] font-extrabold">500+ USERS</div>
                      </div>
                    </div>
                  </div>

                  <RedactedBriefing
                    title="DEPLOYMENT REGISTRY"
                    subject="Client tenant identifiers, distribution-group rosters, and per-environment Graph API permission grants for the Outlook fleet are NDA-sealed."
                    lines={2}
                  />
                </div>
              )}

              {activeDeloitteSub === "ARCHIVAL" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-[#00f3ff] uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-cyan-500 shrink-0" />
                      Document Archival + Backend Migrations
                    </h4>
                    <p className="font-mono text-[11px] text-cyan-200/90 leading-relaxed mt-1">
                      Pushed the archival backend off legacy ESB onto serverless, kept four critical Java apps healthy, shipped the DocuEdge capture UI, and ran a large mainframe document migration.
                    </p>
                  </div>

                  <ul className="space-y-2 text-[10.5px] font-mono text-cyan-300">
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Serverless Migration:</strong> Migrated legacy Mule ESB flows onto serverless <strong>AWS Lambda</strong> arrays, significantly trimming compute overheads on the Document Archival system.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Java Maintenance:</strong> Maintained, optimised, and compiled codebases for <strong>4 critical Java applications</strong> keeping core business operations running.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>DocuEdge Capture UI:</strong> Built the Document Upload interface of the DocuEdge Archiving Solution using AngularJS and Syncfusion, in production at <strong>2 client organisations</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>Mainframe Migration:</strong> Authored <strong>70+ scripts</strong> using JCL on z/OS to securely migrate and restore <strong>4000+ documents</strong> from Mobius to SystemWare ContentCloud.</span>
                    </li>
                  </ul>

                  {/* Migration scale telemetry */}
                  <div className="p-3 border border-emerald-500/25 bg-emerald-950/15 rounded space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        DOC MIGRATION VOLUME // MAINFRAME &gt;&gt; CONTENTCLOUD:
                      </span>
                      <span className="text-emerald-300 font-bold font-mono">RESTORED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-1 font-mono text-[10px]">
                      <div className="p-2 border border-emerald-500/10 rounded-sm bg-neutral-900/50">
                        <div className="text-cyan-500/60 uppercase text-[8px]">JCL SCRIPTS</div>
                        <div className="text-emerald-400 font-extrabold text-sm mt-1">70+</div>
                      </div>
                      <div className="p-2 border border-emerald-500/10 rounded-sm bg-neutral-900/50">
                        <div className="text-cyan-500/60 uppercase text-[8px]">DOCUMENTS RESTORED</div>
                        <div className="text-emerald-400 font-extrabold text-sm mt-1">4000+</div>
                      </div>
                    </div>
                  </div>

                  <RedactedBriefing
                    title="CLIENT MIGRATION ROSTER"
                    subject="Client identities, document classes, and per-batch reconciliation logs from the Mobius to ContentCloud migration cannot be disclosed externally."
                    lines={1}
                  />
                </div>
              )}

              {activeDeloitteSub === "OPS" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-[#00f3ff] uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-cyan-500 shrink-0" />
                      Platform Operations and Upgrades
                    </h4>
                    <p className="font-mono text-[11px] text-cyan-200/90 leading-relaxed mt-1">
                      Led an OpenText upgrade across the client landscape and automated SystemWare daily health checks to recover engineering hours every month.
                    </p>
                  </div>

                  <ul className="space-y-2 text-[10.5px] font-mono text-cyan-300">
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>OpenText Upgrade Programme:</strong> Led the upgrade of the client's OpenText landscape, playing a pivotal role in the enhancement of <strong>10 servers</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                      <span><strong>SystemWare Health Automation:</strong> Automated daily health-check procedures in the SystemWare environment using PowerShell and mainframe scripting, saving the team <strong>~15 hours per month</strong>.</span>
                    </li>
                  </ul>

                  {/* Ops impact telemetry */}
                  <div className="p-3 border border-emerald-500/25 bg-emerald-950/15 rounded space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        OPS RECLAMATION // TIME RETURNED TO THE TEAM:
                      </span>
                      <span className="text-emerald-300 font-bold font-mono">RECOVERED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-1 font-mono text-[10px]">
                      <div className="p-2 border border-emerald-500/10 rounded-sm bg-neutral-900/50">
                        <div className="text-cyan-500/60 uppercase text-[8px]">OPENTEXT SERVERS</div>
                        <div className="text-emerald-400 font-extrabold text-sm mt-1">10 UPGRADED</div>
                      </div>
                      <div className="p-2 border border-emerald-500/10 rounded-sm bg-neutral-900/50">
                        <div className="text-cyan-500/60 uppercase text-[8px]">SYSTEMWARE</div>
                        <div className="text-emerald-400 font-extrabold text-sm mt-1">~15 H / MONTH</div>
                      </div>
                    </div>
                  </div>

                  <RedactedBriefing
                    title="OPS RUNBOOK"
                    subject="OpenText server inventories, upgrade change tickets, and SystemWare health-check playbooks live in the client's internal ops vault."
                    lines={2}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: OYO (INTERNSHIP) */}
        {activeTab === "OYO" && (
          <div className="animate-fade-in space-y-4">
            {/* Header company spec */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 border ${themeCtx.border} rounded-sm ${themeCtx.bg}`}>
              <div>
                <span className="font-mono text-[9px] text-fuchsia-400 block tracking-wider uppercase font-black">PRIOR ENGAGEMENT // INTERNSHIP</span>
                <h3 className="font-mono text-sm font-bold text-white uppercase mt-0.5">
                  Analyst (Intern)
                </h3>
                <p className="font-mono text-xxs text-cyan-400/70 mt-1 uppercase">
                  Oyo &bull; Gurugram, India &bull; Summer 2021
                </p>
              </div>
              <div className="mt-2 md:mt-0 px-2 py-1 border border-cyan-500/20 bg-black/40 rounded text-center md:text-right shrink-0">
                <span className="font-mono text-[9px] text-[#00f3ff]/40 uppercase block">SURFACE:</span>
                <span className="font-mono text-[11.5px] text-cyan-300 font-bold uppercase tracking-wider">&lt;ANDROID CONSUMER FLOW&gt;</span>
              </div>
            </div>

            {/* Detail panel */}
            <div className="p-4 border border-cyan-500/10 rounded-sm bg-neutral-950/60 space-y-3.5">
              <div>
                <h4 className="font-mono text-xs font-bold text-[#00f3ff] uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-cyan-500 shrink-0" />
                  Oyo Self Onboarding Platform
                </h4>
                <p className="font-mono text-[11px] text-cyan-200/90 leading-relaxed mt-1">
                  Summer engagement on Oyo's Self Onboarding platform, focused on the consumer-facing slice of the Android app.
                </p>
              </div>

              <ul className="space-y-2 text-[10.5px] font-mono text-cyan-300">
                <li className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                  <span><strong>Consumer Onboarding:</strong> Streamlined the Self Onboarding flow on the Android app, improving the user experience for new sign-ups.</span>
                </li>
                <li className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-fuchsia-500 shrink-0 mt-0.5">&bull;</span>
                  <span><strong>Android Stack:</strong> Worked inside the production consumer Android codebase, contributing alongside the platform team during the internship window.</span>
                </li>
              </ul>

              {/* Engagement footer telemetry */}
              <div className="p-3 border border-cyan-500/15 rounded bg-cyan-950/15 flex flex-col md:flex-row items-center gap-4 justify-between">
                <div>
                  <span className="font-mono text-[9px] text-fuchsia-400 font-bold block uppercase tracking-wider">
                    INTERN WINDOW // SUMMER 2021 INTAKE:
                  </span>
                  <p className="font-mono text-xxs text-cyan-400 mt-0.5 uppercase">
                    Pre-graduation engagement before joining Deloitte full-time in July 2022.
                  </p>
                </div>
                <div className="flex items-center space-x-6 shrink-0">
                  <div className="text-center font-mono">
                    <div className="text-[8px] text-cyan-500/40 uppercase">SURFACE</div>
                    <div className="text-sm text-[#00f3ff] font-extrabold">ANDROID</div>
                  </div>
                  <div className="text-cyan-500/40 font-mono text-xs animate-pulse font-black">&gt;&gt;&gt;</div>
                  <div className="text-center font-mono">
                    <div className="text-[8px] text-cyan-500/40 uppercase">SCOPE</div>
                    <div className="text-sm text-[#00f3ff] font-extrabold">ONBOARDING</div>
                  </div>
                </div>
              </div>

              <RedactedBriefing
                title="INTERN FLOW BRIEF"
                subject="Specific feature flag rollouts, A/B funnel deltas, and pull request identifiers from the Oyo internship window remain inside the company's internal repos."
                lines={3}
              />
            </div>
          </div>
        )}

        {/* TAB 4: ACADEMICS */}
        {activeTab === "ACADEMICS" && (
          <div className="animate-fade-in space-y-4">
            <div className={`p-3.5 border ${themeCtx.border} rounded-sm ${themeCtx.bg}`}>
              <span className="font-mono text-[9px] text-fuchsia-400 block tracking-wider uppercase font-black">ACADEMIC REGISTER ENTRY // IIT</span>
              <h3 className="font-mono text-sm font-bold text-white uppercase mt-0.5">
                Indian Institute of Technology, Jodhpur
              </h3>
              <p className="font-mono text-xxs text-cyan-400/70 mt-1 uppercase">
                Bachelor of Technology in Computer Science and Engineering &bull; July 2018 - June 2022
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-cyan-500/10 rounded-sm bg-[#05050b]/40 font-mono text-xs space-y-2">
                <span className="text-fuchsia-400 font-bold block uppercase text-[10px]">&gt;_ CORE COURSE STUDIES</span>
                <ul className="space-y-1 text-cyan-300 text-[10.5px]">
                  <li>&bull; Applied Operating Systems</li>
                  <li>&bull; Distributed Core Architectures</li>
                  <li>&bull; Deep Neural Networks & ConvNets</li>
                  <li>&bull; Advanced Database Management Systems</li>
                  <li>&bull; Assembly Boot & Low-Level Instruction sets</li>
                </ul>
              </div>

              <div className="p-4 border border-cyan-500/10 rounded-sm bg-[#05050b]/40 font-mono text-xs flex flex-col justify-between">
                <div>
                  <span className="text-[#00f3ff]/40 font-bold block uppercase text-[10px]">// TECHNICAL INFLUENCE</span>
                  <p className="text-cyan-200/90 text-[10.5px] mt-1.5 leading-relaxed">
                    Focused curriculum on Compiler construction, Bare-metal x86 Operating systems development, and high-performance tensor networks.
                  </p>
                </div>
                <div className="pt-3 border-t border-cyan-500/10 text-[9px] text-[#00f3ff]/50 flex justify-between items-center bg-cyan-950/20 px-2.5 py-1 rounded-sm mt-3">
                  <span>CLASS SPEC:</span>
                  <span className="text-fuchsia-400 font-black">SYSTEMS SPECIALIST</span>
                </div>
              </div>
            </div>

            <RedactedBriefing
              title="ACADEMIC PROJECT LEDGER"
              subject="Coursework projects, lab reports, thesis drafts, and grading rubrics from the IIT-J registry sit behind the institute's internal academic vault."
              lines={4}
            />
          </div>
        )}

        {/* TAB 5: ACCOLADES & HONORS */}
        {activeTab === "ACCOLADES" && (
          <div className="animate-fade-in space-y-3">
            {[
              {
                title: "KVPY SCHOLAR (Kishore Vaigyanik Protsahan Yojana)",
                provider: "Government of India &bull; 2017-2018",
                desc: "Nationally recognized fellowship program for scientific potential. Highly prestigious research award with extremely low acceptance rates."
              },
              {
                title: "WBD EXCELLENCE CORPORATE HONORS",
                provider: "Warner Bros. Discovery &bull; Active Team",
                desc: "Honored with the Excellence Award for designing, architecting, and writing the Knowledge Hub (RAG-as-a-Service) search infrastructure."
              },
              {
                title: "DELOITTE EXCELLENCE RECOGNITIONS",
                provider: "Deloitte &bull; Three Corporate Awards",
                desc: "Earned three consecutive company awards for rapid delivery of the S2SACC attachment pipeline and executing complex OpenText servers."
              }
            ].map((award, idx) => (
              <div 
                key={idx}
                className="p-3.5 border border-cyan-500/15 rounded bg-neutral-950/70 font-mono text-xs flex items-start gap-3 relative overflow-hidden"
              >
                {/* Visual marker */}
                <div className="p-1.5 bg-cyan-950/55 border border-cyan-500/20 rounded text-fuchsia-500 shrink-0 mt-0.5">
                  <Award className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-[#00f3ff] uppercase text-[11px] tracking-wide">{award.title}</h4>
                  <span className="text-[9px] text-fuchsia-400 block mt-0.5 uppercase">{award.provider}</span>
                  <p className="text-[10.5px] text-cyan-200/80 leading-relaxed mt-1.5">{award.desc}</p>
                </div>
              </div>
            ))}

            <RedactedBriefing
              title="UNLISTED CITATIONS"
              subject="Additional internal honors, spot bonuses, and named-team recognitions from active engagements are sealed under the issuing organizations' internal channels."
              lines={3}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------
// RedactedBriefing
// ------------------------------------------------------------------------
// Shorter tab + sub-tab sections (e.g. ACME, Knowledge Hub, Deloitte ops,
// Oyo, Academics, Accolades) end up much shorter than the WBD DAISY panel,
// which is the tallest in the dispatch. That makes the whole career card
// visibly snap up and down whenever the visitor switches tabs.
//
// To soften that, we tail each shorter section with a small redacted brief
// styled after `ClassifiedCard` in `ProjectGrid.tsx`: dashed fuchsia border,
// NDA stripes, blocked-out lines. `lines` controls how many redacted bullets
// to render, which is how we tune each section's added height to bring it
// closer to DAISY without making the panel feel padded with filler.
function RedactedBriefing({
  title,
  subject,
  footer = "CLEARANCE REQUIRED // INTERNAL CHANNEL ONLY",
  lines = 2,
}: {
  title: string;
  subject: string;
  footer?: string;
  lines?: number;
}) {
  const bullets = Array.from({ length: lines }, (_, i) => i);

  return (
    <div className="relative border border-dashed border-fuchsia-500/35 rounded p-3 bg-fuchsia-950/10 overflow-hidden">
      {/* Corner accents in fuchsia, matching ClassifiedCard */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-fuchsia-400" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-fuchsia-400" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-fuchsia-400" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-fuchsia-400" />

      {/* Diagonal NDA stripes */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,0,255,0.5) 0 6px, transparent 6px 14px)",
        }}
      />

      {/* Header strip */}
      <div className="relative flex items-center justify-between border-b border-fuchsia-500/20 pb-2 mb-2">
        <span className="font-mono text-[9px] text-fuchsia-300/80 tracking-wider uppercase flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-fuchsia-400 shrink-0" />
          {title} // NDA SEAL
        </span>
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_5px_#ff00ff]" />
          <span className="font-mono text-[9px] text-fuchsia-200 font-bold">CLASSIFIED</span>
        </div>
      </div>

      {/* Subject line */}
      <p className="relative font-mono text-[10.5px] text-fuchsia-200/75 leading-relaxed mb-2">
        {subject}
      </p>

      {/* Blocked-out bullet rows */}
      <ul className="relative space-y-1.5 font-mono text-[10px]">
        {bullets.map((i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="text-fuchsia-500 shrink-0">&bull;</span>
            <span className="text-fuchsia-300 font-bold tracking-tight truncate">
              [ ████████████████████████ ]
            </span>
            <span className="text-fuchsia-400/40 tracking-wider text-[8px] ml-auto shrink-0">
              CLR-{(i + 1).toString().padStart(2, "0")}
            </span>
          </li>
        ))}
      </ul>

      {/* Clearance footer */}
      <div className="relative border-t border-fuchsia-500/20 pt-2 mt-2.5 flex justify-between items-center text-[8px] font-mono">
        <span className="text-fuchsia-400/55 uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-fuchsia-400 animate-pulse shrink-0" />
          <span>{footer}</span>
        </span>
        <span className="text-fuchsia-300 font-bold">[ ████ ]</span>
      </div>
    </div>
  );
}
