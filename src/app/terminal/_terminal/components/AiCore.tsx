/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AEGIS cognition channel: a chat-style portfolio oracle with offline keyword routing.
 * Renders inside a ShaderCanvas-backed card; uplink to a live LLM is intentionally
 * unavailable (no API credentials), so responses come from scripted semantic registers.
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { synth } from "../audio";
import ShaderCanvas from "./ShaderCanvas";
import {
  Send,
  Terminal,
  ShieldAlert,
  X,
  Loader2,
  PlugZap,
  WifiOff,
  RefreshCw
} from "lucide-react";

export default function AiCore() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "AI",
      text: "AEGIS CORE ONLINE [DEGRADED MODE]. NETWORK_UPLINK_FAIL // QUANTUM COGNITIVE CHANNEL TO REMOTE GEMINI CORE UNREACHABLE. Falling back to offline semantic mapping registers, so my query surface is currently narrow and I cannot reason freely. Use the [ESTABLISH UPLINK] button above to attempt a live cognition handshake. I represent Rituraj Kulshresth's AI platforms index. Try one of the supported tags: 'experience', 'skills', 'projects', 'education', 'accolades', or 'contact'. Type 'help' for the full directory.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [connectStage, setConnectStage] = useState<string>("");
  const [uplinkAttempts, setUplinkAttempts] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Keyword router: maps visitor queries to pre-authored portfolio blocks. No network call.
  const getOfflineResponse = (query: string): string => {
    const q = query.toLowerCase().trim();
    
    if (q.includes("help") || q.includes("command") || q.includes("menu")) {
      return `>> STACK CORE QUERY DIRECTORY [DEGRADED MODE - OFFLINE TAGS ONLY]:
- [experience]: Warner Bros. Discovery, Deloitte, and the Oyo internship
- [skills]: Languages, AI/agent frameworks, backend/frontend, cloud/devops
- [projects]: ACME, Knowledge Hub, Daisy, S2SACC/S2EDS, RustyBun, X86 OS, RGB-to-temp CNN, InVANETs, Hashtag analysis, Bluetooth Mouse
- [education]: B.Tech CSE at IIT Jodhpur (2018 - 2022)
- [accolades]: WBD Excellence Award, 3x Deloitte Excellence Awards, KVPY Scholar
- [contact]: Email, phone, GitHub, LinkedIn, Twitter, Instagram, portfolio
- [status]: Current availability beacon

Enter any keyword above to scan memory banks directly.`;
    }

    if (q.includes("status") || q.includes("available") || q.includes("hire") || q.includes("open")) {
      return `>> STATUS BEACON [DEGRADED MODE]:

- ROLE: Software Development Engineer 2 (AI Platforms), Warner Bros. Discovery
- LOCATION: Hyderabad, India
- AVAILABILITY: Open to interesting work.
- PREFERRED PROBLEMS: enterprise AI platforms, agent runtimes, RAG, evaluation, systems with hard correctness or cost ceilings.
- REACH OUT: kulshresth.1@alumni.iitj.ac.in or linkedin.com/in/rituraj-kulshresth/`;
    }

    if (q.includes("experi") || q.includes("work") || q.includes("job") || q.includes("deloitte") || q.includes("warner") || q.includes("wbd") || q.includes("oyo") || q.includes("intern") || q.includes("history")) {
      return `>> SCANNING PROFESSIONAL TIMELINE LOGS:

1. WARNER BROS. DISCOVERY // SOFTWARE DEVELOPMENT ENGINEER 2 (AI PLATFORMS)
   [Nov 2024 - Present | Hyderabad, India]
   - ACME (Agent Core for Managed Execution): four-resource credentials model (Team/App/Agent/Sub-agent) with dual auth (act_as_app via API keys plus AWS Secrets Manager, act_as_user via Okta OIDC) and a sub-agent safety property. Drove SAST findings from CRITICAL to zero in one sprint. Bootstrapped the BOLT FastAPI + Next.js monorepo on Terraform/Terragrunt and Helm across DEV/INT/STG/PROD.
   - Knowledge Hub (RAG-as-a-Service): self-serve retrieval on AWS OpenSearch with shared document and index catalogs; semantic chunking; multimodal embeddings via Bedrock Titan and Anthropic Claude. Authored the org-wide architecture document.
   - Daisy (Data Analytics AI Platform): multi-agent platform used by 11+ teams. Cut monthly infra from ~$700 to ~$200 per non-prod env and ~$1000 to ~$800 in PROD. DeepEval framework lifted evaluation accuracy 27%; chat-session storage cut ~66%. Added Databricks/Snowflake chart visualisation and .ipynb notebook ingestion. Led zero-downtime migration during the org split. Authored Evaluation Platform and Daisy Vector DB API architecture docs; ran code reviews for a 7-engineer team.

2. DELOITTE // SOFTWARE ENGINEER (ANALYST)
   [July 2022 - Nov 2024 | Hyderabad, India]
   - S2SACC Outlook add-in (Yeoman + MS Graph) for 1000+ users, with role-based access by distribution group.
   - S2EDS Outlook add-in (React + Yeoman) for 500+ users.
   - Migrated Mule ESB to AWS Lambda for the document archival backend; maintained 4 critical Java applications.
   - DocuEdge Capture UI (AngularJS + Syncfusion), in production at 2 client organisations.
   - Led the OpenText upgrade programme, enhancing 10 servers.
   - Automated SystemWare daily health checks via PowerShell + mainframe scripting, saving ~15 hours/month.
   - Authored 70+ JCL scripts to migrate and restore 4000+ documents from Mobius to SystemWare ContentCloud on z/OS.

3. OYO // ANALYST (INTERN)
   [Summer 2021 | Gurugram, India]
   - Worked on the Oyo Self Onboarding platform, streamlining consumer onboarding flows in the Android app.`;
    }

    if (q.includes("skill") || q.includes("languages") || q.includes("stack") || q.includes("devops") || q.includes("framework")) {
      return `>> REGISTERED TECHNICAL STAMP [SKILLS MATRIX]:

- LANGUAGES: Python, C/C++, JavaScript/TypeScript, Rust, Java, Assembly, SQL.
- AI & AGENT FRAMEWORKS: LangGraph, LangChain, LangSmith, OpenAI SDK, Anthropic Claude SDK, Vercel AI SDK, DeepEval, AWS Bedrock (Titan, Claude, multimodal embeddings), TensorFlow.
- BACKEND & FRONTEND: FastAPI, SQLAlchemy, Alembic, Next.js, React, PostgreSQL, MERN, Electron, Yeoman.
- CLOUD & DEVOPS: AWS (EKS, OpenSearch, Lambda, S3, API Gateway, Secrets Manager), Kubernetes, Helm, Docker, Terraform, Terragrunt, Okta OIDC, Git, Mainframe (z/OS).`;
    }

    if (q.includes("project") || q.includes("rustybun") || q.includes("x86") || q.includes("temp") || q.includes("os") || q.includes("acme") || q.includes("knowledge") || q.includes("daisy") || q.includes("vanet") || q.includes("hashtag") || q.includes("mouse") || q.includes("bluetooth")) {
      return `>> STATED SCHEMATICS [PROJECT PORTFOLIOS]:

[ENTERPRISE AI // WBD]
1. ACME · Agent Platform: four-resource credentials model with sub-agent identity safety, versioned PostgreSQL JSONB registry, multi-model serving over AWS Bedrock alongside OpenAI and Anthropic.
2. Knowledge Hub · Enterprise RAG: self-serve retrieval on AWS OpenSearch with shared document/index catalogs, semantic chunking, multimodal embeddings.
3. Daisy · Multi-Agent Analytics: 11+ teams, ~$700→$200 non-prod and ~$1000→$800 PROD, +27% eval accuracy, -66% chat storage, Databricks/Snowflake charts, .ipynb ingestion.

[ENTERPRISE INTEGRATION // DELOITTE]
4. S2SACC + S2EDS Outlook add-ins and Document Archival: Yeoman + MS Graph + React; 1000+ and 500+ users; Mule ESB → AWS Lambda migration.

[PERSONAL / OPEN SOURCE]
5. RustyBun: Rust clipboard manager for Debian-based Linux. github.com/RiturajKulshresth/RustyBun
6. X86 Architecture OS: 32-bit OS in C and Assembly with bootloader, paged memory, interrupt handling, VGA driver, shell. github.com/RiturajKulshresth/OS

[ACADEMIC / RESEARCH]
7. RGB → Core Body Temperature: TensorFlow CNN over NIR, hyperspectral, RGB face data, ~60% accuracy on a custom dataset.
8. Edge-Inference for InVANETs: NS-3 + SUMO vehicular network simulation, cutting RSU processing needs by ~71%.
9. Hashtag Propagation Analysis: graph structure and cascade depth across Twitter/Koo (NetworkX + Pandas + Selenium).

[MOBILE]
10. Bluetooth Mouse: Android app turning a phone into a wireless mouse over Bluetooth HID (Java).`;
    }

    if (q.includes("edu") || q.includes("iit") || q.includes("college") || q.includes("university")) {
      return `>> ACADEMIC REGISTRATION LEDGER:

- INSTITUTION: Indian Institute of Technology, Jodhpur
  [July 2018 - June 2022 | Rajasthan, India]
- DEGREE: Bachelor of Technology (B.Tech) in Computer Science and Engineering
- TECHNICAL DISCIPLINE: Systems Programming, Machine Learning, Deep Neural Architectures, Algorithmic Hardening.`;
    }

    if (q.includes("accolade") || q.includes("kvpy") || q.includes("award") || q.includes("honor") || q.includes("excellence")) {
      return `>> HIGHLIGHTED DECORATION RECORDS:

- WARNER BROS. DISCOVERY: Awarded corporate SDE Excellence Honor for designing and executing the entire Enterprise RAG "Knowledge Hub" ecosystem.
- DELOITTE: Earned 3 consecutive company Excellence Awards for delivering the S2SACC Outlook system and securing OpenText server architecture.
- KVPY SCHOLAR (2017-2018): Honored as a Kishore Vaigyanik Protsahan Yojana scholar by the Government of India.`;
    }

    if (q.includes("contact") || q.includes("email") || q.includes("phone") || q.includes("git") || q.includes("linkedin") || q.includes("portfolio") || q.includes("twitter") || q.includes("instagram") || q.includes("social")) {
      return `>> TRANSPHONE TRANSMISSION TERMINALS:

- EMAIL SEC_CHANNEL: kulshresth.1@alumni.iitj.ac.in
- PHONE COMM_LINK: +91 7004742004
- GITHUB REPOSITORIES: github.com/RiturajKulshresth
- LINKEDIN ACCESS: linkedin.com/in/rituraj-kulshresth/
- TWITTER FEED: twitter.com/BlehRituraj
- INSTAGRAM RELAY: instagram.com/riturajkulshresth
- PORTFOLIO RELAY: riturajkulshresth.vercel.app
- GEOGRAPHIC LOCATION: Hyderabad, India // Core Coordinates
- STATUS BEACON: Open to interesting work.`;
    }

    // Default matching fallback with helpful tips
    return `>> COMMAND SEQUENCE VERIFIED // INTERPRETING DIRECTORY [DEGRADED MODE]:
No offline match for "${query}". Live cognition uplink is unavailable, so I cannot freestyle on this query.

Supported offline tags:
- 'experience' (WBD, Deloitte, Oyo intern)
- 'skills' (Languages, AI/agents, backend, cloud)
- 'projects' (10 entries across enterprise AI, systems, academic, mobile)
- 'education' (IIT Jodhpur, B.Tech CSE)
- 'accolades' (WBD + Deloitte excellence, KVPY Scholar)
- 'contact' (email, phone, GitHub, LinkedIn, Twitter, Instagram, portfolio)
- 'status' (current availability beacon)

Type 'help' to see the main query manual.`;
  };

  // Theatrical handshake sequence. Always times out because no Gemini API key is bound.
  const attemptUplink = () => {
    if (isConnecting) return;

    synth.playClick(720, 0.06);
    setShowOfflineModal(false);
    setErrorText(null);
    setIsConnecting(true);

    const stages = [
      "INITIATING QUANTUM HANDSHAKE...",
      "NEGOTIATING TLS // CERT FINGERPRINT...",
      "RESOLVING GEMINI CORE ROUTE...",
      "AUTHENTICATING API CREDENTIALS..."
    ];

    let idx = 0;
    setConnectStage(stages[0]);
    const stageInterval = window.setInterval(() => {
      idx += 1;
      if (idx < stages.length) {
        setConnectStage(stages[idx]);
        synth.playClick(420 + idx * 60, 0.03);
      }
    }, 420);

    window.setTimeout(() => {
      window.clearInterval(stageInterval);
      setConnectStage("");
      setIsConnecting(false);
      setUplinkAttempts((n) => n + 1);
      setShowOfflineModal(true);
      synth.playAlert();
    }, 1900);
  };

  const dismissOfflineModal = () => {
    synth.playClick(1100, 0.04);
    setShowOfflineModal(false);
  };

  const triggerPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    synth.playClick(900, 0.05);

    // Append user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "USER",
      text: promptText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsLoading(true);
    setErrorText(null);

    // Artificial delay so the loading state reads as real inference, not instant lookup.
    setTimeout(() => {
      try {
        const replyText = getOfflineResponse(promptText);
        
        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: "AI",
          text: replyText,
          timestamp: new Date().toLocaleTimeString()
        };

        setMessages((prev) => [...prev, aiMsg]);
        synth.playStartup(); // Success sweep
      } catch (err: any) {
        console.error(err);
        setErrorText("Unknown system hardware error in offline heuristic pipeline.");
        synth.playAlert(); // Warning beep
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const QUICK_PROMPTS = [
    { label: "EXECUTE REPORT: WORK HISTORY", text: "experience" },
    { label: "EXECUTE REPORT: KEY PROJECTS", text: "projects" },
    { label: "EXECUTE REPORT: PORTFOLIO SKILLS", text: "skills" },
    { label: "EXECUTE REPORT: ACCOLADES", text: "accolades" },
    { label: "EXECUTE REPORT: DIRECT CONTACT", text: "contact" }
  ];

  return (
    <div className="quantum-card border border-cyan-500/25 rounded shadow-2xl overflow-hidden relative flex flex-col h-[500px] backdrop-blur-md">
      {/* Interactive WebGL Shader inside the terminal body */}
      <ShaderCanvas colorPreset="COSMIC" opacity={0.30} />

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-400" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-cyan-400" />

      {/* Terminal Title Banner */}
      <div className="bg-cyan-950/20 border-b border-cyan-500/10 px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#00f3ff] truncate">
            AEGIS // AI ENGINE COGNITION CHANNEL
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] shrink-0">
          <button
            type="button"
            onClick={attemptUplink}
            disabled={isConnecting}
            title={
              uplinkAttempts > 0
                ? "Retry handshake with remote Gemini cognition core"
                : "Attempt handshake with remote Gemini cognition core"
            }
            className={`group flex items-center gap-1.5 px-2 py-1 rounded-sm border font-mono text-[9px] font-black uppercase tracking-wider transition-all duration-300 disabled:cursor-not-allowed ${
              isConnecting
                ? "border-amber-400/50 bg-amber-950/30 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                : "border-cyan-500/30 bg-cyan-950/30 text-cyan-200 hover:border-[#00f3ff] hover:text-[#00f3ff] hover:shadow-[0_0_10px_rgba(0,243,255,0.35)]"
            }`}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>HANDSHAKE...</span>
              </>
            ) : uplinkAttempts > 0 ? (
              <>
                <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                <span>RETRY UPLINK</span>
              </>
            ) : (
              <>
                <PlugZap className="w-3 h-3" />
                <span>ESTABLISH UPLINK</span>
              </>
            )}
          </button>
          <div className="hidden sm:flex items-center space-x-1.5">
            {isConnecting ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shadow-[0_0_5px_#f59e0b]" />
                <span className="text-amber-300/80 uppercase">LINKING</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_#ef4444]" />
                <span className="text-red-400/80 uppercase">OFFLINE MODE</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Window */}
      <div
        ref={containerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[150px] scroller-cyan relative bg-[radial-gradient(ellipse_at_center,rgba(0,243,255,0.02),transparent)]"
      >
        {/* Connecting overlay (scoped to AEGIS) */}
        {isConnecting && (
          <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-3 px-4 py-3 bg-amber-950/30 border-b border-amber-500/30 backdrop-blur-sm flex items-center gap-3 font-mono text-[10px] text-amber-200 shadow-[inset_0_-1px_0_rgba(245,158,11,0.15)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-black uppercase tracking-wider text-amber-200/90">
                ATTEMPTING REMOTE COGNITION UPLINK
              </span>
              <div className="text-amber-300/70 text-[9px] uppercase tracking-wide mt-0.5 truncate">
                {connectStage || "INITIATING..."}
              </div>
            </div>
            <span className="hidden sm:inline text-[9px] text-amber-400/60 uppercase">
              ATTEMPT #{uplinkAttempts + 1}
            </span>
          </div>
        )}

        {/* Offline / Connection-failed modal (scoped to AEGIS card) */}
        {showOfflineModal && (
          <div className="sticky top-0 z-30 -mx-4 -mt-4 mb-3 px-4 pt-3 pb-4 bg-red-950/40 border-b border-red-500/40 backdrop-blur-md shadow-[inset_0_-1px_0_rgba(239,68,68,0.25),0_8px_24px_-12px_rgba(239,68,68,0.6)] relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-400" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-400" />
            <button
              type="button"
              onClick={dismissOfflineModal}
              aria-label="Dismiss offline notice"
              className="absolute top-2 right-2 p-1 text-red-300/70 hover:text-red-200 hover:bg-red-500/10 rounded-sm transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <div className="shrink-0 p-1.5 rounded-sm border border-red-500/40 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.35)]">
                <WifiOff className="w-4 h-4 text-red-300 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 font-mono text-[10px] leading-relaxed">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span className="font-black uppercase tracking-widest text-red-200">
                    UPLINK_FAILED [0x4F4 // NO_LIVE_AI]
                  </span>
                </div>
                <p className="text-red-200/90 mb-2">
                  Remote Gemini cognition core is{" "}
                  <span className="font-bold text-red-100">unreachable</span>.
                  No API credentials are bound to this session, so this AEGIS
                  instance cannot reach a live LLM. You are operating in{" "}
                  <span className="font-bold text-red-100 uppercase">
                    offline mode
                  </span>
                  .
                </p>
                <ul className="text-red-300/80 text-[9.5px] space-y-0.5 mb-2 list-none">
                  <li>- HANDSHAKE_TIMEOUT after authentication stage</li>
                  <li>- LIVE_INFERENCE: disabled</li>
                  <li>- SEMANTIC_REGISTERS: nominal, responses are scripted</li>
                  <li>- DROPPED_ATTEMPTS: {uplinkAttempts}</li>
                </ul>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={attemptUplink}
                    disabled={isConnecting}
                    className="flex items-center gap-1 px-2 py-1 border border-red-400/50 hover:border-red-300 bg-red-500/10 hover:bg-red-500/20 text-red-100 rounded-sm text-[9px] font-black uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>RETRY HANDSHAKE</span>
                  </button>
                  <button
                    type="button"
                    onClick={dismissOfflineModal}
                    className="flex items-center gap-1 px-2 py-1 border border-red-500/25 hover:border-red-400/60 bg-transparent text-red-300/80 hover:text-red-200 rounded-sm text-[9px] font-black uppercase tracking-wider transition-colors"
                  >
                    <span>CONTINUE OFFLINE</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === "USER" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-mono text-[8px] text-cyan-500/50 uppercase font-black">
                {msg.sender === "USER" ? "VISITOR // STAGE1" : "AEGIS // SECURE_ORACLE"}
              </span>
              <span className="font-mono text-[8px] text-cyan-500/35">{msg.timestamp}</span>
            </div>
            
            <div
              className={`p-3 rounded font-mono text-[11px] leading-relaxed select-text ${
                msg.sender === "USER"
                  ? "bg-fuchsia-950/30 border border-fuchsia-500/30 text-fuchsia-200 shadow-[0_0_8px_rgba(255,0,255,0.05)]"
                  : "bg-[#05050b]/60 border border-cyan-500/15 text-cyan-200 shadow-[0_0_8px_rgba(0,243,255,0.03)]"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col mr-auto items-start max-w-[85%]">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-mono text-[8px] text-cyan-500/50 uppercase font-black">
                AEGIS // CALCULATION CORNER
              </span>
            </div>
            <div className="p-3 rounded font-mono text-[11px] bg-cyan-950/10 border border-cyan-500/15 text-cyan-300 flex items-center space-x-2 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping shadow-[0_0_5px_#00f3ff]" />
              <span>COGNITIVE PIPELINE EXPANDING... RESOLVING ENTROPY PATHS</span>
            </div>
          </div>
        )}

        {errorText && (
          <div className="p-3 border border-red-500/20 bg-red-950/10 rounded flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="font-mono text-[10px] text-red-400">
              <span className="font-bold uppercase tracking-wider block mb-1">TRANSMISSION_ERROR [0x04]:</span>
              {errorText}
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts deck */}
      <div className="px-4 py-2 bg-[#05050b]/50 border-t border-cyan-500/10 flex flex-wrap gap-2 justify-center">
        {QUICK_PROMPTS.map((chip, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => triggerPrompt(chip.text)}
            className="px-2 py-1 bg-cyan-950/20 border border-cyan-500/15 hover:border-cyan-400 rounded-sm font-mono text-[9px] text-cyan-300 hover:text-[#00f3ff] cursor-pointer transition-all duration-300 disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input cockpit */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          triggerPrompt(inputVal);
        }}
        className="p-3 bg-neutral-950/90 border-t border-cyan-500/15 flex items-center space-x-2"
      >
        <span className="font-mono text-xs text-[#00f3ff]">&gt;_</span>
        <input
          type="text"
          value={inputVal}
          disabled={isLoading}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="SEND COMMAND SEQUENCE TO ORACLE..."
          className="flex-1 bg-transparent border-0 ring-0 focus:outline-none focus:ring-0 font-mono text-xs text-cyan-200 placeholder-cyan-500/40"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isLoading}
          className="p-1.5 bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-400 rounded-sm cursor-pointer text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
