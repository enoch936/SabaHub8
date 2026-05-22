"use client";

import { useEffect, useState } from "react";
import { listOpenJobsPage, listMarketplaceFreelancers, type Job, type MarketplaceFreelancer } from "@/lib/api";

export type LandingJob = {
  id: string;
  title: string;
  company: string;
  budget: string;
  timeline: string;
  tags: string[];
};

export type LandingFreelancer = {
  id: string;
  name: string;
  role: string;
  rate: string;
  success: string;
  skills: string[];
};

function formatBudget(job: Job): string {
  const min = job.budget?.min ?? job.budgetMin ?? 0;
  const max = job.budget?.max ?? job.budgetMax ?? 0;
  if (job.pricingModel === "HOURLY") return `$${min}–$${max}/hr`;
  if (max > 0) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (min > 0) return `$${min.toLocaleString()}`;
  return "Negotiable";
}

function formatTimeline(job: Job): string {
  if (job.engagementType === "LONG_TERM_PARTNERSHIP") return "Ongoing";
  if (job.engagementType === "RETAINER") return "Monthly retainer";
  if (job.slaDeliveryDays) return `${job.slaDeliveryDays} days`;
  return "Project-based";
}

function toDisplayJob(job: Job): LandingJob {
  const company = job.employerName ?? job.employer?.companyName ?? job.companyName ?? "Company";
  return {
    id: job.id,
    title: job.title ?? "Untitled",
    company,
    budget: formatBudget(job),
    timeline: formatTimeline(job),
    tags: (job.skills ?? job.requiredSkills ?? []).slice(0, 3),
  };
}

function toDisplayFreelancer(f: MarketplaceFreelancer): LandingFreelancer {
  const name = f.name?.trim() || "Freelancer";
  const rate = f.hourlyRate ? `$${f.hourlyRate}/hr` : "Custom rate";
  const success = f.rating ? `${f.rating.toFixed(1)}★ rating` : "Top rated";
  return {
    id: f.id,
    name,
    role: f.title ?? "Specialist",
    rate,
    success,
    skills: (f.skills ?? []).slice(0, 3),
  };
}

export function useLandingData() {
  const [jobs, setJobs] = useState<LandingJob[]>([]);
  const [freelancers, setFreelancers] = useState<LandingFreelancer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      listOpenJobsPage({ page: 0, size: 3, sortBy: "newest" }).catch(() => ({ items: [] as Job[], total: 0, page: 0, size: 3 })),
      listMarketplaceFreelancers({ page: 0, size: 3 }).catch(() => ({ items: [] as MarketplaceFreelancer[], total: 0, page: 0, size: 3 })),
    ]).then(([jobsPage, freelancersPage]) => {
      if (!active) return;
      setJobs((jobsPage.items ?? []).slice(0, 3).map(toDisplayJob));
      setFreelancers((freelancersPage.items ?? []).slice(0, 3).map(toDisplayFreelancer));
      setLoading(false);
    });

    return () => { active = false; };
  }, []);

  return { jobs, freelancers, loading };
}
