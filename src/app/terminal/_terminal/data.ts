/**
 * Terminal data adapter.
 *
 * The terminal re-skins the portfolio's projects as cyberpunk "system nodes".
 * To stop the terminal from drifting away from the rest of the site (it had
 * already gone stale, e.g. showing "2024 - present" for projects that read
 * "2026 - present" in the canonical data), the drift-prone factual fields
 * (`year` and `link`) are sourced from `@/lib/data` at build time. Only the
 * terminal-specific presentation (stylized title, category, status, efficiency,
 * specs, blueprints, themed description) lives here, keyed to the canonical
 * project by its `source` title.
 */
import { projects as canonicalProjects } from "@/lib/data";
import type { ProjectNode } from "./types";

// Everything that is purely terminal presentation, plus `source`: the exact
// `title` of the matching entry in `@/lib/data`'s `projects` array.
type ProjectFlavor = Omit<ProjectNode, "year" | "link"> & { source: string };

const PROJECT_FLAVOR: ProjectFlavor[] = [
  {
    source: "ACME · Agent Platform",
    id: "p1",
    title: "ACME // AGENT PLATFORM",
    subtitle: "Agent Core for Managed Execution",
    category: "ENTERPRISE AI",
    status: "ONLINE",
    efficiency: 98.5,
    description:
      "Four-resource credentials model (Team/App/Agent/Sub-agent) with separate Edit and Invocation ACLs, dual auth modes (act_as_app via API keys plus AWS Secrets Manager, act_as_user via Okta OIDC), and a sub-agent safety property where only the caller's identity flows through every tool call. Refactored agent config onto a versioned PostgreSQL JSONB registry; drove SAST findings from CRITICAL to zero in a single sprint.",
    quantumCost: "44.8 GHZ / CELL",
    specs: ["FastAPI + Next.js Console", "PostgreSQL JSONB Registry", "AWS Bedrock + OpenAI + Anthropic"],
    blueprints: ["GRID_SPIN", "NODES_GRID"],
  },
  {
    source: "Knowledge Hub · Enterprise RAG",
    id: "p2",
    title: "KNOWLEDGE HUB // RAG",
    subtitle: "Enterprise Retrieval Service",
    category: "RETRIEVAL CORE",
    status: "ONLINE",
    efficiency: 96.2,
    description:
      "Self-serve RAG-as-a-Service on AWS OpenSearch where teams create their own document and index catalogs and share them across teams. Ingestion from Confluence, Jira, GitHub, S3, Airflow with semantic chunking. Multimodal embeddings via Bedrock Titan and Anthropic Claude, plus a Bedrock multimodal model for diagrams and scanned PDFs. Authored the org-wide architecture doc.",
    quantumCost: "62.1 GHZ / CELL",
    specs: ["AWS OpenSearch Indices", "Semantic Chunking Engine", "Bedrock Titan + Claude Embeddings"],
    blueprints: ["LORENZ_ATTRACT", "WAVE_PLANE"],
  },
  {
    source: "Daisy · Analytics Chatbots",
    id: "p3",
    title: "DAISY // MULTI-AGENT",
    subtitle: "Analytics Chatbot Platform",
    category: "MULTI-AGENT AI",
    status: "ONLINE",
    efficiency: 99.1,
    description:
      "Multi-agent platform used by 11+ engineering and business teams to build domain-specific chatbots over SQL and text data. Cut monthly infra spend from ~$700 to ~$200 per non-prod environment and ~$1000 to ~$800 in PROD. DeepEval framework lifted evaluation accuracy 27% and chat-session storage was cut ~66%. Added chart visualisation over Databricks and Snowflake, and .ipynb notebook ingestion for internal docs.",
    quantumCost: "38.0 GHZ / CELL",
    specs: ["LangChain + Vercel AI SDK", "DeepEval Eval Framework", "AWS Lambda + Terraform"],
    blueprints: ["NODES_GRID", "SCANNER_ARC"],
  },
  {
    source: "S2SACC, S2EDS Outlook Add-ins & Doc Archival",
    id: "p4",
    title: "S2SACC + S2EDS",
    subtitle: "Outlook Add-ins & Doc Archival",
    category: "ENTERPRISE INTEGRATION",
    status: "ONLINE",
    efficiency: 92.4,
    description:
      "Two Microsoft Outlook add-ins moving documents from email into enterprise archival. S2SACC pushes to ContentCloud (1000+ users) using Yeoman and MS Graph API with role-based access by distribution group; S2EDS sends to enterprise servers (500+ users) in React. Drove the Mule ESB to AWS Lambda migration on the archival backend, while maintaining four critical Java applications.",
    quantumCost: "21.5 GHZ / CELL",
    specs: ["React + Yeoman", "MS Graph API", "AWS Lambda + Java"],
    blueprints: ["LINE_GRID", "GRID_SPIN"],
  },
  {
    source: "RustyBun",
    id: "p5",
    title: "PROJECT RUSTYBUN",
    subtitle: "Linux Clipboard Daemon",
    category: "SYSTEMS UTILITY",
    status: "ONLINE",
    efficiency: 99.4,
    description:
      "Rust clipboard manager bringing convenient clipboard-history access to Debian-based Linux distros. Compiled, packaged, and shipped for everyday workflow use.",
    quantumCost: "11.2 GHZ / CORE",
    specs: ["Rust Compiled Daemon", "GTK Surface", "Debian Packaging"],
    blueprints: ["CIRCLE_ROT", "LINE_GRID", "NODES_GRID"],
  },
  {
    source: "x86 Operating System",
    id: "p6",
    title: "X86 ARCHITECTURE OS",
    subtitle: "32-Bit Bare-Metal Kernel",
    category: "HARDWARE KERNEL",
    status: "ONLINE",
    efficiency: 95.8,
    description:
      "Hand-written 32-bit operating system in C and Assembly. Bootloader, paged memory, interrupt handling, keyboard input, a VGA output driver, and a functional shell. The project that taught reading datasheets.",
    quantumCost: "24.5 GHZ / CELL",
    specs: ["x86 Assembly Boot Vector", "C Native Drivers", "Interrupt + Paged Memory"],
    blueprints: ["GRID_SPIN", "WAVE_PLANE"],
  },
  {
    source: "RGB → Body Temperature",
    id: "p7",
    title: "RGB to CORE BODY TEMP",
    subtitle: "Hyperspectral CNN Predictor",
    category: "NEURAL COGNITION",
    status: "STANDBY",
    efficiency: 60.0,
    description:
      "TensorFlow CNN models predicting core body temperature from diverse facial image data (NIR, hyperspectral, RGB), achieving 60% accuracy on a custom dataset captured under controlled lighting.",
    quantumCost: "68.4 GHZ / CELL",
    specs: ["TensorFlow CNN", "NIR + Hyperspectral Channels", "Custom Capture Dataset"],
    blueprints: ["LORENZ_ATTRACT", "SCANNER_ARC"],
  },
  {
    source: "Edge Inference for InVANETs",
    id: "p8",
    title: "EDGE INFER. // INVANETS",
    subtitle: "Vehicular Network Simulation",
    category: "EDGE INTELLIGENCE",
    status: "STANDBY",
    efficiency: 71.0,
    description:
      "Reduced data transferred between vehicles and Road-Side Units using edge-based knowledge inference. Built on NS-3 with SUMO traffic simulation, cutting RSU processing needs by ~71% and enabling calculations regardless of network strength.",
    quantumCost: "32.0 GHZ / CELL",
    specs: ["NS-3 Simulation", "SUMO Traffic", "C++ Edge Inference"],
    blueprints: ["NODES_GRID", "WAVE_PLANE"],
  },
  {
    source: "Hashtag Propagation Analysis",
    id: "p9",
    title: "HASHTAG NET ANALYSIS",
    subtitle: "Social Graph Cascade Study",
    category: "NETWORK SCIENCE",
    status: "DORMANT",
    efficiency: 75.0,
    description:
      "Modelled how hashtags spread across Twitter and Koo. Graph structure, cascade depth, and influencer reach for popular societal hashtags, using Selenium scraping plus NetworkX and Pandas analysis.",
    quantumCost: "14.8 GHZ / CELL",
    specs: ["Python + NetworkX", "Selenium Scrape", "Pandas Graph Analysis"],
    blueprints: ["NODES_GRID", "LINE_GRID"],
  },
  {
    source: "Bluetooth Mouse",
    id: "p10",
    title: "BLUETOOTH MOUSE",
    subtitle: "Android Phone as BT Pointer",
    category: "MOBILE UTILITY",
    status: "DORMANT",
    efficiency: 82.0,
    description:
      "Turns an Android phone into a wireless mouse over Bluetooth: pointer, scroll, and click. First end-to-end shipped Android app.",
    quantumCost: "8.5 GHZ / CELL",
    specs: ["Java + Android", "Bluetooth HID", "Pointer + Scroll + Click"],
    blueprints: ["CIRCLE_ROT", "LINE_GRID"],
  },
];

// Merge each flavor entry with the canonical project's factual fields. The
// curated order/subset above is preserved; a flavor whose `source` no longer
// matches a canonical project is dropped (and warns in dev) so a renamed or
// removed project surfaces here instead of silently going stale.
export const TERMINAL_PROJECTS: ProjectNode[] = PROJECT_FLAVOR.flatMap(
  ({ source, ...flavor }) => {
    const canonical = canonicalProjects.find((p) => p.title === source);
    if (!canonical) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[terminal/data] No canonical project found for "${source}"; dropping from the terminal grid.`
        );
      }
      return [];
    }
    return [{ ...flavor, year: canonical.year, link: canonical.link }];
  }
);
