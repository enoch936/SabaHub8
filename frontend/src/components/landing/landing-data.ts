import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  DollarSign,
  FolderKanban,
  Globe,
  MessageSquareText,
  SearchCheck,
  Search,
  Shield,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

export type LandingIconItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
};

export const NAV_ITEMS = [
  { href: "#categories", label: "Find Talent" },
  { href: "#marketplace", label: "Marketplace" },
  { href: "#paths", label: "How It Works" },
  { href: "#enterprise", label: "Enterprise" },
  { href: "#stories", label: "Success Stories" },
] as const;

export const HERO_STATS = [
  { label: "Active Freelancers", value: "500K+" },
  { label: "Jobs Posted", value: "2M+" },
  { label: "Paid to Freelancers", value: "$5B+" },
] as const;

export const HERO_AUDIENCES = {
  employer: {
    label: "Employer",
    icon: BriefcaseBusiness,
    description: "Post jobs, review applicants, and hire from one workspace.",
    primaryLabel: "Post a Job",
    primaryHref: "/register",
    secondaryLabel: "See Hiring Flow",
    secondaryHref: "#paths",
    highlights: ["Verified profiles", "Fast proposals", "Milestone payouts"],
    floatingLabel: "Top match ready",
    floatingValue: "Senior Frontend Engineer",
    floatingMeta: "14 proposals in the first hour",
    image:
      "https://images.unsplash.com/photo-1759884247160-27b8465544b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwdGVhbSUyMGJyYWluc3Rvcm1pbmd8ZW58MXx8fHwxNzc0NzYwOTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    imageAlt: "Hiring team reviewing freelancer candidates",
  },
  freelancer: {
    label: "Freelancer",
    icon: Target,
    description: "Find work, show your services, and get paid clearly.",
    primaryLabel: "Find Work",
    primaryHref: "/jobs",
    secondaryLabel: "Create My Profile",
    secondaryHref: "/register",
    highlights: ["Portfolio first", "Trusted clients", "Protected earnings"],
    floatingLabel: "New job matched",
    floatingValue: "Mobile App Designer",
    floatingMeta: "$4,500 budget • 2 days old",
    image:
      "https://images.unsplash.com/photo-1743796055672-438d6aa0b05e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGxhcHRvcCUyMGNvZmZlZXxlbnwxfHx8fDE3NzQ4MDg4ODR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    imageAlt: "Freelancer working remotely with a laptop",
  },
} as const;

export const TRUST_POINTS = [
  {
    icon: SearchCheck,
    title: "Clear discovery",
    description: "People quickly see where to hire and where to work.",
  },
  {
    icon: MessageSquareText,
    title: "Faster decisions",
    description: "Applications, chat, contracts, and payouts stay connected.",
  },
  {
    icon: WalletCards,
    title: "Safer outcomes",
    description: "Protected payments help both sides trust the platform.",
  },
] as const;

export const USER_PATHS = [
  {
    audience: "Employer" as const,
    icon: BriefcaseBusiness,
    title: "For employers",
    description: "Move from brief to contract without switching tools.",
    ctaLabel: "Start Hiring",
    ctaHref: "/register",
    steps: [
      { icon: FolderKanban, title: "Post a job", detail: "Add budget, timeline, and skills." },
      { icon: SearchCheck, title: "Review proposals", detail: "Compare fit and proof of work." },
      { icon: BadgeCheck, title: "Hire", detail: "Start contracts and milestone payments." },
    ],
  },
  {
    audience: "Freelancer" as const,
    icon: Target,
    title: "For freelancers",
    description: "Find clients, show your strengths, and keep work organized.",
    ctaLabel: "Browse Jobs",
    ctaHref: "/jobs",
    steps: [
      { icon: BadgeCheck, title: "Build your profile", detail: "Show your skills, work, and pricing." },
      { icon: MessageSquareText, title: "Apply", detail: "Send clear, structured proposals." },
      { icon: WalletCards, title: "Get paid", detail: "Track work, contracts, and payouts." },
    ],
  },
] as const;

export const MARKETPLACE_JOBS = [
  {
    title: "Senior Frontend Engineer for Creator Platform",
    company: "Northstar Labs",
    budget: "$5,800 - $8,400",
    timeline: "2 to 4 weeks",
    tags: ["React", "Design systems", "Remote"],
  },
  {
    title: "Brand Designer for SaaS Product Refresh",
    company: "BrightNest",
    budget: "$3,200 - $5,900",
    timeline: "1 to 3 weeks",
    tags: ["Branding", "Figma", "Fast turnaround"],
  },
  {
    title: "Growth Marketer for PLG Funnel Optimization",
    company: "LaunchGrid",
    budget: "$2,900 - $4,300",
    timeline: "Ongoing",
    tags: ["SEO", "Content", "Analytics"],
  },
] as const;

