"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listJobs } from "@/lib/api";

export default function JobsBrowsePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["jobs"], queryFn: listJobs });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browse Jobs</h1>
          <p className="text-slate-600">Public jobs</p>
        </div>
        <Link href="/dashboard/jobs/new" className="rounded-lg bg-sky-600 px-4 py-2 text-white">Post a Job</Link>
      </header>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-rose-600">Failed to load jobs</p>}
      {!isLoading && !error && (
        <ul className="space-y-3">
          {data?.map((job) => (
            <li key={job.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                </div>
                <Link href={`/dashboard/jobs/${job.id}`} className="text-sky-700">View</Link>
              </div>
            </li>
          ))}
          {(!data || data.length === 0) && <p className="text-slate-600">No jobs yet.</p>}
        </ul>
      )}
    </main>
  );
}
