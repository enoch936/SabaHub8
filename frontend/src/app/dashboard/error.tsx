"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Optionally log to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
      <p className="text-slate-700">An unexpected error occurred while rendering this page.</p>
      <div className="mt-4">
        <button onClick={() => reset()} className="rounded bg-slate-900 px-4 py-2 text-white">Try again</button>
      </div>
      {process.env.NODE_ENV !== "production" && (
        <pre className="mt-4 overflow-auto rounded bg-slate-50 p-3 text-xs text-slate-800">{String(error.stack || error.message)}</pre>
      )}
    </div>
  );
}