export const MARKETPLACE_TALENT = [
  {
    name: "Maya Solomon",
    role: "Product Designer",
    rate: "$55/hr",
    success: "98% success",
    skills: ["UI systems", "Mobile UX", "Prototyping"],
  },
  {
    name: "Daniel Kimani",
    role: "Full-Stack Developer",
    rate: "$72/hr",
    success: "97% success",
    skills: ["Next.js", "Spring Boot", "API design"],
  },
  {
    name: "Ruth Bekele",
    role: "Content Strategist",
    rate: "$38/hr",
    success: "95% success",
    skills: ["B2B copy", "SEO", "Content operations"],
  },
] as const;

export const FEATURES: LandingIconItem[] = [
  {
    icon: Search,
    title: "Smart matching",
    description: "Match by skill, budget, and timeline.",
    gradientFrom: "#60a5fa",
    gradientTo: "#06b6d4",
  },
  {
    icon: Shield,
    title: "Secure payments",
    description: "Use milestones, protected releases, and fraud checks.",
    gradientFrom: "#4ade80",
    gradientTo: "#10b981",
  },
  {
    icon: Globe,
    title: "Global talent",
    description: "Hire across design, engineering, marketing, AI, and operations.",
    gradientFrom: "#c084fc",
    gradientTo: "#ec4899",
  },
  {
    icon: Award,
    title: "Verified profiles",
    description: "Review profiles, portfolios, ratings, and work history.",
    gradientFrom: "#fbbf24",
    gradientTo: "#f97316",
  },
  {
    icon: DollarSign,
    title: "Flexible pricing",
    description: "Use hourly, fixed-price, or milestone-based work.",
    gradientFrom: "#fb7185",
    gradientTo: "#f43f5e",
  },
  {
    icon: Users,
    title: "Team collaboration",
    description: "Keep messages, contracts, and project work together.",
    gradientFrom: "#818cf8",
    gradientTo: "#a855f7",
  },
  {
    icon: TrendingUp,
    title: "Analytics",
    description: "Track hiring speed, budgets, and delivery progress.",
    gradientFrom: "#f472b6",
    gradientTo: "#ef4444",
  },
  {
    icon: Zap,
    title: "Fast hiring",
    description: "Post, review, and move strong candidates into contracts quickly.",
    gradientFrom: "#22d3ee",
    gradientTo: "#3b82f6",
  },
] as const;

export const VIDEO_STORIES = [
  {
    title: "Enterprise Solutions",
    description: "Support, faster matching, and better operating control.",
    thumbnail:
      "https://images.unsplash.com/photo-1758519290832-c7f1a5fb5c45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB2aWRlbyUyMGNhbGwlMjBtZWV0aW5nfGVufDF8fHx8MTc3NDgwODg4NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "2:34",
    videoSrc: "/footage/video/6193409-hd_1920_1080_30fps.mp4",
  },
  {
    title: "How It Works",
    description: "See the flow from posting to hiring and delivery.",
    thumbnail:
      "https://images.unsplash.com/photo-1728281144091-b743062a9bf0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbmVyJTIwd29ya3NwYWNlfGVufDF8fHx8MTc3NDczNTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "3:12",
    videoSrc: "/footage/video/4974882-hd_1080_1920_25fps.mp4",
  },
  {
    title: "Success Stories",
    description: "Hear how teams and freelancers use SabaHub.",
    thumbnail:
      "https://images.unsplash.com/photo-1745847768380-2caeadbb3b71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGhhbmRzaGFrZSUyMHBhcnRuZXJzaGlwfGVufDF8fHx8MTc3NDc1MTA1M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "4:45",
    videoSrc: "/footage/video/6517587-hd_1920_1080_30fps.mp4",
  },
  {
    title: "Platform Security",
    description: "See payment protection and contract tracking.",
    thumbnail:
      "https://images.unsplash.com/photo-1608306448197-e83633f1261c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjBjb2RpbmclMjBzY3JlZW58ZW58MXx8fHwxNzc0NzY2NTAzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "1:58",
    videoSrc: "/footage/video/6192984-hd_1920_1080_30fps.mp4",
  },
  {
    title: "Global Reach",
    description: "Work across borders without losing clarity.",
    thumbnail:
      "https://images.unsplash.com/photo-1759752394757-323a0adc0d62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZW1vdGUlMjB0ZWFtJTIwY29sbGFib3JhdGlvbnxlbnwxfHx8fDE3NzQ4MDg4ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "2:20",
    videoSrc: "/footage/video/3018533-hd_1920_1080_24fps.mp4",
  },
] as const;

