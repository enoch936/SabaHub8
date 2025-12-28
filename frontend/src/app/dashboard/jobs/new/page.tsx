"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createJob } from "@/lib/api";
import { useState } from "react";

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () => createJob({ title, description }),
    onSuccess: (job) => router.push(`/dashboard/jobs/${job.id}`),
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Post a Job</h1>
      <div className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border p-2" placeholder="Title" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded border p-2" rows={6} placeholder="Description" />
        <button onClick={() => mutation.mutate()} className="rounded bg-sky-600 px-4 py-2 text-white">Create</button>
        {mutation.isPending && <p>Creating...</p>}
        {mutation.isError && <p className="text-rose-600">Failed to create.</p>}
      </div>
    </main>
  );
}
