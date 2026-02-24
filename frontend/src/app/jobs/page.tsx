'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { JOB_TAXONOMY, getJobCategoryDisplay, jobCategoryMatches } from '@/lib/jobTaxonomy';

interface Job {
  id: string;
  title: string;
  description: string;
  categoryId?: string;
  engagementType: string;
  deliverableType: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  slaDeliveryDays: number;
  requiredSkills: string[];
  minYearsExperience: number;
  createdAt: string;
  status: string;
}

export default function JobListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    deliverableType: searchParams.get('type') || '',
    categoryId: searchParams.get('categoryId') || '',
    engagementType: '',
    pricingModel: '',
    industry: '',
    skills: '',
    budgetMin: '',
    budgetMax: '',
    minYearsExperience: '',
    enterpriseOnly: false,
  });

  const filteredJobs = jobs.filter((job) => {
    if (filters.deliverableType && job.deliverableType !== filters.deliverableType) return false;
    if (filters.categoryId && !jobCategoryMatches(job.categoryId, filters.categoryId)) return false;
    if (filters.engagementType && job.engagementType !== filters.engagementType) return false;
    if (filters.budgetMin && job.budgetMin < Number(filters.budgetMin)) return false;
    if (filters.budgetMax && job.budgetMax > Number(filters.budgetMax)) return false;
    if (filters.minYearsExperience && job.minYearsExperience < Number(filters.minYearsExperience)) return false;
    if (filters.skills) {
      const desired = filters.skills.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
      if (desired.length && !desired.some((skill) => job.requiredSkills.join(" ").toLowerCase().includes(skill))) {
        return false;
      }
    }
    return true;
  });

  const totalBudget = filteredJobs.reduce((sum, job) => sum + (job.budgetMax || 0), 0);
  const avgBudget = filteredJobs.length ? Math.round(totalBudget / filteredJobs.length) : 0;
  const enterpriseCount = filteredJobs.filter((job) => job.engagementType === "LONG_TERM_PARTNERSHIP").length;
  const engagementBuckets = filteredJobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.engagementType] = (acc[job.engagementType] || 0) + 1;
    return acc;
  }, {});
  const engagementTotal = Object.values(engagementBuckets).reduce((a, b) => a + b, 0) || 1;

  useEffect(() => {
    fetchJobs();
  }, [page, filters]);

  const fetchJobs = async () => {
    setLoading(true);
    setErrorMessage(null);
    const params: Record<string, any> = { page, size: 20 };
    if (filters.deliverableType) params.deliverableType = filters.deliverableType;
    if (filters.engagementType) params.engagementType = filters.engagementType;
    if (filters.pricingModel) params.pricingModel = filters.pricingModel;
    if (filters.industry) params.industry = filters.industry;
    if (filters.skills) params.skills = filters.skills;
    if (filters.budgetMin) params.budgetMin = filters.budgetMin;
    if (filters.budgetMax) params.budgetMax = filters.budgetMax;
    if (filters.minYearsExperience) params.minYearsExperience = filters.minYearsExperience;
    if (filters.enterpriseOnly) params.enterpriseOnly = filters.enterpriseOnly;
    try {

      const response = await axios.get('/api/v2/jobs/search', { params });
      setJobs(response.data.content || response.data);
    } catch (error) {
      if (backendBase) {
        try {
          const directResponse = await axios.get(`${backendBase.replace(/\/$/, '')}/api/v2/jobs/search`, { params });
          setJobs(directResponse.data.content || directResponse.data);
          return;
        } catch (directError) {
          console.error('Direct backend fetch failed:', directError);
        }
      }
      console.error('Error fetching jobs:', error);
      setErrorMessage(
        backendBase
          ? 'Jobs service is unavailable right now. Check backend connectivity or API gateway.'
          : 'Jobs service is unavailable. Set NEXT_PUBLIC_BACKEND_URL to a reachable backend host.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Enterprise marketplace</p>
              <h1 className="mt-3 text-4xl font-semibold">Strategic opportunities for enterprise delivery</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                Curated, compliance-ready engagements with funded budgets, governance checkpoints, and cross-functional teams.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/jobs/new")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
            >
              + Post enterprise role
            </button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { label: "Active briefs", value: filteredJobs.length, hint: "Live enterprise briefs in queue" },
              { label: "Avg. budget", value: avgBudget ? `$${avgBudget.toLocaleString()}` : "—", hint: "Average max budget" },
              { label: "Enterprise lanes", value: enterpriseCount, hint: "Long-term lanes in motion" },
              { label: "Cycle time (days)", value: filteredJobs[0]?.slaDeliveryDays || 30, hint: "Median SLA cycle" },
            ].map((stat) => (
              <div key={stat.label} className="relative rounded-2xl border border-white/10 bg-white/5 p-4 kpi-card">
                <span className="kpi-tooltip">{stat.hint}</span>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {errorMessage && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-teal-50 to-white px-5 py-4 text-sm text-emerald-900 shadow-[0_12px_30px_rgba(16,185,129,0.12)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Connectivity</p>
                <p className="mt-1 text-sm text-emerald-900">{errorMessage}</p>
                {!backendBase && (
                  <p className="mt-2 text-xs font-semibold text-emerald-800">
                    Add `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080` in `frontend/.env.local` and restart the dev server.
                  </p>
                )}
              </div>
              <button
                onClick={fetchJobs}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:mt-0"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.5)]">
            <h2 className="text-lg font-semibold">Enterprise controls</h2>
            <p className="mt-2 text-xs text-slate-400">Filter by compliance tier, delivery lane, and governance needs.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Deliverable Type
                  </label>
                  <select
                    name="deliverableType"
                    value={filters.deliverableType}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  >
                    <option value="">All Types</option>
                    <option value="IMAGE_DESIGN">Image & Design</option>
                    <option value="VIDEO_PRODUCTION">Video Production</option>
                    <option value="AUDIO_PRODUCTION">Audio Production</option>
                    <option value="DOCUMENT_DEVELOPMENT">Documents</option>
                    <option value="MIXED">Mixed Media</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Category
                  </label>
                  <select
                    name="categoryId"
                    value={filters.categoryId}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  >
                    <option value="">All Categories</option>
                    {JOB_TAXONOMY.roots.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Filters main categories (includes all subcategories).</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Engagement Type
                  </label>
                  <select
                    name="engagementType"
                    value={filters.engagementType}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  >
                    <option value="">All Types</option>
                    <option value="PROJECT_BASED">Project-Based</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="LONG_TERM_PARTNERSHIP">Long-Term</option>
                    <option value="RETAINER">Retainer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Budget Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="budgetMin"
                      placeholder="Min"
                      value={filters.budgetMin}
                      onChange={handleFilterChange}
                      className="flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"
                    />
                    <input
                      type="number"
                      name="budgetMax"
                      placeholder="Max"
                      value={filters.budgetMax}
                      onChange={handleFilterChange}
                      className="flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Min. Experience (years)
                  </label>
                  <input
                    type="number"
                    name="minYearsExperience"
                    value={filters.minYearsExperience}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Pricing Model
                  </label>
                  <select
                    name="pricingModel"
                    value={filters.pricingModel}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  >
                    <option value="">All Models</option>
                    <option value="FIXED_PRICE">Fixed Price</option>
                    <option value="HOURLY">Hourly Rate</option>
                    <option value="RETAINER">Retainer</option>
                    <option value="VOLUME_BASED">Volume-Based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industry"
                    placeholder="e.g. saas,finance"
                    value={filters.industry}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Comma-separated</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Skills
                  </label>
                  <input
                    type="text"
                    name="skills"
                    placeholder="e.g. photoshop,figma"
                    value={filters.skills}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Comma-separated</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="enterpriseOnly"
                      checked={filters.enterpriseOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, enterpriseOnly: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-200">Enterprise Only</span>
                  </label>
                </div>

                <button
                  onClick={() => setFilters({
                    deliverableType: '',
                    categoryId: '',
                    engagementType: '',
                    pricingModel: '',
                    industry: '',
                    skills: '',
                    budgetMin: '',
                    budgetMax: '',
                    minYearsExperience: '',
                    enterpriseOnly: false,
                  })}
                  className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Clear Filters
                </button>
              </div>
          </section>

          <section className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">Portfolio analyzer</h3>
                <p className="mt-2 text-xs text-slate-400">Engagement distribution and delivery readiness.</p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Engagement mix</p>
                    <div className="mt-4 flex items-center gap-4">
                      <svg viewBox="0 0 120 120" className="h-24 w-24">
                        <circle cx="60" cy="60" r="48" stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          stroke="#34d399"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(enterpriseCount / engagementTotal) * 301} 301`}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                        />
                      </svg>
                      <div className="space-y-1 text-xs text-slate-300">
                        <p>Long-term: {enterpriseCount}</p>
                        <p>Project: {engagementBuckets.PROJECT_BASED || 0}</p>
                        <p>Contract: {engagementBuckets.CONTRACT || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Budget velocity</p>
                    <div className="mt-4 space-y-3">
                      {[70, 45, 85, 60].map((value, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Wave {index + 1}</span>
                            <span>{value}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-emerald-500/20 to-slate-950/70 p-6">
                <h3 className="text-lg font-semibold">Enterprise insights</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li>Compliance-ready briefs with signed SLAs.</li>
                  <li>Vendor coverage across 12 delivery lanes.</li>
                  <li>Budget governance with automated approvals.</li>
                  <li>Realtime health scoring and risk flags.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Live marketplace briefs</h3>
                  <p className="text-xs text-slate-400">Pulled from the backend in real time.</p>
                </div>
                <span className="text-xs text-emerald-300">{filteredJobs.length} roles ready</span>
              </div>

              {loading ? (
                <div className="mt-6 text-sm text-slate-400">Loading jobs...</div>
              ) : filteredJobs.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-300">
                  No live jobs match your filters.
                </div>
              ) : null}

              <div className="mt-6 grid gap-4">
                {filteredJobs.map((job) => {
                  const categoryLabel = job.categoryId
                    ? getJobCategoryDisplay(job.categoryId, { unknownFallback: job.categoryId, separator: " \u203A " })
                    : null;

                  return (
                    <div
                      key={job.id}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="group cursor-pointer rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-emerald-400/40 hover:bg-slate-900/80"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {job.deliverableType.replace(/_/g, " ")}
                          </p>
                          <h4 className="mt-2 text-lg font-semibold">{job.title}</h4>
                          <p className="mt-2 text-sm text-slate-300 line-clamp-2">{job.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {categoryLabel ? (
                              <span
                                title={categoryLabel}
                                className="inline-block max-w-[240px] truncate rounded-full bg-sky-500/10 px-3 py-1 text-xs text-sky-200"
                              >
                                {categoryLabel}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                              {job.engagementType.replace(/_/g, " ")}
                            </span>
                            <span className="rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-200">
                              ${job.budgetMin?.toLocaleString()} - ${job.budgetMax?.toLocaleString()} {job.currency}
                            </span>
                            <span className="rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-200">
                              {job.slaDeliveryDays} day SLA
                            </span>
                          </div>
                          {job.requiredSkills?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {job.requiredSkills.slice(0, 4).map((skill) => (
                                <span key={skill} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                            {job.status || "OPEN"}
                          </span>
                          <span className="text-xs text-slate-400">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {filteredJobs.length > 0 && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-xs text-slate-400">Page {page + 1}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