export const TALENT_CATEGORIES = [
  {
    name: "Development & IT",
    jobs: "245K+",
    image:
      "https://images.unsplash.com/photo-1608306448197-e83633f1261c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjBjb2RpbmclMjBzY3JlZW58ZW58MXx8fHwxNzc0NzY2NTAzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    skills: ["Web Development", "Mobile Apps", "AI/ML", "DevOps"],
  },
  {
    name: "Design & Creative",
    jobs: "189K+",
    image:
      "https://images.unsplash.com/photo-1728281144091-b743062a9bf0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbmVyJTIwd29ya3NwYWNlfGVufDF8fHx8MTc3NDczNTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    skills: ["Graphic Design", "UI/UX", "Video Editing", "3D Design"],
  },
  {
    name: "Sales & Marketing",
    jobs: "156K+",
    image:
      "https://images.unsplash.com/photo-1764173039056-3cc602fef942?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHByZXNlbnRhdGlvbnxlbnwxfHx8fDE3NzQ3NjE4MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    skills: ["Digital Marketing", "SEO", "Content Strategy", "Social Media"],
  },
  {
    name: "Writing & Translation",
    jobs: "134K+",
    image:
      "https://images.unsplash.com/photo-1743796055672-438d6aa0b05e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGxhcHRvcCUyMGNvZmZlZXxlbnwxfHx8fDE3NzQ4MDg4ODR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    skills: ["Content Writing", "Copywriting", "Technical Writing", "Translation"],
  },
] as const;

export const SHOWCASE_STATS = [
  { value: "$5B+", label: "Paid to freelancers" },
  { value: "95%", label: "Job success rate" },
  { value: "24hrs", label: "Average hire time" },
] as const;

export const ENTERPRISE_BENEFITS = [
  {
    icon: Building2,
    title: "Dedicated support",
    description: "Get onboarding help and hands-on support.",
  },
  {
    icon: TrendingUp,
    title: "Priority matching",
    description: "Reach strong talent faster when time matters.",
  },
  {
    icon: Users,
    title: "Team management",
    description: "Coordinate hiring, approvals, and contracts.",
  },
  {
    icon: DollarSign,
    title: "Volume discounts",
    description: "Lower operating costs with larger plans.",
  },
] as const;

export const ENTERPRISE_IMAGES = [
  "https://images.unsplash.com/photo-1759884247160-27b8465544b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwdGVhbSUyMGJyYWluc3Rvcm1pbmd8ZW58MXx8fHwxNzc0NzYwOTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1745847768380-2caeadbb3b71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGhhbmRzaGFrZSUyMHBhcnRuZXJzaGlwfGVufDF8fHx8MTc3NDc1MTA1M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1759752394757-323a0adc0d62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZW1vdGUlMjB0ZWFtJTIwY29sbGFib3JhdGlvbnxlbnwxfHx8fDE3NzQ4MDg4ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1758519290832-c7f1a5fb5c45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB2aWRlbyUyMGNhbGwlMjBtZWV0aW5nfGVufDF8fHx8MTc3NDgwODg4NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
] as const;

export const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    role: "CEO, TechVenture Inc.",
    image:
      "https://images.unsplash.com/photo-1739298061707-cefee19941b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY29sbGFib3JhdGlvbiUyMG9mZmljZXxlbnwxfHx8fDE3NzQ3Njg1Njd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    quote: "SabaHub helped us scale quickly, and the hiring flow stayed organized.",
    metric: "$2M+ saved in hiring costs",
  },
  {
    name: "James Rodriguez",
    role: "Freelance Developer",
    image:
      "https://images.unsplash.com/photo-1761623135057-e41b632694f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyYWRpZW50JTIwc29mdCUyMHBhc3RlbHxlbnwxfHx8fDE3NzQ3Njc2ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    quote: "The project quality is strong, and payouts feel much more reliable.",
    metric: "Earning $180K/year",
  },
  {
    name: "Emily Parker",
    role: "Marketing Director, GrowthLabs",
    image:
      "https://images.unsplash.com/photo-1764173039056-3cc602fef942?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHByZXNlbnRhdGlvbnxlbnwxfHx8fDE3NzQ3NjE4MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    quote: "We found specialized marketing talent much faster than before.",
    metric: "350% ROI increase",
  },
  {
    name: "David Chen",
    role: "UX Designer",
    image:
      "https://images.unsplash.com/photo-1728281144091-b743062a9bf0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbmVyJTIwd29ya3NwYWNlfGVufDF8fHx8MTc3NDczNTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    quote: "The profile and discovery flow helped me find steadier, better-fit work.",
    metric: "45+ successful projects",
  },
] as const;

export const FOOTER_LINK_GROUPS = [
  {
    title: "For Clients",
    links: ["How to Hire", "Talent Marketplace", "Project Catalog", "Enterprise", "Hire Worldwide"],
  },
  {
    title: "For Freelancers",
    links: ["How to Find Work", "Find Freelance Jobs", "Build Portfolio", "Success Stories", "Resources"],
  },
  {
    title: "Company",
    links: ["About Us", "Leadership", "Careers", "Investor Relations", "Trust & Safety", "Press & Media"],
  },
  {
    title: "Support",
    links: ["Help Center", "Community", "Contact Us", "API Documentation", "System Status"],
  },
] as const;

export const SOCIAL_LINKS = [
  { label: "X", href: "https://x.com" },
  { label: "in", href: "https://linkedin.com" },
  { label: "IG", href: "https://instagram.com" },
] as const;
