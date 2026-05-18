"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GlassPanel, GlassCard, Badge, Button } from "@/components/ui";
import { 
  BriefcaseBusiness, 
  ShieldCheck, 
  BadgeCheck, 
  SearchCheck, 
  Eye, 
  EyeOff, 
  Bookmark,
  Grid3X3,
  LayoutList
} from "lucide-react";

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
        icon: <BriefcaseBusiness className="h-5 w-5 text-blue-400" />,
        color: "from-blue-500/20 to-cyan-500/20"
      },
      {
        label: "Saved pipeline",
        value: savedJobs.size.toLocaleString(),
        icon: <ShieldCheck className="h-5 w-5 text-purple-400" />,
        color: "from-purple-500/20 to-pink-500/20"
      },
      {
        label: "Verified employers",
        value: jobs.filter((job) => job.employerVerified).length.toLocaleString(),
        icon: <BadgeCheck className="h-5 w-5 text-emerald-400" />,
        color: "from-emerald-500/20 to-teal-500/20"
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
      <GlassPanel className="relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <Badge variant="purple" size="lg" className="uppercase tracking-[0.2em]">
              Marketplace
            </Badge>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                Browse & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Apply</span>
              </h1>
              <p className="mt-2 max-w-2xl text-lg text-white/50 font-medium">
                Find your next high-impact project or hire top-tier talent.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleFilters}
              className="flex items-center gap-2 glass-button px-4 py-2 text-sm"
            >
              {filtersOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {filtersOpen ? "Hide Filters" : "Show Filters"}
            </button>
            {!isEmployer && (
              <button
                type="button"
                onClick={() => runJobQuery({ savedOnly: filters.savedOnly ? undefined : true, page: 1 })}
                className={`flex items-center gap-2 glass-button px-4 py-2 text-sm ${filters.savedOnly ? "bg-white/20" : ""}`}
              >
                <Bookmark className={`h-4 w-4 ${filters.savedOnly ? "fill-white" : ""}`} />
                {filters.savedOnly ? "All Jobs" : "Saved Jobs"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <GlassCard key={card.label} className="p-4" hover={false}>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color}`}>
                  {card.icon}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{card.label}</p>
                  <p className="text-2xl font-black text-white">{card.value}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {activeCategoryLabels.length ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {activeCategoryLabels.map((label) => (
              <Badge key={label} variant="purple" className="px-4 py-2">
                {label}
              </Badge>
            ))}
            <button
              type="button"
              onClick={() => runJobQuery({ categories: [], page: 1 })}
              className="glass-button px-4 py-2 text-xs"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </GlassPanel>

      <div className={`grid gap-6 ${filtersOpen ? "xl:grid-cols-[320px_minmax(0,1fr)]" : "grid-cols-1"}`}>
        {filtersOpen ? (
          <aside className="space-y-4">
            <GlassPanel className="p-0 overflow-hidden border-white/5">
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
            </GlassPanel>
          </aside>
        ) : null}

        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between glass p-3 rounded-2xl">
            <div className="px-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Results</p>
              <p className="text-xs font-semibold text-white/60">
                Page {currentPage} of {Math.max(totalPages, 1)} • {jobs.length} items
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 glass-button px-2 py-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
              
              <select
                value={filters.pageSize ?? 12}
                onChange={(event) => runJobQuery({ pageSize: Number(event.target.value), page: 1 })}
                className="glass-button bg-transparent px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value={6}>6 per page</option>
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <GlassCard key={i} className="h-64" hover={false}>
                  <LoadingSkeleton rows={4} />
                </GlassCard>
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

          <div className="flex items-center justify-between glass p-4 rounded-2xl">
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Pagination</p>
              <p className="text-xs text-white/60 font-semibold">{totalCount} total results found</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => runJobQuery({ page: Math.max(1, currentPage - 1) })}
                disabled={!hasPreviousPage}
                className="glass-button px-4 py-2 text-sm disabled:opacity-20"
              >
                Previous
              </button>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-sm">
                {currentPage}
              </div>
              <button
                type="button"
                onClick={() => runJobQuery({ page: currentPage + 1 })}
                disabled={!hasNextPage}
                className="glass-button px-4 py-2 text-sm disabled:opacity-20"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {applyJob ? <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} /> : null}
    </div>
  );
}
