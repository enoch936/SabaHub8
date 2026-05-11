"use client";

import EmptyState from "@/components/EmptyState";
import { SmartJobCard } from "./SmartJobCard";
import type { Job } from "@/lib/types";

interface JobCardGridProps {
  jobs: Job[];
  viewMode: "grid" | "list";
  onApply: (job: Job) => void;
  onSave: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onMessage?: (job: Job) => void;
}

export function JobCardGrid({ jobs, viewMode, onApply, onSave, onDelete, onMessage }: JobCardGridProps) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        emoji="🔍"
        title="No jobs"
        description="Try different filters."
      />
    );
  }

  return (
    <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 2xl:grid-cols-2" : "space-y-4"}>
      {jobs.map((job) => (
        <div key={job.id}>
          <SmartJobCard
            job={job}
            viewMode={viewMode}
            onApply={onApply}
            onSave={onSave}
            onDelete={onDelete}
            onMessage={onMessage}
          />
        </div>
      ))}
    </div>
  );
}
