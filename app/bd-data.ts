export type EvidenceLevel = "A" | "B" | "C" | "D";

export type Company = {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  hq: string;
  region: "Europe" | "North America";
  fit: number;
  relationship: "Active" | "Warm" | "Mapped" | "Research";
  opportunities: number;
  verifiedAt: string;
  owner: string;
  nextAction: string;
  nextActionDate: string;
  focus: string[];
  modalities: string[];
  summary: string;
  accent: string;
  evidence: EvidenceLevel;
};

export type IntelNote = {
  companyId: string;
  title: string;
  body: string;
  source: "Official" | "BD Scholar" | "Eric note";
  level: EvidenceLevel;
  date: string;
};

export type Opportunity = {
  id: string;
  companyId: string;
  project: string;
  modality: string;
  stage: "Research" | "Targeting" | "Engaged" | "Diligence";
  owner: string;
  next: string;
  date: string;
};

export const companies: Company[] = [
  {
    id: "novartis",
    name: "Novartis",
    shortName: "Novartis",
    initials: "NV",
    hq: "Basel, CH",
    region: "Europe",
    fit: 94,
    relationship: "Active",
    opportunities: 3,
    verifiedAt: "24 Jul 2026",
    owner: "Eric",
    nextAction: "Frame extrahepatic RNA thesis",
    nextActionDate: "06 Aug",
    focus: ["Neuroscience", "Oncology", "Immunology"],
    modalities: ["RNA", "Radioligand", "xRNA delivery"],
    summary:
      "High-priority partner where modality strategy and external innovation signals overlap with XtalPi capabilities.",
    accent: "violet",
    evidence: "A",
  },
  {
    id: "amgen",
    name: "Amgen",
    shortName: "Amgen",
    initials: "AM",
    hq: "Thousand Oaks, US",
    region: "North America",
    fit: 89,
    relationship: "Warm",
    opportunities: 2,
    verifiedAt: "21 Jul 2026",
    owner: "Eric",
    nextAction: "Map discovery research sponsor",
    nextActionDate: "09 Aug",
    focus: ["Oncology", "Inflammation", "Rare disease"],
    modalities: ["Peptides", "Biologics", "Small molecules"],
    summary:
      "Strong discovery fit. The near-term task is to identify the scientific sponsor before approaching transactions.",
    accent: "amber",
    evidence: "B",
  },
  {
    id: "sanofi",
    name: "Sanofi",
    shortName: "Sanofi",
    initials: "SA",
    hq: "Paris, FR",
    region: "Europe",
    fit: 87,
    relationship: "Mapped",
    opportunities: 2,
    verifiedAt: "18 Jul 2026",
    owner: "Eric",
    nextAction: "Validate APAC external innovation route",
    nextActionDate: "12 Aug",
    focus: ["Immunology", "Rare disease", "Vaccines"],
    modalities: ["RNA", "AI discovery", "Antibodies"],
    summary:
      "Clear external innovation appetite; regional entry points and decision ownership still need stronger evidence.",
    accent: "cyan",
    evidence: "B",
  },
  {
    id: "astrazeneca",
    name: "AstraZeneca",
    shortName: "AstraZeneca",
    initials: "AZ",
    hq: "Cambridge, UK",
    region: "Europe",
    fit: 92,
    relationship: "Warm",
    opportunities: 4,
    verifiedAt: "17 Jul 2026",
    owner: "Eric",
    nextAction: "Package BBB platform proof points",
    nextActionDate: "04 Aug",
    focus: ["Oncology", "CVRM", "Neuroscience"],
    modalities: ["BBB delivery", "Peptides", "AI discovery"],
    summary:
      "Broad strategic fit with multiple possible doors. Prioritization is more valuable than adding more contacts.",
    accent: "rose",
    evidence: "B",
  },
  {
    id: "roche",
    name: "Roche",
    shortName: "Roche",
    initials: "RO",
    hq: "Basel, CH",
    region: "Europe",
    fit: 85,
    relationship: "Research",
    opportunities: 1,
    verifiedAt: "15 Jul 2026",
    owner: "Eric",
    nextAction: "Separate Pharma and pRED routes",
    nextActionDate: "15 Aug",
    focus: ["Oncology", "Neuroscience", "Ophthalmology"],
    modalities: ["RNA", "Diagnostics", "Biologics"],
    summary:
      "Attractive scientific fit, but the company map needs clearer separation of research, partnering and business units.",
    accent: "blue",
    evidence: "C",
  },
  {
    id: "pfizer",
    name: "Pfizer",
    shortName: "Pfizer",
    initials: "PF",
    hq: "New York, US",
    region: "North America",
    fit: 79,
    relationship: "Mapped",
    opportunities: 1,
    verifiedAt: "13 Jul 2026",
    owner: "Eric",
    nextAction: "Refresh post-reorganization owners",
    nextActionDate: "18 Aug",
    focus: ["Oncology", "Internal medicine", "Vaccines"],
    modalities: ["Small molecules", "ADCs", "Biologics"],
    summary:
      "The opportunity thesis is sound, while organization data has the highest refresh risk in the current map.",
    accent: "sky",
    evidence: "C",
  },
  {
    id: "biogen",
    name: "Biogen",
    shortName: "Biogen",
    initials: "BI",
    hq: "Cambridge, US",
    region: "North America",
    fit: 90,
    relationship: "Research",
    opportunities: 2,
    verifiedAt: "10 Jul 2026",
    owner: "Eric",
    nextAction: "Build CNS delivery hypothesis",
    nextActionDate: "11 Aug",
    focus: ["Neuroscience", "Rare disease", "Immunology"],
    modalities: ["BBB delivery", "RNA", "Biologics"],
    summary:
      "A focused neuroscience story could create a differentiated entry, provided it is anchored in translational evidence.",
    accent: "mint",
    evidence: "C",
  },
  {
    id: "boehringer",
    name: "Boehringer Ingelheim",
    shortName: "Boehringer",
    initials: "BI",
    hq: "Ingelheim, DE",
    region: "Europe",
    fit: 82,
    relationship: "Mapped",
    opportunities: 1,
    verifiedAt: "08 Jul 2026",
    owner: "Eric",
    nextAction: "Find China-to-global sponsor",
    nextActionDate: "20 Aug",
    focus: ["Cardiometabolic", "Oncology", "Mental health"],
    modalities: ["Peptides", "Small molecules", "AI discovery"],
    summary:
      "Promising fit for discovery collaboration; the internal route from regional scouting to global ownership needs validation.",
    accent: "orange",
    evidence: "C",
  },
  {
    id: "merck",
    name: "Merck & Co.",
    shortName: "Merck",
    initials: "MR",
    hq: "Rahway, US",
    region: "North America",
    fit: 80,
    relationship: "Research",
    opportunities: 0,
    verifiedAt: "Mapping queued",
    owner: "Eric",
    nextAction: "Capture the current BD leadership line",
    nextActionDate: "TBD",
    focus: ["Structure capture"],
    modalities: ["BD map expansion"],
    summary:
      "Included in Eric's ten-company relationship universe. Named owners and reporting lines remain an explicit capture task.",
    accent: "cyan",
    evidence: "D",
  },
  {
    id: "lilly",
    name: "Eli Lilly and Company",
    shortName: "Eli Lilly",
    initials: "LL",
    hq: "Indianapolis, US",
    region: "North America",
    fit: 78,
    relationship: "Research",
    opportunities: 0,
    verifiedAt: "Mapping queued",
    owner: "Eric",
    nextAction: "Capture the current BD leadership line",
    nextActionDate: "TBD",
    focus: ["Structure capture"],
    modalities: ["BD map expansion"],
    summary:
      "Included in Eric's ten-company relationship universe. Named owners and reporting lines remain an explicit capture task.",
    accent: "violet",
    evidence: "D",
  },
];

