export type EnterpriseOption = {
  value: string;
  label: string;
  hint: string;
};

export type ExperienceBandOption = EnterpriseOption & {
  minYears: number;
};

export type TechnologyGroup = {
  id: string;
  label: string;
  items: string[];
};

type CategoryProfile = {
  matchers: string[];
  skills: string[];
  tools: string[];
  industries: string[];
  projectTypes: string[];
  workModes: string[];
  deliverables: string[];
};

export const WORK_LOCATION_OPTIONS: EnterpriseOption[] = [
  { value: "REMOTE", label: "Remote", hint: "Fully distributed delivery with async-friendly collaboration." },
  { value: "HYBRID", label: "Hybrid", hint: "Blend on-site sessions with remote execution for key milestones." },
  { value: "ON_SITE", label: "On-Site", hint: "Work primarily from the client location or field environment." },
  { value: "GLOBAL_ASYNC", label: "Global Async", hint: "Follow-the-sun delivery across multiple time zones." },
];

export const ENGAGEMENT_TYPE_OPTIONS: EnterpriseOption[] = [
  { value: "PROJECT_BASED", label: "Project Based", hint: "Defined scope, clear deliverables, and milestone-driven execution." },
  { value: "CONTRACT", label: "Contract", hint: "Time-bound specialist engagement with delivery accountability." },
  { value: "LONG_TERM_PARTNERSHIP", label: "Long-Term Partnership", hint: "Strategic ongoing support for a roadmap or operating model." },
  { value: "RETAINER", label: "Retainer", hint: "Recurring capacity reserved each month for priority work." },
];

export const PRICING_MODEL_OPTIONS: EnterpriseOption[] = [
  { value: "FIXED_PRICE", label: "Fixed Price", hint: "Best for tightly scoped work packages and defined outcomes." },
  { value: "HOURLY", label: "Hourly", hint: "Flexible execution when backlog, discovery, or support volume changes." },
  { value: "RETAINER", label: "Retainer", hint: "Predictable recurring commercial structure for ongoing delivery." },
  { value: "VOLUME_BASED", label: "Volume Based", hint: "Useful for content, moderation, testing, or repeatable production work." },
];

export const DELIVERABLE_TYPE_OPTIONS: EnterpriseOption[] = [
  { value: "IMAGE_DESIGN", label: "Image / Design", hint: "Brand systems, interfaces, graphics, and visual deliverables." },
  { value: "VIDEO_PRODUCTION", label: "Video Production", hint: "Motion, editing, demos, explainers, and campaign video assets." },
  { value: "AUDIO_PRODUCTION", label: "Audio Production", hint: "Podcasts, mastering, sound design, voice, and audio packaging." },
  { value: "DOCUMENT_DEVELOPMENT", label: "Document Development", hint: "Technical documents, SOPs, reports, proposals, and templates." },
  { value: "MIXED", label: "Mixed", hint: "Multi-format engagements spanning product, content, and operational outputs." },
];

export const TEAM_SIZE_OPTIONS: EnterpriseOption[] = [
  { value: "Solo Specialist", label: "Solo Specialist", hint: "Ideal for focused expert execution." },
  { value: "Cross-Functional Team", label: "Cross-Functional Team", hint: "Best when design, engineering, and QA need to move together." },
  { value: "Boutique Studio", label: "Boutique Studio", hint: "High-touch delivery partner for premium creative or product work." },
  { value: "Agency Partner", label: "Agency Partner", hint: "Scalable managed capacity for parallel workstreams." },
  { value: "Managed Delivery Pod", label: "Managed Delivery Pod", hint: "Embedded team with clear SLAs and governance." },
];

