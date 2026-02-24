"use client";

import Link from "next/link";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeIconButton } from "@/components/useTheme";
import {
  type FeaturedFreelancerReview,
  type Job,
  type PaginatedResult,
  listFeaturedFreelancerReviews,
  listOpenJobsPage,
} from "@/lib/api";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const PAGE_SIZE = 8;

const FALLBACK_JOB_IMAGES = [
  "/images/photos/workspace-product.jpg",
  "/images/photos/dashboard-focus.jpg",
  "/images/photos/team-collab.jpg",
  "/images/photos/secure-payments.jpg",
  "/images/photos/startup-desk.jpg",
  "/images/photos/team-meeting.jpg",
];

const SERVICE_PILLS = [
  "UI/UX Design",
  "Full Stack Development",
  "Security Review",
  "Data Engineering",
  "Video Editing",
  "Brand Strategy",
  "Automation",
  "Cloud Ops",
];

type ServiceCard = {
  title: string;
  tag: string;
  description: string;
  image: string;
};

const POPULAR_SERVICES: ServiceCard[] = [
  {
    title: "Web & Product Engineering",
    tag: "Engineering",
    description: "Launch modern products with vetted developers who ship production-grade work.",
    image: "/images/photos/dashboard-focus.jpg",
  },
  {
    title: "Creative & Brand Studio",
    tag: "Design",
    description: "Get logo, visual identity, and campaign assets from specialist creative teams.",
    image: "/images/photos/workspace-product.jpg",
  },
  {
    title: "Growth & Marketing Ops",
    tag: "Growth",
    description: "Scale inbound and outbound programs with measurable channel execution.",
    image: "/images/photos/city-night.jpg",
  },
  {
    title: "Trust, Security & Compliance",
    tag: "Enterprise",
    description: "Protect client data with freelancers experienced in secure delivery workflows.",
    image: "/images/photos/secure-payments.jpg",
  },
  {
    title: "Project PMO Pods",
    tag: "Operations",
    description: "Coordinate multi-team delivery with embedded project managers and reporting.",
    image: "/images/photos/team-meeting.jpg",
  },
  {
    title: "Content & Media Production",
    tag: "Media",
    description: "Produce product videos, launch kits, and social content at high quality.",
    image: "/images/photos/team-collab.jpg",
  },
];

type LandingReviewCard = {
  id: string;
  quote: string;
  name: string;
  role: string;
  company?: string;
  avatar: string;
  rating: number;
  reviewCount?: number;
};

const REVIEW_AVATAR_FALLBACKS = [
  "/images/icons/placeholders/avatar-1.png",
  "/images/icons/placeholders/avatar-2.png",
  "/images/icons/placeholders/avatar-3.png",
];

const FALLBACK_REVIEWS: LandingReviewCard[] = [
  {
    id: "fallback-1",
    quote: "SabaHub gave us vetted specialists in less than 48 hours and reduced project risk immediately.",
    name: "Ruth Mekonnen",
    role: "Head of Marketing",
    company: "BrightSpan Labs",
    avatar: "/images/icons/placeholders/avatar-1.png",
    rating: 5,
    reviewCount: 21,
  },
  {
    id: "fallback-2",
    quote: "The briefing flow is clean, and freelancer quality is high enough for enterprise rollout work.",
    name: "Daniel Ortega",
    role: "Operations Director",
    company: "NorthGrid Ventures",
    avatar: "/images/icons/placeholders/avatar-2.png",
    rating: 5,
    reviewCount: 34,
  },
  {
    id: "fallback-3",
    quote: "We now use SabaHub for design, engineering, and audit tasks with consistent delivery timelines.",
    name: "Amina Yusuf",
    role: "Program Manager",
    company: "Astra Public Sector",
    avatar: "/images/icons/placeholders/avatar-3.png",
    rating: 4.9,
    reviewCount: 18,
  },
];

const DELIVERY_STEPS = [
  {
    title: "Share a clear brief",
    detail: "Describe scope, budget, and timeline in a structured project post.",
  },
  {
    title: "Match with specialists",
    detail: "Shortlist top freelancers with relevant skills and verified delivery history.",
  },
  {
    title: "Track outcomes",
    detail: "Execute with milestone visibility, quality checks, and secure communication.",
  },
];

const initialPageState: PaginatedResult<Job> = {
  items: [],
  total: 0,
  page: 0,
  size: PAGE_SIZE,
  totalPages: 0,
  hasPrevious: false,
  hasNext: false,
};

