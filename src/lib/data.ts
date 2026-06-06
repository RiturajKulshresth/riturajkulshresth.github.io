/**
 * Single source of truth for portfolio content and navigation metadata.
 * Profile, projects, experience, skills, accolades, and nav config all live
 * here so every render mode can import the same data without duplication.
 */
export const RESUME_PATH = "/resume/RiturajKulshresth_Resume.pdf";

export const profile = {
  name: "Rituraj Kulshresth",
  role: "Software Engineer · AI Platforms",
  location: "Hyderabad, India",
  email: "kulshresth.1@alumni.iitj.ac.in",
  phone: "+91 7004742004",
  bio: "Software engineer specialising in enterprise AI platforms. At Warner Bros. Discovery I designed and shipped three production agent and RAG platforms used by 11+ internal teams, and led the architecture documents for agent authentication, evaluation, and retrieval across the org.",
  status: "Open to interesting work",
} as const;

export type Project = {
  title: string;
  subtitle: string;
  description: string;
  year: string;
  tags: string[];
  link?: string;
  preview?: string;
};

export const projects: Project[] = [
  {
    title: "ACME · Agent Platform",
    subtitle: "Warner Bros. Discovery",
    description:
      "Enterprise platform for designing, deploying, and operating AI agents. Designed the four-resource credentials model (Team / App / Agent / Sub-agent) with separate edit and invocation ACLs, dual auth modes (act_as_app via API keys + AWS Secrets Manager, act_as_user via Okta OIDC), and a sub-agent safety property where only the caller's identity flows through every tool call - making cross-team agent reuse safe by construction. Refactored agent configuration off YAML onto a versioned PostgreSQL JSONB registry; shipped multi-model serving via AWS Bedrock alongside OpenAI and Anthropic. Drove SAST findings from CRITICAL to zero in a single sprint.",
    year: "2026 - present",
    tags: [
      "FastAPI",
      "Next.js",
      "PostgreSQL",
      "AWS Bedrock",
      "Okta OIDC",
      "Helm",
    ],
    link: "https://www.linkedin.com/in/rituraj-kulshresth/",
    preview: "/images/wbd.png",
  },
  {
    title: "Knowledge Hub · Enterprise RAG",
    subtitle: "Warner Bros. Discovery",
    description:
      "Self-serve retrieval service on AWS OpenSearch where teams create their own enterprise document indices and share both the document and index catalogs across teams - so any team building an AI app can reuse existing indices without re-ingesting. Ingestion from Confluence, Jira, GitHub, S3, Airflow logs, and arbitrary text sources, with bulk-upload, team-specific chunking, and a semantic chunking mode. Multimodal embedding support via AWS Bedrock Titan, Anthropic Claude, and a Bedrock multimodal model for diagrams, screenshots, and scanned PDFs. Authored the org-wide architecture document.",
    year: "2026 - present",
    tags: [
      "AWS OpenSearch",
      "Bedrock Titan",
      "Claude",
      "Python",
      "Semantic Chunking",
    ],
    link: "https://www.linkedin.com/in/rituraj-kulshresth/",
    preview: "/images/wbd.png",
  },
  {
    title: "Daisy · Analytics Chatbots",
    subtitle: "Warner Bros. Discovery",
    description:
      "Internal multi-agent platform used by 11+ engineering and business teams to build domain-specific chatbots with fine-grained control over tools, data sources (SQL, text), and model configurations. Cut monthly infra spend from ~$700 to ~$200 per non-prod environment and ~$1000 to ~$800 in PROD. Built a DeepEval-based evaluation framework that improved evaluation accuracy by 27%, and reduced chat-session storage by ~66% by optimising how Vercel AI SDK logs sessions into OpenSearch. Migrated all Lambdas onto the org's standardised IaC accounts with zero downtime.",
    year: "2024 - 2025",
    tags: [
      "LangChain",
      "Vercel AI SDK",
      "DeepEval",
      "AWS Lambda",
      "Terraform",
    ],
    link: "https://www.linkedin.com/in/rituraj-kulshresth/",
    preview: "/images/wbd.png",
  },
  {
    title: "S2SACC, S2EDS Outlook Add-ins & Doc Archival",
    subtitle: "Deloitte",
    description:
      "Microsoft Outlook add-ins that ship documents from email into enterprise archival systems. S2SACC moves docs to ContentCloud (1000+ users) using Yeoman and MS Graph API with role-based access via distribution groups; S2EDS sends to enterprise servers (500+ users) using React. Drove the Mule ESB → AWS Lambda migration for the archival backend, reducing compute cost while maintaining four critical Java applications.",
    year: "2022 - 2024",
    tags: ["React", "MS Graph API", "Yeoman", "AWS Lambda", "Java"],
    link: "https://www.linkedin.com/in/rituraj-kulshresth/",
    preview: "/images/deloitte.png",
  },
  {
    title: "RustyBun",
    subtitle: "Clipboard manager for Linux",
    description:
      "Published a clipboard manager that gives Debian-based distros convenient access to clipboard history. Written in Rust, packaged for everyday workflow use.",
    year: "2024",
    tags: ["Rust", "Linux", "GTK"],
    link: "https://github.com/RiturajKulshresth/RustyBun",
    preview: "/images/rustybun.png",
  },
  {
    title: "x86 Operating System",
    subtitle: "Kernel & drivers from scratch",
    description:
      "Hand-written 32-bit OS in C and Assembly with keyboard input, a VGA output driver, and a functional shell for basic tasks. The project that taught me to read datasheets.",
    year: "2022",
    tags: ["C", "Assembly", "OS Dev"],
    link: "https://github.com/RiturajKulshresth/OS",
    preview: "/images/osdev.gif",
  },
  {
    title: "RGB → Body Temperature",
    subtitle: "Deep learning vision pipeline",
    description:
      "CNN models in TensorFlow that predict core body temperature from diverse facial image data (NIR, hyper-spectral, RGB), achieving 60% accuracy on a custom dataset.",
    year: "2022",
    tags: ["Python", "TensorFlow", "CNN"],
    link: "https://github.com/RiturajKulshresth/Rakshak_RGB2NIR_RGB2TEMP",
    preview: "/images/RGBFace.gif",
  },
  {
    title: "Edge Inference for InVANETs",
    subtitle: "Vehicular network simulation",
    description:
      "Reduced data transferred between vehicles and Road-Side Units using edge-based knowledge inference. Built on NS-3 with SUMO traffic simulation.",
    year: "2022",
    tags: ["NS-3", "SUMO", "C++"],
    link: "https://github.com/RiturajKulshresth/Edge-based-knowledge-inference-for-intelligent-vehicular-networks-ns3-SUMO",
    preview: "/images/VANET.gif",
  },
  {
    title: "Hashtag Propagation Analysis",
    subtitle: "Network analysis on social graphs",
    description:
      "Modelled how hashtags spread across Twitter and Koo - graph structure, cascade depth, and influencer reach. Useful primer in network science.",
    year: "2022",
    tags: ["Python", "NetworkX", "Pandas"],
    link: "https://github.com/RiturajKulshresth/Data-and-Networks_Hashtag-analysis",
    preview: "/images/hashtag.gif",
  },
  {
    title: "Bluetooth Mouse",
    subtitle: "Android utility app",
    description:
      "Turns an Android phone into a wireless mouse via Bluetooth - pointer, scroll, and click. My first end-to-end shipped app.",
    year: "2021",
    tags: ["Java", "Android"],
    link: "https://github.com/RiturajKulshresth/mouse",
    preview: "/images/mouse.gif",
  },
  {
    title: "Anomaly Detection in Wikipedia",
    subtitle: "Graph-based network analysis",
    description:
      "Built a graph-based structure that uses article viewership counts to surface anomalies across Wikipedia articles, improving detection efficiency over naive baselines.",
    year: "2022",
    tags: ["Python", "Graphs", "NetworkX"],
    link: "https://github.com/RiturajKulshresth",
  },
  {
    title: "ECG Arrhythmia Detection",
    subtitle: "Biomedical signal processing",
    description:
      "A MATLAB application for ECG signal analysis: heart-rate detection and classification of arrhythmia types, built during a biomedical instrumentation course.",
    year: "2021",
    tags: ["MATLAB", "Signal Processing", "Biomedical"],
    link: "https://github.com/RiturajKulshresth",
  },
  {
    title: "Kakuro Solver",
    subtitle: "Constraint-satisfaction puzzle solver",
    description:
      "An application that solves Kakuro puzzles by modelling the grid as a constraint-satisfaction problem and searching for valid digit assignments.",
    year: "2021",
    tags: ["Python", "Algorithms", "CSP"],
    link: "https://github.com/RiturajKulshresth",
  },
];

