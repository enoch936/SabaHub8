"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldAlert, Video } from "lucide-react";
import { toast } from "sonner";
import { getAdminStreamOverview, terminateStreamRecord, type StreamAdminOverview } from "@/lib/api";
import { formatViewerCount } from "@/lib/streaming";

export function AdminStreamingWorkspace() {
  const [overview, setOverview] = useState<StreamAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminStreamOverview();
      setOverview(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load streaming admin overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const terminate = async (streamId: string) => {
    setTerminatingId(streamId);
    try {
      await terminateStreamRecord(streamId, "Admin command center termination");
      toast.success("Stream terminated.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to terminate stream.");
    } finally {
      setTerminatingId(null);
    }
  };

  if (loading) {
    return <div className="rounded-[28px] border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading streaming command center…</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-700">
              <Activity className="h-3.5 w-3.5" />
              Streaming command center
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-gray-950">Admin streaming operations</h2>
            <p className="mt-2 text-sm leading-7 text-gray-500">Global visibility into live streams, viewer load, health cards, and emergency termination actions.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Live streams</div>
              <div className="mt-2 text-2xl font-semibold text-gray-950">{overview?.liveStreamCount ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Current viewers</div>
              <div className="mt-2 text-2xl font-semibold text-gray-950">{formatViewerCount(overview?.totalViewerCount ?? 0)}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Active calls</div>
              <div className="mt-2 text-2xl font-semibold text-gray-950">{overview?.activeCallCount ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Active broadcasts</div>
              <div className="mt-2 text-2xl font-semibold text-gray-950">{overview?.activeBroadcastCount ?? 0}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-950">
            <Video className="h-5 w-5 text-gray-700" />
            Live stream inventory
          </div>
          <div className="mt-5 space-y-4">
            {(overview?.liveStreams ?? []).length === 0 ? (
              <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">No live streams right now.</div>
            ) : (
              overview?.liveStreams.map((stream) => (
                <div key={stream.id} className="rounded-[24px] border border-gray-200 bg-gray-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-gray-950">{stream.title}</div>
                      <div className="mt-1 text-sm text-gray-500">Owner: {stream.ownerDisplayName}</div>
                      <div className="mt-1 text-xs text-gray-500">Mode: {stream.mode} | Media: {stream.mediaKind} | Region: {stream.primaryRegion ?? "n/a"}</div>
                      <div className="mt-2 text-sm text-gray-700">{stream.description}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                      <div>{formatViewerCount(stream.viewerCount)} viewers</div>
                      <div className="mt-1 text-xs text-gray-500">{stream.visibility}</div>
                      <div className="mt-1 text-xs text-gray-500">Cap: {formatViewerCount(stream.maxParticipants)}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void terminate(stream.id)}
                      disabled={terminatingId === stream.id}
                      className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 disabled:opacity-60"
                    >
                      {terminatingId === stream.id ? "Terminating..." : "Terminate stream"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-950">
            <ShieldAlert className="h-5 w-5 text-gray-700" />
            Health cards
          </div>
          <div className="mt-5 space-y-4">
            {(overview?.healthCards ?? []).map((card, index) => (
              <div key={`${card.label ?? "card"}-${index}`} className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{String(card.status ?? "Info")}</div>
                <div className="mt-2 text-sm font-semibold text-gray-950">{String(card.label ?? "Platform item")}</div>
                <div className="mt-1 text-sm text-gray-600">{String(card.detail ?? "")}</div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