export const EXPERIENCE_BAND_OPTIONS: ExperienceBandOption[] = [
  { value: "ENTRY", label: "Entry", hint: "Suitable for foundational execution with oversight.", minYears: 1 },
  { value: "MID", label: "Mid-Level", hint: "Strong independent contributor for mainstream delivery.", minYears: 3 },
  { value: "SENIOR", label: "Senior", hint: "Owns workstreams, architecture decisions, and stakeholder alignment.", minYears: 5 },
  { value: "PRINCIPAL", label: "Principal", hint: "Handles critical systems, program complexity, and executive expectations.", minYears: 8 },
];

export const INDUSTRY_OPTIONS: EnterpriseOption[] = [
  { value: "SaaS", label: "SaaS", hint: "Cloud software and subscription product businesses." },
  { value: "Fintech", label: "Fintech", hint: "Payments, banking, insurance, and regulated finance products." },
  { value: "Healthcare", label: "Healthcare", hint: "Providers, digital health, care operations, and health platforms." },
  { value: "Insurance", label: "Insurance", hint: "Claims, underwriting, fraud, and policy operations." },
  { value: "E-commerce", label: "E-commerce", hint: "Retail, marketplaces, subscriptions, and digital commerce." },
  { value: "Consumer", label: "Consumer", hint: "Consumer brands, apps, loyalty, and audience growth." },
  { value: "Education", label: "Education", hint: "EdTech, training providers, and institutional learning programs." },
  { value: "Media", label: "Media", hint: "Publishing, streaming, community, and content businesses." },
  { value: "Logistics", label: "Logistics", hint: "Supply chain, transportation, and operational execution systems." },
  { value: "Government", label: "Government", hint: "Public services, GovTech, and compliance-heavy programs." },
  { value: "Manufacturing", label: "Manufacturing", hint: "Industrial operations, production, and quality systems." },
  { value: "Energy", label: "Energy", hint: "Utilities, renewables, infrastructure, and energy operations." },
  { value: "Real Estate", label: "Real Estate", hint: "Property operations, PropTech, and built-environment services." },
  { value: "Telecom", label: "Telecom", hint: "Connectivity, networks, wireless, and service operations." },
  { value: "Gaming", label: "Gaming", hint: "Interactive products, live operations, and player ecosystems." },
  { value: "Enterprise Services", label: "Enterprise Services", hint: "B2B operations, consulting, and service delivery firms." },
];

export const ENTERPRISE_TECHNOLOGY_GROUPS: TechnologyGroup[] = [
  { id: "frontend", label: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vue", "Angular", "Design Systems", "Accessibility"] },
  { id: "backend", label: "Backend", items: ["Java", "Spring Boot", "Node.js", "Express", "Python", "FastAPI", "REST APIs", "GraphQL"] },
  { id: "data-ai", label: "Data & AI", items: ["Python", "SQL", "dbt", "Airflow", "Snowflake", "Databricks", "Prompt Engineering", "RAG"] },
  { id: "cloud-devops", label: "Cloud & DevOps", items: ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "Observability"] },
  { id: "design", label: "Design", items: ["Figma", "Adobe Illustrator", "Adobe Photoshop", "Framer", "After Effects", "Brand Systems", "Wireframing", "Prototyping"] },
  { id: "media", label: "Media", items: ["Premiere Pro", "DaVinci Resolve", "After Effects", "Audition", "Pro Tools", "Color Grading", "Storyboarding", "Motion Design"] },
  { id: "marketing", label: "Marketing", items: ["Google Ads", "GA4", "HubSpot", "Salesforce", "Meta Ads", "Klaviyo", "SEO", "Marketing Automation"] },
  { id: "operations", label: "Operations", items: ["Jira", "Confluence", "Notion", "Asana", "Miro", "Smartsheet", "SOPs", "Vendor Management"] },
  { id: "security", label: "Security", items: ["IAM", "SIEM", "EDR", "SAST", "DAST", "Cloud Security", "Compliance", "Threat Modeling"] },
  { id: "support", label: "Support", items: ["Zendesk", "Intercom", "Freshdesk", "Service Cloud", "Knowledge Base", "QA Coaching", "CSAT", "Escalations"] },
];

