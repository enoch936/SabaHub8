"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listJobs } from "@/lib/api";
import { Card, Badge, Button, Input, Select, Skeleton } from "@/components/ui";
import { useState } from "react";

export default function JobsBrowsePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["jobs"], queryFn: listJobs });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const filteredJobs = data?.filter((job: any) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || job.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === "recent") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === "budget-high") return (b.budget?.max || 0) - (a.budget?.max || 0);
    if (sortBy === "budget-low") return (a.budget?.min || 0) - (b.budget?.min || 0);
    return 0;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Browse Jobs</h1>
              <p className="mt-1 text-slate-600">
                {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} available
              </p>
            </div>
            <Link href="/dashboard/jobs/new">
              <Button size="lg" leftIcon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }>
                Post a Job
              </Button>
            </Link>
          </div>
        </header>

        {/* Filters */}
        <Card className="mb-6 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
              <Input
                type="search"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="marketing">Marketing</option>
                <option value="writing">Writing</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Sort By</label>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="recent">Most Recent</option>
                <option value="budget-high">Budget: High to Low</option>
                <option value="budget-low">Budget: Low to High</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Job List */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="mb-3 h-6 w-2/3" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-6 w-20" variant="rectangular" />
                  <Skeleton className="h-6 w-20" variant="rectangular" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card variant="bordered" className="border-rose-200 bg-rose-50 p-8 text-center">
            <div className="mb-2 text-4xl">⚠️</div>
            <p className="font-medium text-rose-700">Failed to load jobs</p>
            <p className="text-sm text-rose-600">Please try again later</p>
          </Card>
        )}

        {!isLoading && !error && sortedJobs.length === 0 && (
          <Card variant="bordered" className="p-12 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">No jobs found</h3>
            <p className="mb-6 text-slate-600">
              {searchQuery || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Be the first to post a job!"}
            </p>
            {(searchQuery || categoryFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </Card>
        )}

        {!isLoading && !error && sortedJobs.length > 0 && (
          <div className="grid gap-6">
            {sortedJobs.map((job: any) => (
              <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
                <Card hover className="group p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 text-2xl">
                          💼
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="mb-1 text-xl font-bold text-slate-900 group-hover:text-sky-600 transition truncate">
                            {job.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {job.skills?.slice(0, 5).map((skill: string, i: number) => (
                          <Badge key={i} variant="info" size="sm">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills?.length > 5 && (
                          <Badge variant="default" size="sm">
                            +{job.skills.length - 5} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold text-slate-900">
                            ${job.budget?.min?.toLocaleString()} - ${job.budget?.max?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                          </svg>
                          <span>{job.proposalCount || 0} proposals</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={
                        job.status === "OPEN" ? "success" :
                        job.status === "IN_PROGRESS" ? "info" :
                        job.status === "COMPLETED" ? "default" : "warning"
                      }
                    >
                      {job.status}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
