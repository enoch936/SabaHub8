import Link from "next/link";
import { AdminStreamingWorkspace } from "@/components/stream/AdminStreamingWorkspace";

export default function AdminRootPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Admin root</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-gray-950">Platform administration</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-500">
              This root admin page now exposes streaming operations directly and links back into the deeper command-center areas already present in the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/analytics" className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700">
              Executive analytics
            </Link>
            <Link href="/admin/users" className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700">
              User operations
            </Link>
          </div>
        </div>
      </section>
      <AdminStreamingWorkspace />
    </div>
  );
}