export type Experience = {
  company: string;
  role: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
  current?: boolean;
};

export const experience: Experience[] = [
  {
    company: "Warner Bros. Discovery",
    role: "Software Development Engineer 2 · AI Platforms",
    period: "Nov 2024 - Present",
    location: "Hyderabad, India",
    current: true,
    summary:
      "Designing and shipping three production AI platforms used across the company - ACME for agent execution, Knowledge Hub for enterprise RAG, and Daisy for analytics chatbots. Architecture lead on org-wide documents for agent auth, evaluation, and retrieval.",
    highlights: [
      "ACME · Designed the four-resource credentials and authentication model (Team / App / Agent / Sub-agent) with separate edit and invocation ACLs, dual auth modes (act_as_app for production via API keys + AWS Secrets Manager, act_as_user for the playground via Okta OIDC), and a sub-agent safety property where only the caller's identity flows through every tool call - making cross-team agent reuse safe by construction.",
      "ACME · Built the Playground for prompt-testing agents and inspecting tool calls; refactored agent configuration off local YAML onto a versioned PostgreSQL JSONB registry with a draft / published / archived lifecycle; shipped multi-model serving via AWS Bedrock alongside OpenAI and Anthropic providers.",
      "ACME · Drove SAST findings from CRITICAL to zero in a single sprint, and bootstrapped the BOLT dual-language monorepo (FastAPI runtime + Next.js console) on Terraform / Terragrunt and Helm with CI/CD across DEV, INT, STG, and PROD.",
      "Knowledge Hub · Designed and built a self-serve retrieval service on AWS OpenSearch where teams create and share document and index catalogs. Ingestion from Confluence, Jira, GitHub, S3, and Airflow with semantic chunking, plus multimodal embeddings via Bedrock Titan and Anthropic Claude. Authored the org-wide architecture document.",
      "Daisy · Multi-agent platform used by 11+ teams for domain-specific chatbots. Cut monthly infra spend from ~$700 to ~$200 per non-prod environment and ~$1000 to ~$800 in PROD; built an evaluation framework with DeepEval improving evaluation accuracy by 27% and reducing chat-session storage by ~66%.",
      "Daisy · Added visualization features for generating custom charts from Databricks and Snowflake data, and enabled ingestion of .ipynb notebooks for internal documentation.",
    ],
  },
  {
    company: "Deloitte",
    role: "Software Engineer (Analyst)",
    period: "Jul 2022 - Nov 2024",
    location: "Hyderabad, India",
    summary:
      "Built Outlook add-ins and document archival apps for enterprise clients, and led service migrations off legacy infrastructure with zero downtime.",
    highlights: [
      "Shipped the S2SACC Outlook add-in using Yeoman and MS Graph API, with role-based access via distribution groups, serving 1000+ users.",
      "Built the S2EDS Outlook add-in for sending documents to enterprise servers from the mailbox, using React and Yeoman, serving 500+ users.",
      "Migrated services from Mule ESB to AWS Lambda, reducing compute cost and improving performance for the document archival system. Maintained four critical Java applications keeping core business operations running.",
      "Built the UI for the Document Upload interface of the DocuEdge Archiving Solution using AngularJS and Syncfusion, in production at two client organisations.",
      "Implemented automated daily health-check procedures in the SystemWare environment using PowerShell and mainframe scripting, saving the team ~15 hours per month.",
      "Spearheaded the development of 70+ scripts to securely migrate and restore 4000+ documents from Mobius to SystemWare ContentCloud using JCL on the mainframe.",
      "Led the upgrade of the client's OpenText landscape and played a pivotal role in the enhancement of 10 servers.",
    ],
  },
  {
    company: "Oyo",
    role: "Analyst (Intern)",
    period: "Summer 2021",
    location: "Gurugram, India",
    summary:
      "Worked on Oyo's Self Onboarding platform, focused on consumer-side flows for the Android app.",
    highlights: [
      "Streamlined consumer onboarding via the Oyo Self Onboarding platform, improving the Android app user experience.",
    ],
  },
  {
    company: "IIT Jodhpur",
    role: "B.Tech, Computer Science & Engineering",
    period: "Jul 2018 - Jun 2022",
    location: "Jodhpur, Rajasthan",
    summary:
      "Specialised in operating systems, computer networks, and machine learning. Coursework heavy on systems with a research-leaning thesis and a strong project portfolio across systems, signal processing, and computer vision.",
    highlights: [
      "Edge-based knowledge inference for InVANETs - reduced data transferred between vehicles and Road-Side Units using NS-3 and SUMO, minimising RSU processing power needs by ~71% and enabling calculations regardless of network strength.",
      "Built a 32-bit x86 operating system from scratch as a self-driven project: bootloader, paged memory, interrupt handling, keyboard input, a VGA output driver, and a functional shell - written in C and Assembly.",
      "Implemented CNN models in TensorFlow that predict core body temperature from diverse facial image data (NIR, hyper-spectral, RGB), achieving 60% accuracy on a custom dataset captured under controlled lighting.",
      "Modelled hashtag-driven social networks on Twitter and Koo using Selenium and Pandas - graph structure, cascade depth, and influencer reach for popular societal hashtags.",
      "Built a MATLAB application for ECG signal analysis, heart-rate detection, and arrhythmia classification during a biomedical instrumentation course.",
    ],
  },
];