function toLabel(value?: string | null) {
  if (!value) return "Not specified";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatBudget(job: Job) {
  const min = job.budget?.min ?? job.budgetMin;
  const max = job.budget?.max ?? job.budgetMax;

  const currencyRaw = (job.budget?.currency ?? job.currency ?? "USD").toUpperCase();
  const currency = /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : "USD";

  const formatAmount = (amount: number) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `$${Math.round(amount).toLocaleString()}`;
    }
  };

  if (typeof min === "number" && typeof max === "number") return `${formatAmount(min)} - ${formatAmount(max)}`;
  if (typeof min === "number") return `${formatAmount(min)}+`;
  if (typeof max === "number") return `Up to ${formatAmount(max)}`;
  return "Budget on request";
}

function formatDate(date?: string) {
  if (!date) return "Recently posted";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Recently posted";
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getJobImage(job: Job, index: number) {
  const candidate = job.sampleImageUrls?.find((url) => typeof url === "string" && /^(https?:\/\/|\/)/i.test(url));
  return candidate ?? FALLBACK_JOB_IMAGES[index % FALLBACK_JOB_IMAGES.length];
}

function summarize(text: string, maxLength = 120) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function mapReviewCard(review: FeaturedFreelancerReview, index: number): LandingReviewCard {
  return {
    id: review.id || `live-review-${index}`,
    quote:
      typeof review.quote === "string" && review.quote.trim().length > 0
        ? review.quote.trim()
        : "Top-rated freelancer with verified delivery quality and strong client outcomes.",
    name: review.name || "Verified Freelancer",
    role: review.role || "Freelancer",
    avatar:
      review.avatarUrl && review.avatarUrl.trim().length > 0
        ? review.avatarUrl
        : REVIEW_AVATAR_FALLBACKS[index % REVIEW_AVATAR_FALLBACKS.length],
    rating: typeof review.rating === "number" && Number.isFinite(review.rating) ? review.rating : 0,
    reviewCount: typeof review.reviewCount === "number" && Number.isFinite(review.reviewCount) ? review.reviewCount : 0,
  };
}

export default function Home() {
  const [jobsPage, setJobsPage] = useState<PaginatedResult<Job>>(initialPageState);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [reviews, setReviews] = useState<LandingReviewCard[]>(FALLBACK_REVIEWS);
  const [reviewsAreLive, setReviewsAreLive] = useState(false);

  const revealObserver = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingJobs(true);
    setJobsError(null);

    listOpenJobsPage({ page: 0, size: PAGE_SIZE })
      .then((pageData) => {
        if (!active) return;
        setJobsPage(pageData);
        setLastUpdated(new Date());
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message =
          requestError instanceof Error && requestError.message
            ? requestError.message
            : "Unable to load live opportunities right now.";
        setJobsError(message);
      })
      .finally(() => {
        if (!active) return;
        setLoadingJobs(false);
      });

    return () => {
      active = false;
    };
  }, [refreshToken]);

  useEffect(() => {
    let active = true;

    listFeaturedFreelancerReviews(3)
      .then((data) => {
        if (!active) return;
        const mapped = data.map(mapReviewCard);
        if (mapped.length > 0) {
          setReviews(mapped);
          setReviewsAreLive(true);
          return;
        }

        setReviews(FALLBACK_REVIEWS);
        setReviewsAreLive(false);
      })
      .catch(() => {
        if (!active) return;
        setReviews(FALLBACK_REVIEWS);
        setReviewsAreLive(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!elements.length) return;

    revealObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            revealObserver.current?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    elements.forEach((element) => revealObserver.current?.observe(element));

    return () => {
      revealObserver.current?.disconnect();
    };
  }, []);

  const featuredJobs = useMemo(() => jobsPage.items.slice(0, 4), [jobsPage.items]);

  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();

    for (const job of jobsPage.items) {
      const skills = [...(job.requiredSkills ?? []), ...(job.skills ?? [])];
      for (const skill of skills) {
        const normalized = skill.trim();
        if (!normalized) continue;
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([skill]) => skill);
  }, [jobsPage.items]);

  const trustMetrics = useMemo(() => {
    const hiringOrgs = new Set(
      jobsPage.items
        .map((job) => (job.companyName ?? job.employerId ?? "").trim())
        .filter(Boolean)
    ).size;

    const budgets: number[] = [];
    jobsPage.items.forEach((job) => {
      const min = job.budget?.min ?? job.budgetMin;
      const max = job.budget?.max ?? job.budgetMax;

      if (typeof min === "number" && typeof max === "number") {
        budgets.push((min + max) / 2);
      } else if (typeof min === "number") {
        budgets.push(min);
      } else if (typeof max === "number") {
        budgets.push(max);
      }
    });

    const avgBudgetLabel =
      budgets.length > 0
        ? `$${Math.round(budgets.reduce((sum, amount) => sum + amount, 0) / budgets.length).toLocaleString()}`
        : "Request based";

    return [
      { label: "Open roles", value: jobsPage.total.toLocaleString() },
      { label: "Hiring teams", value: hiringOrgs.toLocaleString() },
      { label: "Avg ticket", value: avgBudgetLabel },
      { label: "Top skill", value: topSkills[0] ?? "General delivery" },
    ];
  }, [jobsPage.items, jobsPage.total, topSkills]);

  return (
    <div className={`min-h-screen bg-[#f3f6f4] text-slate-900 ${display.variable} ${body.variable} font-[var(--font-body)]`}>
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-[#f8faf8] via-[#eef7f2] to-[#f6efe8]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-16 top-14 h-64 w-64 rounded-full bg-emerald-300/35 blur-3xl" />
          <div className="absolute right-8 top-8 h-72 w-72 rounded-full bg-amber-200/45 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-200/35 blur-3xl" />
        </div>

        <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(5,150,105,0.35)]">
                SH
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">SabaHub</p>
                <p className="text-base font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                  Enterprise Freelancer Hub
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-7 text-sm font-semibold text-slate-700 lg:flex">
              <a href="#services" className="transition hover:text-emerald-700">
                Services
              </a>
              <a href="#opportunities" className="transition hover:text-emerald-700">
                Opportunities
              </a>
              <a href="#enterprise" className="transition hover:text-emerald-700">
                Enterprise
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeIconButton className="hidden sm:flex" />
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.24)] transition hover:bg-slate-800 sm:px-5 sm:py-2.5"
              >
                Join
              </Link>
            </div>
          </div>
        </nav>

        <section className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:pb-20 lg:pt-16">
          <div className="fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Curated professional marketplace
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            </p>

            <h1
              className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Premium freelancers for business-critical delivery.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-700">
              Find specialists across engineering, design, operations, and media with clear scope, transparent budgets, and
              enterprise-ready workflows.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-7 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(5,150,105,0.35)] transition hover:-translate-y-0.5"
              >
                Explore talent services
              </Link>
              <Link
                href="/employer/post-project"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/85 px-7 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Post a project brief
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {SERVICE_PILLS.map((pill, index) => (
                <span
                  key={pill}
                  className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 fade-up"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {pill}
                </span>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustMetrics.map((metric, index) => (
                <article
                  key={metric.label}
                  className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm fade-up"
                  style={{ animationDelay: `${index * 110}ms` }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                    {metric.value}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="fade-up">
            <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/85 shadow-[0_26px_70px_rgba(15,23,42,0.14)] backdrop-blur-sm">
              <div className="relative h-64 overflow-hidden border-b border-slate-200/80 md:h-72">
                <img
                  src="/images/banners/sabahub-collab-2.png"
                  alt="SabaHub enterprise collaboration"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Enterprise readiness
                </span>
              </div>

              <div className="space-y-3 p-5">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Delivery mode</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Milestone-based with clear acceptance criteria</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Risk control</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Quality checks, documentation, and revision governance</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Trust signal</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {lastUpdated ? `Live feed synced ${lastUpdated.toLocaleTimeString()}` : "Waiting for first live sync"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="services" className="mx-auto max-w-7xl px-6 py-16 reveal" data-reveal>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Popular services</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
              High-impact freelance capabilities.
            </h2>
          </div>
          <Link
            href="/jobs"
            className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            View full marketplace
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_SERVICES.map((service, index) => (
            <article
              key={service.title}
              className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_14px_35px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.14)]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="relative h-40 overflow-hidden border-b border-slate-200/80">
                <img src={service.image} alt={service.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                  {service.tag}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="opportunities"
        className="border-y border-slate-200/80 bg-gradient-to-br from-[#f9fbf9] via-[#f5f8f7] to-[#eef4f4] reveal"
        data-reveal
      >
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Featured opportunities</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                Live roles from active hiring teams.
              </h2>
              <p className="mt-2 text-sm text-slate-600">Only a focused sample is shown here for faster decision-making.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-xs font-semibold text-slate-600 shadow-sm">
              {jobsPage.total.toLocaleString()} open jobs now
            </div>
          </div>

          {loadingJobs ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90">
                  <div className="h-32 animate-pulse bg-slate-200/80" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/80" />
                    <div className="h-3 w-full animate-pulse rounded bg-slate-200/70" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
              <p className="text-sm font-semibold">{jobsError}</p>
              <button
                type="button"
                onClick={() => setRefreshToken((value) => value + 1)}
                className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600">No open jobs are visible right now.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredJobs.map((job, index) => {
                const categoryLabel = job.categoryId ? toLabel(job.categoryId) : "General";

                return (
                  <article
                    key={job.id}
                    className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.13)]"
                  >
                    <div className="relative h-32 overflow-hidden border-b border-slate-200/80">
                      <img src={getJobImage(job, index)} alt={`${job.title} preview`} className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-transparent to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        {(job.status ?? "OPEN").toUpperCase()}
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{job.title}</h3>
                      <p className="mt-1 text-xs font-medium text-slate-600">{job.companyName || "Verified organization"}</p>

                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{summarize(job.description || "No description provided.")}</p>

                      <div className="mt-4 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span>Budget</span>
                          <span className="font-semibold text-slate-800">{formatBudget(job)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Engagement</span>
                          <span className="font-semibold text-slate-800">{toLabel(job.engagementType)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Category</span>
                          <span className="font-semibold text-slate-800">{categoryLabel}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(job.requiredSkills?.length ? job.requiredSkills : job.skills ?? []).slice(0, 2).map((skill) => (
                          <span key={`${job.id}-${skill}`} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <p className="mt-3 text-[11px] text-slate-500">Posted {formatDate(job.createdAt)}</p>

                      <Link
                        href={`/jobs/${job.id}`}
                        className="mt-3 inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-slate-800"
                      >
                        View role
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Browse all opportunities
            </Link>
            <Link
              href="/employer/post-project"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Start hiring now
            </Link>
          </div>
        </div>
      </section>

      <section id="enterprise" className="mx-auto max-w-7xl px-6 py-16 reveal" data-reveal>
        <div className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.3)] lg:p-10">
          <div className="pointer-events-none absolute right-[-90px] top-[-70px] h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" aria-hidden />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Enterprise mode</p>
              <h2 className="mt-3 text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Built for teams that demand control, speed, and reliable outcomes.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200">
                SabaHub combines curated freelancers, structured briefs, and transparent project execution so your organization can scale
                delivery without compromising quality.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {trustMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">{metric.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Create enterprise account
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Review market activity
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm">
              <img src="/images/photos/secure-payments.jpg" alt="Secure enterprise workflow" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 reveal" data-reveal>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {reviewsAreLive ? "Live freelancer reviews" : "Client reviews"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
              Trusted by teams shipping real projects.
            </h2>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-2 text-xs font-semibold text-slate-600">
            {topSkills.length > 0 ? `Trending skills: ${topSkills.join(" • ")}` : "Skill trends appear as more jobs go live"}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-slate-700">“{review.quote}”</p>

              <div className="mt-5 flex items-center gap-3">
                <img src={review.avatar} alt={`${review.name} avatar`} className="h-11 w-11 rounded-full border border-slate-200 object-cover" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{review.name}</p>
                  <p className="text-xs text-slate-600">{review.company ? `${review.role}, ${review.company}` : review.role}</p>
                </div>
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">
                {"★".repeat(Math.max(1, Math.min(5, Math.round(review.rating))))} {review.rating.toFixed(1)}
                {typeof review.reviewCount === "number" ? ` • ${review.reviewCount} reviews` : ""}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/80">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
            Keep delivery simple and accountable.
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {DELIVERY_STEPS.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#f0f3f1] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-600 text-xs font-semibold text-white">
              SH
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">SabaHub</p>
              <p className="text-xs text-slate-600">Enterprise freelance marketplace</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/jobs" className="transition hover:text-slate-900">
              Jobs
            </Link>
            <Link href="/login" className="transition hover:text-slate-900">
              Sign in
            </Link>
            <Link href="/register" className="transition hover:text-slate-900">
              Register
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-7xl border-t border-slate-200 pt-5 text-xs text-slate-500">© 2026 SabaHub. All rights reserved.</div>
      </footer>
    </div>
  );
}