const ROOT_CATEGORY_PROFILES: Record<string, Omit<CategoryProfile, "matchers">> = {
  "software-it": {
    skills: ["React", "Next.js", "TypeScript", "Node.js", "Java", "API Design", "System Design", "Testing", "Cloud Architecture", "CI/CD"],
    tools: ["GitHub", "Docker", "Kubernetes", "Postman", "Terraform", "Datadog"],
    industries: ["SaaS", "Fintech", "Enterprise Services"],
    projectTypes: ["PROJECT_BASED", "CONTRACT", "LONG_TERM_PARTNERSHIP"],
    workModes: ["REMOTE", "HYBRID", "GLOBAL_ASYNC"],
    deliverables: ["MIXED", "DOCUMENT_DEVELOPMENT"],
  },
  "data-ai": {
    skills: ["Python", "SQL", "Machine Learning", "Data Engineering", "Prompt Engineering", "LLM Evaluation", "Analytics Engineering", "MLOps"],
    tools: ["Jupyter", "dbt", "Airflow", "MLflow", "Snowflake", "BigQuery"],
    industries: ["SaaS", "Fintech", "Healthcare"],
    projectTypes: ["PROJECT_BASED", "CONTRACT", "LONG_TERM_PARTNERSHIP"],
    workModes: ["REMOTE", "GLOBAL_ASYNC", "HYBRID"],
    deliverables: ["MIXED", "DOCUMENT_DEVELOPMENT"],
  },
  "cybersecurity": {
    skills: ["Security Architecture", "IAM", "Penetration Testing", "Threat Modeling", "Incident Response", "GRC"],
    tools: ["Okta", "Splunk", "CrowdStrike", "Burp Suite", "Snyk", "Defender"],
    industries: ["Fintech", "Healthcare", "Government"],
    projectTypes: ["CONTRACT", "PROJECT_BASED", "LONG_TERM_PARTNERSHIP"],
    workModes: ["REMOTE", "HYBRID", "ON_SITE"],
    deliverables: ["DOCUMENT_DEVELOPMENT", "MIXED"],
  },
  "design-creative": {
    skills: ["Figma", "Design Systems", "UX Research", "Visual Design", "Branding", "Motion Design", "Prototyping", "Creative Direction"],
    tools: ["Figma", "Adobe Creative Cloud", "Framer", "After Effects", "Illustrator", "Photoshop"],
    industries: ["SaaS", "E-commerce", "Media"],
    projectTypes: ["PROJECT_BASED", "RETAINER", "CONTRACT"],
    workModes: ["REMOTE", "HYBRID", "GLOBAL_ASYNC"],
    deliverables: ["IMAGE_DESIGN", "VIDEO_PRODUCTION", "MIXED"],
  },
  "media-entertainment": {
    skills: ["Video Editing", "Sound Design", "Podcast Production", "Storyboarding", "Color Grading", "Motion Graphics"],
    tools: ["Premiere Pro", "DaVinci Resolve", "After Effects", "Audition", "Pro Tools", "Frame.io"],
    industries: ["Media", "Education", "E-commerce"],
    projectTypes: ["PROJECT_BASED", "RETAINER", "CONTRACT"],
    workModes: ["REMOTE", "HYBRID", "ON_SITE"],
    deliverables: ["VIDEO_PRODUCTION", "AUDIO_PRODUCTION", "MIXED"],
  },
  "writing-translation": {
    skills: ["Technical Writing", "Copywriting", "Localization", "Editing", "SEO Writing", "Documentation"],
    tools: ["Google Docs", "Notion", "Confluence", "Grammarly", "Phrase", "MemoQ"],
    industries: ["SaaS", "Healthcare", "Government"],
    projectTypes: ["PROJECT_BASED", "RETAINER", "CONTRACT"],
    workModes: ["REMOTE", "GLOBAL_ASYNC", "HYBRID"],
    deliverables: ["DOCUMENT_DEVELOPMENT", "MIXED"],
  },
  "business-management": {
    skills: ["Program Management", "PMO", "Agile Delivery", "Business Analysis", "Process Improvement", "Stakeholder Management"],
    tools: ["Jira", "Smartsheet", "Miro", "Confluence", "Asana", "Monday.com"],
    industries: ["Enterprise Services", "SaaS", "Government"],
    projectTypes: ["CONTRACT", "LONG_TERM_PARTNERSHIP", "RETAINER"],
    workModes: ["HYBRID", "REMOTE", "ON_SITE"],
    deliverables: ["DOCUMENT_DEVELOPMENT", "MIXED"],
  },
  "finance-accounting": {
    skills: ["FP&A", "Bookkeeping", "Financial Modeling", "Audit", "Payroll", "Treasury"],
    tools: ["Excel", "NetSuite", "QuickBooks", "Xero", "SAP", "Power BI"],
    industries: ["Fintech", "Healthcare", "Enterprise Services"],
    projectTypes: ["CONTRACT", "RETAINER", "LONG_TERM_PARTNERSHIP"],
    workModes: ["REMOTE", "HYBRID", "ON_SITE"],
    deliverables: ["DOCUMENT_DEVELOPMENT", "MIXED"],
  },
  "sales-marketing": {
    skills: ["SEO", "Paid Media", "Lifecycle Marketing", "Marketing Automation", "CRM Operations", "Brand Strategy", "Content Strategy", "Funnel Analytics"],
    tools: ["Google Ads", "GA4", "HubSpot", "Salesforce", "Meta Ads Manager", "Klaviyo"],
    industries: ["SaaS", "E-commerce", "Enterprise Services"],
    projectTypes: ["PROJECT_BASED", "RETAINER", "LONG_TERM_PARTNERSHIP"],
    workModes: ["REMOTE", "HYBRID", "GLOBAL_ASYNC"],
    deliverables: ["MIXED", "DOCUMENT_DEVELOPMENT", "IMAGE_DESIGN"],
  },
  "customer-support": {
    skills: ["Customer Success", "Technical Support", "Knowledge Base Management", "Support QA", "Community Moderation", "Escalation Management"],
    tools: ["Zendesk", "Intercom", "Freshdesk", "Salesforce Service Cloud", "Notion", "Looker"],
    industries: ["SaaS", "E-commerce", "Telecom"],
    projectTypes: ["CONTRACT", "RETAINER", "LONG_TERM_PARTNERSHIP"],
    workModes: ["REMOTE", "HYBRID", "GLOBAL_ASYNC"],
    deliverables: ["DOCUMENT_DEVELOPMENT", "MIXED"],
  },
  "healthcare-medical": {
    skills: ["Clinical Documentation", "Medical Billing", "Health Information Management", "Care Coordination", "Quality Improvement"],
    tools: ["Epic", "Cerner", "Excel", "Power BI", "ICD-10", "HIPAA Controls"],
    industries: ["Healthcare", "Government", "Insurance"],
    projectTypes: ["CONTRACT", "LONG_TERM_PARTNERSHIP", "PROJECT_BASED"],
    workModes: ["ON_SITE", "HYBRID", "REMOTE"],
    deliverables: ["DOCUMENT_DEVELOPMENT", "MIXED"],
  },
  "legal-compliance": {
    skills: ["Contract Review", "Policy Drafting", "Privacy Compliance", "Audit Readiness", "Regulatory Analysis"],
    tools: ["DocuSign", "Ironclad", "OneTrust", "Microsoft Word", "Relativity", "Excel"],
    industries: ["Fintech", "Healthcare", "Government"],
    projectTypes: ["CONTRACT", "RETAINER", "LONG_TERM_PARTNERSHIP"],
    workModes: ["HYBRID", "REMOTE", "ON_SITE"],
    deliverables: ["DOCUMENT_DEVELOPMENT", "MIXED"],
  },
  "retail-e-commerce": {
    skills: ["Shopify", "Merchandising", "Marketplace Operations", "Catalog Management", "Retention Marketing", "Conversion Optimization"],
    tools: ["Shopify", "Klaviyo", "GA4", "Amazon Seller Central", "Stripe", "Gorgias"],
    industries: ["E-commerce", "Retail", "Consumer"],
    projectTypes: ["PROJECT_BASED", "RETAINER", "LONG_TERM_PARTNERSHIP"],
    workModes: ["REMOTE", "HYBRID", "GLOBAL_ASYNC"],
    deliverables: ["MIXED", "IMAGE_DESIGN", "DOCUMENT_DEVELOPMENT"],
  },
  "human-resources": {
    skills: ["Recruiting", "HRIS Administration", "Compensation", "Employee Relations", "Learning Programs"],
    tools: ["Workday", "Greenhouse", "Lever", "LinkedIn Recruiter", "Culture Amp", "Lattice"],
    industries: ["Enterprise Services", "SaaS", "Healthcare"],
    projectTypes: ["CONTRACT", "RETAINER", "LONG_TERM_PARTNERSHIP"],
    workModes: ["HYBRID", "REMOTE", "ON_SITE"],
    deliverables: ["DOCUMENT_DEVELOPMENT", "MIXED"],
  },
  "gaming-esports": {
    skills: ["Unity", "Unreal Engine", "Gameplay Programming", "LiveOps", "Player Analytics", "Community Operations"],
    tools: ["Unity", "Unreal Engine", "Blender", "FMOD", "PlayFab", "Discord"],
    industries: ["Gaming", "Media", "Consumer"],
    projectTypes: ["PROJECT_BASED", "LONG_TERM_PARTNERSHIP", "CONTRACT"],
    workModes: ["REMOTE", "HYBRID", "GLOBAL_ASYNC"],
    deliverables: ["MIXED", "VIDEO_PRODUCTION", "IMAGE_DESIGN"],
  },
  default: {
    skills: ["Project Delivery", "Stakeholder Communication", "Documentation", "Quality Assurance", "Analysis", "Execution"],
    tools: ["Excel", "Notion", "Miro", "Confluence", "Slack", "Google Workspace"],
    industries: ["Enterprise Services", "SaaS", "Government"],
    projectTypes: ["PROJECT_BASED", "CONTRACT"],
    workModes: ["REMOTE", "HYBRID", "ON_SITE"],
    deliverables: ["MIXED", "DOCUMENT_DEVELOPMENT"],
  },
};

