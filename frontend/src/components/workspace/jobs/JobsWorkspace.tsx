"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  Grid3X3,
  LayoutList,
  Bookmark,
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
const JOBS_INTRO_VISIBILITY_KEY = "workspace:jobs-intro-open";

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
  const loadSavedJobs = useJobStore((s) => s.loadSavedJobs);
  const toggleSave = useJobStore((s) => s.toggleSave);
  const removeJob = useJobStore((s) => s.removeJob);
  const setFilters = useJobStore((s) => s.setFilters);
  const savePreset = useJobStore((s) => s.savePreset);
  const loadPreset = useJobStore((s) => s.loadPreset);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [introOpen, setIntroOpen] = useState(true);
  const [queryHydrated, setQueryHydrated] = useState(false);

  useEffect(() => {
    void loadSavedJobs();
  }, [loadSavedJobs]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(JOBS_INTRO_VISIBILITY_KEY);
    setIntroOpen(stored === null ? true : stored === "1");
  }, []);

  const toggleFilters = () => {
    setFiltersOpen((current) => {
      const next = !current;
      window.localStorage.setItem(JOBS_FILTER_VISIBILITY_KEY, next ? "1" : "0");
      return next;
    });
  };

  const toggleIntro = () => {
    setIntroOpen((current) => {
      const next = !current;
      window.localStorage.setItem(JOBS_INTRO_VISIBILITY_KEY, next ? "1" : "0");
      return next;
    });
  };

  const isEmployer = role === "EMPLOYER";

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleIntro}
        className="inline-flex h-10 items-center justify-center rounded-full bg-white px-3 text-gray-900 shadow-[0_6px_16px_rgba(15,23,42,0.03)] transition hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:bg-gray-100 active:scale-95"
        aria-label={introOpen ? "Hide browse & apply card" : "Show browse & apply card"}
        aria-pressed={introOpen}
        title={introOpen ? "Hide browse & apply" : "Show browse & apply"}
      >
        {introOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <span className="ml-2 text-xs font-semibold uppercase tracking-[0.16em]">Browse</span>
      </button>
      <button
        type="button"
        onClick={toggleFilters}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-[0_6px_16px_rgba(15,23,42,0.03)] transition hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:bg-gray-100 active:scale-95"
        aria-label={filtersOpen ? "Hide filters" : "Show filters"}
        title={filtersOpen ? "Hide filters" : "Show filters"}
      >
        {filtersOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      {!isEmployer && (
        <button
          type="button"
          onClick={() => runJobQuery({ savedOnly: filters.savedOnly ? undefined : true, page: 1 })}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-950 text-white transition hover:bg-gray-800"
          aria-label={filters.savedOnly ? "Show all jobs" : "Show saved jobs"}
          title={filters.savedOnly ? "Show all jobs" : "Show saved jobs"}
        >
          <Bookmark className="h-4 w-4" />
        </button>
      )}
    </div>
  );

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
    <div className="space-y-3">
      {introOpen ? (
        <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <span className="inline-flex w-fit items-center rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                Jobs
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-gray-900">Browse & apply</h1>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">
                  Filter, save, and apply to jobs.
                </p>
              </div>
            </div>

            {headerActions}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-[16px] bg-white px-3 py-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">{card.label}</p>
                  {card.icon}
                </div>
                <p className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-gray-900">{card.value}</p>
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
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 active:scale-95"
              >
                Clear category
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-gray-200/70 bg-white/80 px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.02)]">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-fit items-center rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Jobs
            </span>
            <p className="text-xs text-gray-500">Browse & apply hidden</p>
          </div>
          {headerActions}
        </div>
      )}

      <div className={`grid gap-3 ${filtersOpen ? "xl:grid-cols-[280px_minmax(0,1fr)]" : "grid-cols-1"}`}>
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

        <section className={viewMode === "list" ? "space-y-2 xl:grid xl:grid-cols-[minmax(0,0.68fr)_minmax(320px,0.32fr)] xl:gap-0" : "space-y-2"}>
          <div className={viewMode === "list" ? "xl:pr-3" : ""}>
            <div className="rounded-[20px] bg-white/88 p-2 shadow-[0_12px_28px_rgba(15,23,42,0.02)]">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">View</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Pg {currentPage}/{Math.max(totalPages, 1)} • {jobs.length} shown
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <select
                    value={filters.pageSize ?? 12}
                    onChange={(event) => runJobQuery({ pageSize: Number(event.target.value), page: 1 })}
                    className="rounded-lg bg-white px-2 py-1 text-xs text-gray-700 shadow-[0_6px_14px_rgba(15,23,42,0.02)] outline-none"
                  >
                    <option value={6}>6/page</option>
                    <option value={12}>12/page</option>
                    <option value={24}>24/page</option>
                  </select>
                  <div className="flex items-center gap-0.5 rounded-lg bg-white p-0.5 shadow-[0_6px_14px_rgba(15,23,42,0.02)]">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`rounded-md p-1.5 transition active:scale-95 ${viewMode === "grid" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-100"}`}
                      aria-label="Grid view"
                    >
                      <Grid3X3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`rounded-md p-1.5 transition active:scale-95 ${viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-100"}`}
                      aria-label="List view"
                    >
                      <LayoutList className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="rounded-[20px] border border-gray-200/80 bg-white p-2">
                    <LoadingSkeleton rows={2} />
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

            <div className="rounded-[20px] border border-gray-200/80 bg-white p-2 shadow-[0_10px_24px_rgba(15,23,42,0.02)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Pagination</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {currentPage} / {Math.max(totalPages, 1)} • {totalCount} results
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => runJobQuery({ page: Math.max(1, currentPage - 1) })}
                    disabled={!hasPreviousPage}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ←
                  </button>
                  <span className="rounded-lg bg-gray-950 px-2.5 py-1 text-xs font-semibold text-white">
                    {currentPage}
                  </span>
                  <button
                    type="button"
                    onClick={() => runJobQuery({ page: currentPage + 1 })}
                    disabled={!hasNextPage}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {viewMode === "list" ? <div className="hidden xl:block min-h-full bg-white" aria-hidden="true" /> : null}
        </section>
      </div>

      {applyJob ? <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} /> : null}
    </div>
  );
}