export type SkillGroup = {
  title: string;
  description: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    title: "Languages",
    description: "Daily drivers and long-time companions.",
    items: [
      "Python",
      "C / C++",
      "JavaScript / TypeScript",
      "Rust",
      "Java",
      "Assembly",
      "SQL",
    ],
  },
  {
    title: "AI & Agent Frameworks",
    description: "Where the agent platforms come together.",
    items: [
      "LangGraph",
      "LangChain",
      "LangSmith",
      "OpenAI SDK",
      "Anthropic Claude SDK",
      "Vercel AI SDK",
      "DeepEval",
      "AWS Bedrock",
      "TensorFlow",
    ],
  },
  {
    title: "Backend & Frontend",
    description: "Services, APIs, and the surfaces users actually touch.",
    items: [
      "FastAPI",
      "SQLAlchemy",
      "Alembic",
      "Next.js",
      "React",
      "PostgreSQL",
      "MERN",
      "Electron",
      "Yeoman",
    ],
  },
  {
    title: "Cloud & DevOps",
    description: "Where things actually run.",
    items: [
      "AWS EKS",
      "AWS OpenSearch",
      "AWS Lambda",
      "AWS S3",
      "API Gateway",
      "Secrets Manager",
      "Kubernetes",
      "Helm",
      "Docker",
      "Terraform",
      "Terragrunt",
      "Okta OIDC",
      "Git",
      "Mainframe (z/OS)",
    ],
  },
];