export const intelNotes: IntelNote[] = [
  {
    companyId: "novartis",
    title: "Modality expansion is a credible opening",
    body:
      "Public partnering language and portfolio moves support a conversation around RNA delivery and next-generation discovery platforms.",
    source: "Official",
    level: "A",
    date: "24 Jul 2026",
  },
  {
    companyId: "novartis",
    title: "Decision path likely begins before Transactions",
    body:
      "Use a scientific and Search & Evaluation sponsor to shape the thesis before treating the transactions team as the first destination.",
    source: "BD Scholar",
    level: "B",
    date: "22 Jul 2026",
  },
  {
    companyId: "novartis",
    title: "Eric relationship hypothesis",
    body:
      "Lead with extrahepatic delivery proof and a sharply scoped collaboration wedge; avoid a broad platform introduction.",
    source: "Eric note",
    level: "C",
    date: "25 Jul 2026",
  },
];

export const opportunities: Opportunity[] = [
  {
    id: "opp-01",
    companyId: "astrazeneca",
    project: "BBB shuttle discovery",
    modality: "CNS delivery",
    stage: "Engaged",
    owner: "Eric",
    next: "Send revised non-confidential deck",
    date: "04 Aug",
  },
  {
    id: "opp-02",
    companyId: "novartis",
    project: "Extrahepatic RNA delivery",
    modality: "RNA",
    stage: "Targeting",
    owner: "Eric",
    next: "Confirm S&E sponsor",
    date: "06 Aug",
  },
  {
    id: "opp-03",
    companyId: "amgen",
    project: "Macrocycle discovery",
    modality: "Peptide",
    stage: "Research",
    owner: "Eric",
    next: "Map discovery leadership",
    date: "09 Aug",
  },
  {
    id: "opp-04",
    companyId: "sanofi",
    project: "AI-enabled immunology",
    modality: "AI discovery",
    stage: "Targeting",
    owner: "Eric",
    next: "Validate APAC route",
    date: "12 Aug",
  },
  {
    id: "opp-05",
    companyId: "biogen",
    project: "CNS delivery platform",
    modality: "BBB delivery",
    stage: "Research",
    owner: "Eric",
    next: "Draft evidence wedge",
    date: "11 Aug",
  },
  {
    id: "opp-06",
    companyId: "astrazeneca",
    project: "Cyclic peptide program",
    modality: "Peptide",
    stage: "Diligence",
    owner: "Eric",
    next: "Answer data-room questions",
    date: "02 Aug",
  },
];

export const evidenceLegend = [
  { level: "A", label: "Officially verified", description: "Company or primary source" },
  { level: "B", label: "Corroborated", description: "Article plus supporting evidence" },
  { level: "C", label: "Working hypothesis", description: "Useful, needs confirmation" },
  { level: "D", label: "Unverified", description: "Lead only; do not rely on it" },
] as const;