const CATEGORY_PROFILES: CategoryProfile[] = [
  {
    matchers: ["motion-graphics", "3d-motion-animation", "micro-interaction-design"],
    skills: ["After Effects", "Motion Design", "Lottie", "Storyboarding", "Animation Systems", "Visual Timing"],
    tools: ["After Effects", "Illustrator", "Figma", "Rive", "Premiere Pro"],
    industries: ["SaaS", "Media", "E-commerce"],
    projectTypes: ["PROJECT_BASED", "RETAINER"],
    workModes: ["REMOTE", "HYBRID"],
    deliverables: ["VIDEO_PRODUCTION", "IMAGE_DESIGN", "MIXED"],
  },
  {
    matchers: ["ui-design-systems", "prototyping-wireframing"],
    skills: ["Figma", "Design Systems", "Interaction Design", "Accessibility", "UX Research", "Token Architecture"],
    tools: ["Figma", "FigJam", "Zeroheight", "Storybook", "Framer"],
    industries: ["SaaS", "Fintech", "Healthcare"],
    projectTypes: ["PROJECT_BASED", "CONTRACT", "RETAINER"],
    workModes: ["REMOTE", "HYBRID"],
    deliverables: ["IMAGE_DESIGN", "DOCUMENT_DEVELOPMENT", "MIXED"],
  },
  {
    matchers: ["podcast-production", "sound-engineering"],
    skills: ["Audio Editing", "Mixing", "Mastering", "Noise Reduction", "Episode Packaging", "RSS Publishing"],
    tools: ["Audition", "Pro Tools", "Descript", "Logic Pro", "Riverside"],
    industries: ["Media", "Education", "Enterprise Services"],
    projectTypes: ["RETAINER", "PROJECT_BASED"],
    workModes: ["REMOTE", "HYBRID"],
    deliverables: ["AUDIO_PRODUCTION", "MIXED"],
  },
  {
    matchers: ["video-editing", "cinematography", "visual-effects", "color-grading"],
    skills: ["Video Editing", "Color Grading", "Motion Graphics", "Storyboarding", "Short-Form Production", "Creative Review"],
    tools: ["Premiere Pro", "DaVinci Resolve", "After Effects", "Frame.io", "Media Encoder"],
    industries: ["Media", "SaaS", "E-commerce"],
    projectTypes: ["PROJECT_BASED", "RETAINER"],
    workModes: ["REMOTE", "HYBRID", "ON_SITE"],
    deliverables: ["VIDEO_PRODUCTION", "MIXED"],
  },
  {
    matchers: ["prompt-engineering-llm-apps", "ai-evaluation-red-teaming", "responsible-ai-model-risk"],
    skills: ["Prompt Engineering", "RAG", "Evaluation Design", "Safety Testing", "Agent Workflows", "Model Governance"],
    tools: ["OpenAI API", "LangChain", "Vector Databases", "Weights & Biases", "Jupyter"],
    industries: ["SaaS", "Fintech", "Healthcare"],
    projectTypes: ["PROJECT_BASED", "CONTRACT", "LONG_TERM_PARTNERSHIP"],
    workModes: ["REMOTE", "GLOBAL_ASYNC"],
    deliverables: ["MIXED", "DOCUMENT_DEVELOPMENT"],
  },
  {
    matchers: ["web-application-development", "desktop-cross-platform-apps", "api-integration-engineering"],
    skills: ["React", "TypeScript", "Node.js", "API Design", "Integration Architecture", "Testing"],
    tools: ["GitHub", "Docker", "Postman", "Vercel", "Datadog"],
    industries: ["SaaS", "Fintech", "Enterprise Services"],
    projectTypes: ["PROJECT_BASED", "CONTRACT", "LONG_TERM_PARTNERSHIP"],
    workModes: ["REMOTE", "HYBRID", "GLOBAL_ASYNC"],
    deliverables: ["MIXED", "DOCUMENT_DEVELOPMENT"],
  },
  {
    matchers: ["mobile-application-development"],
    skills: ["React Native", "Swift", "Kotlin", "Flutter", "Mobile QA", "App Store Delivery"],
    tools: ["Xcode", "Android Studio", "Firebase", "Expo", "TestFlight"],
    industries: ["SaaS", "Fintech", "Healthcare"],
    projectTypes: ["PROJECT_BASED", "CONTRACT"],
    workModes: ["REMOTE", "HYBRID"],
    deliverables: ["MIXED", "IMAGE_DESIGN"],
  },
  {
    matchers: ["seo-sem", "email-marketing", "marketing-automation-crm"],
    skills: ["SEO", "Paid Search", "Lifecycle Marketing", "CRM Automation", "Attribution", "Campaign Operations"],
    tools: ["Google Ads", "GA4", "HubSpot", "Salesforce", "Klaviyo", "Ahrefs"],
    industries: ["SaaS", "E-commerce", "Enterprise Services"],
    projectTypes: ["RETAINER", "PROJECT_BASED", "LONG_TERM_PARTNERSHIP"],
    workModes: ["REMOTE", "GLOBAL_ASYNC"],
    deliverables: ["MIXED", "DOCUMENT_DEVELOPMENT"],
  },
  {
    matchers: ["api-documentation", "sops-playbooks", "rfp-proposal-writing"],
    skills: ["Technical Writing", "API Documentation", "Process Documentation", "Information Architecture", "Knowledge Design"],
    tools: ["Confluence", "Notion", "Swagger", "Postman", "Google Docs"],
    industries: ["SaaS", "Government", "Healthcare"],
    projectTypes: ["PROJECT_BASED", "CONTRACT", "RETAINER"],
    workModes: ["REMOTE", "HYBRID"],
    deliverables: ["DOCUMENT_DEVELOPMENT"],
  },
];