export type Accolade = {
  title: string;
  organisation: string;
  period: string;
  description: string;
};

export const accolades: Accolade[] = [
  {
    title: "Excellence Award",
    organisation: "Warner Bros. Discovery",
    period: "2026",
    description:
      "Honoured for designing and building Knowledge Hub, the company's enterprise RAG-as-a-service platform.",
  },
  {
    title: "3× Excellence Awards",
    organisation: "Deloitte",
    period: "2022 - 2024",
    description:
      "Recognised for shipping the S2SACC Outlook add-in and leading the OpenText server upgrade programme.",
  },
  {
    title: "KVPY Scholar",
    organisation: "Government of India",
    period: "2017 - 2018",
    description:
      "Selected as a Kishore Vaigyanik Protsahan Yojana scholar for aptitude in basic sciences.",
  },
];

export const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/RiturajKulshresth",
    icon: "github",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/rituraj-kulshresth/",
    icon: "linkedin",
  },
  {
    label: "Twitter",
    href: "https://twitter.com/BlehRituraj",
    icon: "twitter",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/riturajkulshresth/",
    icon: "instagram",
  },
] as const;

export const navItems = [
  { href: "#work", label: "Work" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#recognition", label: "Recognition" },
  { href: "#contact", label: "Contact" },
] as const;

// Internal routes that live outside the home-page scroll narrative.
// Photography and Terminal stay as their own standalone nav links.
export const routes = [
  { href: "/photography", label: "Photography" },
  { href: "/terminal", label: "Terminal" },
] as const;

// Alternate render styles aggregated under the navbar "Render Modes" dropdown.
export const renderModes = [
  { href: "/", label: "Default" },
  { href: "/windows95", label: "Windows 95" },
  { href: "/cli", label: "CLI" },
  { href: "/editorial", label: "Editorial" },
  { href: "/magazine", label: "Magazine" },
  { href: "/munchkincat", label: "Munchkin Cat" },
] as const;
