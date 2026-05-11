"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  LayoutList,
  SearchCheck,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { ApplyModal } from "@/components/jobs/ApplyModal";
import { JobCardGrid } from "@/components/jobs/JobCardGrid";
import { JobFilterSidebar } from "@/components/jobs/JobFilterSidebar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { createThread } from "@/lib/api";
import { getJobCategoryDisplay } from "@/lib/jobTaxonomy";
import { useJobStore } from "@/lib/jobStore";
import { useSession } from "@/lib/session";
import type { Job, JobFilters } from "@/lib/types";
import { workspaceRoutes } from "@/lib/workspace-routes";
import { toast } from "sonner";

type ViewMode = "grid" | "list";
const JOBS_FILTER_VISIBILITY_KEY = "workspace:jobs-filters-open";

export default function JobsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useSession((s) => s.role);
  const jobs = useJobStore((s) => s.jobs);
  const filters = useJobStore((s) => s.filters);
  const isLoading = useJobStore((s) => s.isLoading);
  const totalCount = useJobStore((s) => s.totalCount);
  const totalPages = useJobStore((s) => s.totalPages);
  const currentPage = useJobStore((s) => s.currentPage);
  const hasNextPage = useJobStore((s) => s.hasNextPage);
  const hasPreviousPage = useJobStore((s) => s.hasPreviousPage);
  const savedJobs = useJobStore((s) => s.savedJobs);
  const savedPresets = useJobStore((s) => s.savedPresets);
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const toggleSave = useJobStore((s) => s.toggleSave);
  const removeJob = useJobStore((s) => s.removeJob);
  const setFilters = useJobStore((s) => s.setFilters);
  const savePreset = useJobStore((s) => s.savePreset);
  const loadPreset = useJobStore((s) => s.loadPreset);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [queryHydrated, setQueryHydrated] = useState(false);

  useEffect(() => {
    if (queryHydrated) {
      return;
    }

    const categoryId = searchParams.get("category")?.trim() ?? "";
    const search = searchParams.get("q")?.trim() ?? "";
    const nextFilters: Partial<JobFilters> = {};

    if (categoryId) {
      nextFilters.categories = [categoryId];
    }
    if (search) {
      nextFilters.search = search;
    }

    if (Object.keys(nextFilters).length > 0) {
      nextFilters.page = 1;
      setFilters(nextFilters);
      void fetchJobs(nextFilters);
    } else {
      void fetchJobs();
    }

    setQueryHydrated(true);
  }, [fetchJobs, queryHydrated, searchParams, setFilters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1280px)");
    const syncFilters = () => {
      if (!media.matches) {
        setFiltersOpen(false);
        return;
      }
      const stored = window.localStorage.getItem(JOBS_FILTER_VISIBILITY_KEY);
      setFiltersOpen(stored === null ? true : stored === "1");
    };
    syncFilters();
    media.addEventListener("change", syncFilters);
    return () => media.removeEventListener("change", syncFilters);
  }, []);

  const toggleFilters = () => {
    setFiltersOpen((current) => {
      const next = !current;
      window.localStorage.setItem(JOBS_FILTER_VISIBILITY_KEY, next ? "1" : "0");
      return next;
    });
  };

  const isEmployer = role === "EMPLOYER";

  const summaryCards = useMemo(
    () => [
      {
        label: "Open briefs",
        value: totalCount.toLocaleString(),
        icon: <BriefcaseBusiness className="h-4 w-4 text-gray-600" />,
      },
      {
        label: "Saved pipeline",
        value: savedJobs.size.toLocaleString(),
        icon: <ShieldCheck className="h-4 w-4 text-gray-600" />,
      },
      {
        label: "Verified employers",
        value: jobs.filter((job) => job.employerVerified).length.toLocaleString(),
        icon: <BadgeCheck className="h-4 w-4 text-gray-600" />,
      },
      {
        label: "Media-rich jobs",
        value: jobs
          .filter((job) => (job.sampleImageUrls?.length ?? 0) > 0 || (job.sampleVideoUrls?.length ?? 0) > 0)
          .length.toLocaleString(),
        icon: <SearchCheck className="h-4 w-4 text-gray-600" />,
      },
    ],
    [jobs, savedJobs.size, totalCount],
  );

  const activeCategoryLabels = useMemo(
    () =>
      (filters.categories ?? []).map((categoryId) =>
        getJobCategoryDisplay(categoryId, {
          separator: " > ",
          unknownFallback: categoryId,
        }),
      ),
    [filters.categories],
  );

  const runJobQuery = (patch: Partial<JobFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(patch);
    void fetchJobs(next);
  };

  const handleContactFromJob = async (job: Job) => {
    if (!job.employerId) {
      toast.error("Cannot start chat for this job because the employer identity is missing.");
      return;
    }

    try {
      const thread = await createThread({
        participantIds: [job.employerId],
        threadType: "DIRECT",
      });
      router.push(`/chat?thread=${encodeURIComponent(thread.id)}&job=${encodeURIComponent(job.id)}`);
    } catch (error) {
      console.error("Failed to open chat thread from job card", error);
      toast.error("Unable to open chat right now. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              Workspace
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-gray-900">Jobs</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Browse, filter, save, and review jobs.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleFilters}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-gray-900 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {filtersOpen ? "Hide filters" : "Show filters"}
            </button>
            <Link
              href={workspaceRoutes.talent}
              className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-gray-900 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
            >
              Browse talent
            </Link>
            {isEmployer ? (
              <Link
                href={workspaceRoutes.createJob}
                className="inline-flex h-11 items-center rounded-full bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Create job
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => runJobQuery({ savedOnly: filters.savedOnly ? undefined : true, page: 1 })}
                className="inline-flex h-11 items-center rounded-full bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                {filters.savedOnly ? "Show all jobs" : "Open saved board"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-[24px] bg-white px-4 py-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">{card.label}</p>
                {card.icon}
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

        {activeCategoryLabels.length ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {activeCategoryLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700"
              >
                {label}
              </span>
            ))}
            <button
              type="button"
              onClick={() => runJobQuery({ categories: [], page: 1 })}
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Clear category
            </button>
          </div>
        ) : null}
      </div>

      <div className={`grid gap-6 ${filtersOpen ? "xl:grid-cols-[320px_minmax(0,1fr)]" : "grid-cols-1"}`}>
        {filtersOpen ? (
          <aside>
            <JobFilterSidebar
              filters={filters}
              onChange={(patch) => runJobQuery({ ...patch, page: 1 })}
              onSavePreset={savePreset}
              savedPresets={savedPresets}
              onLoadPreset={(preset) => {
                loadPreset(preset);
                void fetchJobs({ ...preset.filters, page: 1 });
              }}
            />
          </aside>
        ) : null}

        <section className="space-y-4">
          <div className="rounded-[28px] bg-white/88 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">View</p>
                <p className="mt-1 text-sm text-gray-500">
                  Page {currentPage} of {Math.max(totalPages, 1)}. {jobs.length} jobs shown.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFilters}
                  className="inline-flex items-center gap-1 rounded-2xl bg-white px-3 py-2.5 text-sm text-gray-700 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                >
                  {filtersOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {filtersOpen ? "Hide filters" : "Show filters"}
                </button>
                <select
                  value={filters.sortBy ?? "relevance"}
                  onChange={(event) => runJobQuery({ sortBy: event.target.value as JobFilters["sortBy"], page: 1 })}
                  className="rounded-2xl bg-white px-3 py-2.5 text-sm text-gray-700 shadow-[0_10px_26px_rgba(15,23,42,0.05)] outline-none"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Newest</option>
                  <option value="budget">Budget</option>
                </select>
                <select
                  value={filters.pageSize ?? 12}
                  onChange={(event) => runJobQuery({ pageSize: Number(event.target.value), page: 1 })}
                  className="rounded-2xl bg-white px-3 py-2.5 text-sm text-gray-700 shadow-[0_10px_26px_rgba(15,23,42,0.05)] outline-none"
                >
                  <option value={6}>6 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                </select>
                <div className="flex items-center gap-1 rounded-2xl bg-white p-1 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-xl p-2 transition ${viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-xl p-2 transition ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                    aria-label="List view"
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((row) => (
                <div key={row} className="rounded-[28px] border border-gray-200/80 bg-white p-5">
                  <LoadingSkeleton rows={4} />
                </div>
              ))}
            </div>
          ) : (
            <JobCardGrid
              jobs={jobs}
              viewMode={viewMode}
              onApply={setApplyJob}
              onSave={toggleSave}
              onDelete={isEmployer ? removeJob : undefined}
              onMessage={(job) => {
                void handleContactFromJob(job);
              }}
            />
          )}

          <div className="rounded-[28px] border border-gray-200/80 bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Pagination</p>
                <p className="mt-1 text-sm text-gray-500">
                  Current {currentPage} / Total {Math.max(totalPages, 1)} / Results {totalCount}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => runJobQuery({ page: Math.max(1, currentPage - 1) })}
                  disabled={!hasPreviousPage}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white">
                  Current {currentPage}
                </span>
                <button
                  type="button"
                  onClick={() => runJobQuery({ page: currentPage + 1 })}
                  disabled={!hasNextPage}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {applyJob ? <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} /> : null}
    </div>
  );
}