const ROOT_TECH_GROUPS: Record<string, string[]> = {
  "software-it": ["frontend", "backend", "cloud-devops"],
  "data-ai": ["data-ai", "backend", "cloud-devops"],
  "cybersecurity": ["security", "cloud-devops", "backend"],
  "design-creative": ["design", "frontend", "operations"],
  "media-entertainment": ["media", "design", "operations"],
  "writing-translation": ["operations", "design", "marketing"],
  "business-management": ["operations", "backend", "support"],
  "finance-accounting": ["operations", "backend", "data-ai"],
  "sales-marketing": ["marketing", "design", "operations"],
  "customer-support": ["support", "operations", "marketing"],
  "healthcare-medical": ["operations", "data-ai", "support"],
  "legal-compliance": ["operations", "security", "backend"],
  "retail-e-commerce": ["marketing", "frontend", "operations"],
  "human-resources": ["operations", "support", "marketing"],
  "gaming-esports": ["frontend", "media", "design"],
  default: ["operations", "backend", "design"],
};

function unique(values: string[], limit?: number) {
  const deduped: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (!deduped.includes(trimmed)) {
      deduped.push(trimmed);
    }
    if (typeof limit === "number" && deduped.length >= limit) {
      break;
    }
  }

  return deduped;
}

function resolveRootCategoryId(categoryId?: string) {
  if (!categoryId) return "";
  return categoryId.split(".")[0] ?? "";
}

