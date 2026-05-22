export const RESUME_PATH = "/images/RiturajKulshresth_Resume.pdf";

export const profile = {
  name: "Rituraj Kulshresth",
  role: "Software Engineer",
  location: "Hyderabad, India",
  email: "riturajkulshresth@gmail.com",
  phone: "+91 7004742004",
  bio: "Computer Science grad from IIT Jodhpur. I like the messy middle of software — where compilers, networks, and operating systems meet the user-facing surfaces we ship every day. Lately I've been building agent infrastructure: runtimes, tool orchestration, observability, and the developer experience that makes them useful.",
  status: "Open to interesting work",
} as const;

export type Project = {
  title: string;
  subtitle: string;
  description: string;
  year: string;
  tags: string[];
  link: string;
  preview?: string;
};

export const projects: Project[] = [
  {
    title: "x86 Operating System",
    subtitle: "Kernel & drivers from scratch",
    description:
      "Hand-written 32-bit OS in C and Assembly — bootloader, paged memory, interrupt handling, and basic drivers. The project that taught me to read datasheets.",
    year: "2022",
    tags: ["C", "Assembly", "OS Dev"],
    link: "https://github.com/RiturajKulshresth/OS",
    preview: "/images/osdev.gif",
  },
  {
    title: "Edge Inference for InVANETs",
    subtitle: "Vehicular network simulation",
    description:
      "Reduced data transferred between vehicles and Road-Side Units using edge-based knowledge inference. Built on NS-3 with SUMO traffic simulation.",
    year: "2023",
    tags: ["NS-3", "SUMO", "C++"],
    link: "https://github.com/RiturajKulshresth/Edge-based-knowledge-inference-for-intelligent-vehicular-networks-ns3-SUMO",
    preview: "/images/VANET.gif",
  },
  {
    title: "RGB → Body Temperature",
    subtitle: "Deep learning vision pipeline",
    description:
      "Mapped RGB and NIR face video data to core body temperature using a CNN pipeline. Trained on a custom dataset captured under controlled lighting.",
    year: "2023",
    tags: ["Python", "TensorFlow", "CNN"],
    link: "https://github.com/RiturajKulshresth/Rakshak_RGB2NIR_RGB2TEMP",
    preview: "/images/RGBFace.gif",
  },
  {
    title: "Hashtag Propagation Analysis",
    subtitle: "Network analysis on social graphs",
    description:
      "Modelled how hashtags spread across Twitter and Koo — graph structure, cascade depth, and influencer reach. Useful primer in network science.",
    year: "2023",
    tags: ["Python", "NetworkX", "Pandas"],
    link: "https://github.com/RiturajKulshresth/Data-and-Networks_Hashtag-analysis",
    preview: "/images/hashtag.gif",
  },
  {
    title: "Arrhythmia Detection",
    subtitle: "ECG signal processing",
    description:
      "Classical signal-processing pipeline to detect common arrhythmia patterns from raw ECG. Built in MATLAB during a biomedical instrumentation course.",
    year: "2022",
    tags: ["MATLAB", "DSP"],
    link: "https://github.com/RiturajKulshresth/Arrhythmia-detection-and-discrimination-using-Signal-processing-of-ECG",
    preview: "/images/ECG.gif",
  },
  {
    title: "Bluetooth Mouse",
    subtitle: "Android utility app",
    description:
      "Turns an Android phone into a wireless mouse via Bluetooth — pointer, scroll, and click. My first end-to-end shipped app.",
    year: "2021",
    tags: ["Java", "Android"],
    link: "https://github.com/RiturajKulshresth/mouse",
    preview: "/images/mouse.gif",
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
    role: "Software Engineer — AI Platforms",
    period: "2024 — Present",
    location: "Hyderabad, India",
    current: true,
    summary:
      "Building ACME, the internal platform for designing, deploying, and operating AI agents across the company.",
    highlights: [
      "Designed an agent runtime on FastAPI with SSE streaming, multi-model orchestration, and pluggable tools.",
      "Shipped a Next.js console for authoring agents, browsing runs, and debugging tool calls.",
      "Wired up Prometheus, OpenSearch, and OpenTelemetry for end-to-end observability.",
    ],
  },
  {
    company: "Deloitte",
    role: "Software Engineer",
    period: "2023 — 2024",
    location: "Hyderabad, India",
    summary:
      "Built productivity tools and internal Outlook add-ins for enterprise clients across geographies.",
    highlights: [
      "Designed and shipped an Outlook add-in used by thousands of internal users.",
      "Owned the CI/CD pipeline on AWS CodePipeline + Lambda + S3.",
      "Mentored interns on TypeScript, React, and modern build tooling.",
    ],
  },
  {
    company: "IIT Jodhpur",
    role: "B.Tech, Computer Science & Engineering",
    period: "2019 — 2023",
    location: "Jodhpur, India",
    summary:
      "Specialised in operating systems, computer networks, and machine learning. Coursework heavy on systems.",
    highlights: [
      "Capstone: Edge-based knowledge inference for vehicular networks.",
      "Built a 32-bit x86 OS from scratch as a self-driven project.",
      "Contributed to research on biomedical signal processing and computer vision.",
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
    items: ["TypeScript", "Python", "C / C++", "JavaScript", "Java", "Assembly"],
  },
  {
    title: "Web & Frontend",
    description: "Where the user actually lives.",
    items: ["React", "Next.js", "Tailwind CSS", "Vercel AI SDK", "Zustand"],
  },
  {
    title: "Backend & AI",
    description: "Services, agents, and the glue between them.",
    items: ["FastAPI", "LangGraph", "PostgreSQL", "SQLAlchemy", "OpenAI", "Anthropic"],
  },
  {
    title: "Infra & Tooling",
    description: "Where things actually run.",
    items: ["AWS Lambda", "S3", "CodePipeline", "Docker", "Helm", "Prometheus", "OpenSearch"],
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
  { href: "#contact", label: "Contact" },
] as const;

// Internal routes that live outside the home-page scroll narrative.
export const routes = [
  { href: "/photography", label: "Photography" },
] as const;