export function getCategoryProfile(categoryId?: string) {
  const normalized = (categoryId ?? "").toLowerCase();
  const exact = CATEGORY_PROFILES.find((profile) =>
    profile.matchers.some((matcher) => normalized.includes(matcher))
  );

  if (exact) {
    return exact;
  }

  const rootId = resolveRootCategoryId(normalized);
  const fallback = ROOT_CATEGORY_PROFILES[rootId] ?? ROOT_CATEGORY_PROFILES.default;

  return {
    matchers: [rootId || "default"],
    ...fallback,
  };
}

export function getSuggestedSkills(categoryId?: string, limit = 12) {
  return unique(getCategoryProfile(categoryId).skills, limit);
}

export function getSuggestedTools(categoryId?: string, limit = 10) {
  return unique(getCategoryProfile(categoryId).tools, limit);
}

export function getSuggestedIndustries(categoryId?: string, limit = 6) {
  return unique(getCategoryProfile(categoryId).industries, limit);
}

export function getSuggestedProjectTypes(categoryId?: string) {
  return unique(getCategoryProfile(categoryId).projectTypes);
}

export function getSuggestedWorkModes(categoryId?: string) {
  return unique(getCategoryProfile(categoryId).workModes);
}

export function getSuggestedDeliverableTypes(categoryId?: string) {
  return unique(getCategoryProfile(categoryId).deliverables);
}

export function getTechnologyGroupsForCategory(categoryId?: string) {
  const rootId = resolveRootCategoryId(categoryId);
  const groupIds = ROOT_TECH_GROUPS[rootId] ?? ROOT_TECH_GROUPS.default;

  return groupIds
    .map((groupId) => ENTERPRISE_TECHNOLOGY_GROUPS.find((group) => group.id === groupId))
    .filter((group): group is TechnologyGroup => Boolean(group));
}
