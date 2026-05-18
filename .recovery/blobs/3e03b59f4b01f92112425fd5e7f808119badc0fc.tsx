"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Mic2, Play, Radio, Shield, Video } from "lucide-react";
import { toast } from "sonner";
import {
  createStream,
  getStreamIngestInfo,
  joinStream,
  kickStreamViewer,
  me,
  muteStreamViewer,
  startStreamRecord,
  stopStreamRecord,
  updateStreamRecord,
  type StreamDetail,
  type StreamIngestInfo,
  type StreamMediaKind,
  type StreamMode,
  type StreamVisibility,
} from "@/lib/api";
import {
  connectWs,
  sendStreamPresenceJoin,
  sendStreamPresenceLeave,
  sendStreamSignal,
  subscribeStreamSignals,
  type Subscription,
} from "@/lib/ws";
import { StreamVideoStage } from "./StreamVideoStage";
import {
  STREAM_VISIBILITY_OPTIONS,
  buildStreamWatchHref,
  formatStreamStatus,
  formatViewerCount,
  resolveStreamPlaybackSource,
} from "@/lib/streaming";

type SignalEnvelope = {
  signalType?: string;
  senderUserId?: string;
  targetPeerId?: string;
  payload?: Record<string, unknown>;
};

type BroadcastPeerState = {
  connection: RTCPeerConnection;
  remoteDescriptionSet: boolean;
  pendingIceCandidates: RTCIceCandidateInit[];
};

const MAX_BROWSER_RUNNER_VIEWERS = 12;
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

function supportsAudio(mediaKind?: StreamMediaKind | null) {
  return mediaKind === "AUDIO" || mediaKind === "AUDIO_VIDEO";
}

function supportsVideo(mediaKind?: StreamMediaKind | null) {
  return mediaKind === "VIDEO" || mediaKind === "AUDIO_VIDEO";
}

function parseIceServers(turnServers?: Array<Record<string, unknown>> | null): RTCIceServer[] {
  const parsed: RTCIceServer[] = [];
  for (const item of turnServers ?? []) {
    const rawUrls = item.urls;
    const urls = Array.isArray(rawUrls)
      ? rawUrls.filter((value): value is string => typeof value === "string")
      : typeof rawUrls === "string"
        ? [rawUrls]
        : [];
    if (urls.length === 0) {
      continue;
    }
    parsed.push({
      urls: urls.length === 1 ? urls[0] : urls,
      username: typeof item.username === "string" ? item.username : undefined,
      credential: typeof item.credential === "string" ? item.credential : undefined,
    });
  }
  return [...parsed, ...FALLBACK_ICE_SERVERS];
}

function serializeIceCandidate(candidate: RTCIceCandidate): RTCIceCandidateInit {
  if (typeof candidate.toJSON === "function") {
    return candidate.toJSON();
  }
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment ?? undefined,
  };
}

function readIceCandidate(payload: Record<string, unknown>): RTCIceCandidateInit | null {
  const rawCandidate = payload.candidate;
  if (typeof rawCandidate === "string") {
    return {
      candidate: rawCandidate,
      sdpMid: typeof payload.sdpMid === "string" ? payload.sdpMid : null,
      sdpMLineIndex: typeof payload.sdpMLineIndex === "number" ? payload.sdpMLineIndex : null,
    };
  }

  if (!rawCandidate || typeof rawCandidate !== "object") {
    return null;
  }

  const candidateRecord = rawCandidate as Record<string, unknown>;
  const candidate = candidateRecord.candidate;
  if (typeof candidate !== "string" || !candidate.trim()) {
    return null;
  }

  return {
    candidate,
    sdpMid: typeof candidateRecord.sdpMid === "string" ? candidateRecord.sdpMid : null,
    sdpMLineIndex: typeof candidateRecord.sdpMLineIndex === "number" ? candidateRecord.sdpMLineIndex : null,
    usernameFragment: typeof candidateRecord.usernameFragment === "string" ? candidateRecord.usernameFragment : undefined,
  };
}

export function StreamerControlWorkspace() {
  const [draft, setDraft] = useState({
    title: "SabaHub Live Session",
    description: "Owner control panel for low-latency streaming, HLS fallback, and moderation.",
    visibility: "PUBLIC" as StreamVisibility,
    mode: "ONE_TO_MANY" as StreamMode,
    mediaKind: "AUDIO_VIDEO" as StreamMediaKind,
    recordingEnabled: true,
    lowLatencyEnabled: true,
    playbackEnabled: true,
    maxParticipants: 5000,
    tags: "community, livestream",
  });
  const [targetUserId, setTargetUserId] = useState("");
  const [stream, setStream] = useState<StreamDetail | null>(null);
  const [ingestInfo, setIngestInfo] = useState<StreamIngestInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEncoderSetup, setShowEncoderSetup] = useState(false);
  const [localMedia, setLocalMedia] = useState<MediaStream | null>(null);
  const [browserRunnerStatus, setBrowserRunnerStatus] = useState<"idle" | "ready" | "connecting" | "live" | "error">("idle");
  const [browserRunnerNote, setBrowserRunnerNote] = useState("");
  const [connectedPeers, setConnectedPeers] = useState(0);
  const localMediaRef = useRef<MediaStream | null>(null);
  const signalSubscriptionRef = useRef<Subscription | null>(null);
  const peerConnectionsRef = useRef<Map<string, BroadcastPeerState>>(new Map());
  const currentStreamIdRef = useRef<string | null>(null);
  const ownerUserIdRef = useRef("");
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE_SERVERS);

  useEffect(() => {
    return () => {
      signalSubscriptionRef.current?.unsubscribe();
      signalSubscriptionRef.current = null;
      const currentStreamId = currentStreamIdRef.current;
      if (currentStreamId) {
        sendStreamPresenceLeave(currentStreamId);
      }
      peerConnectionsRef.current.forEach((peer) => peer.connection.close());
      peerConnectionsRef.current.clear();
      localMediaRef.current?.getTracks().forEach((track) => track.stop());
      localMediaRef.current = null;
    };
  }, []);

  const previewSource = useMemo(
    () =>
      resolveStreamPlaybackSource({
        id: stream?.id,
        status: stream?.status ?? "DRAFT",
        liveHlsUrl: stream?.liveHlsUrl ?? null,
        playbackHlsUrl: stream?.playbackHlsUrl ?? null,
        mediaKind: stream?.mediaKind ?? draft.mediaKind,
      }),
    [draft.mediaKind, stream?.id, stream?.liveHlsUrl, stream?.mediaKind, stream?.playbackHlsUrl, stream?.status],
  );

  const watchHref = stream ? buildStreamWatchHref(stream.id) : null;

  const buildStreamPayload = () => ({
    title: draft.title,
    description: draft.description,
    visibility: draft.visibility,
    mode: draft.mode,
    mediaKind: draft.mediaKind,
    recordingEnabled: draft.recordingEnabled,
    lowLatencyEnabled: draft.lowLatencyEnabled,
    playbackEnabled: draft.playbackEnabled,
    maxParticipants: draft.maxParticipants,
    tags: draft.tags.split(",").map((item) => item.trim()).filter(Boolean),
  });

  const releaseLocalMedia = () => {
    localMediaRef.current?.getTracks().forEach((track) => track.stop());
    localMediaRef.current = null;
    setLocalMedia(null);
  };

  const closeBrowserRunner = (options: { stopMedia?: boolean } = {}) => {
    signalSubscriptionRef.current?.unsubscribe();
    signalSubscriptionRef.current = null;
    const currentStreamId = currentStreamIdRef.current;
    if (currentStreamId) {
      sendStreamPresenceLeave(currentStreamId);
    }
    currentStreamIdRef.current = null;
    ownerUserIdRef.current = "";
    peerConnectionsRef.current.forEach((peer) => peer.connection.close());
    peerConnectionsRef.current.clear();
    setConnectedPeers(0);
    if (options.stopMedia ?? true) {
      releaseLocalMedia();
    }
    setBrowserRunnerStatus("idle");
    setBrowserRunnerNote("");
  };

  const ensureLocalBroadcastMedia = async (streamForMedia: Pick<StreamDetail, "mediaKind">) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("This browser does not support camera or microphone capture.");
    }

    const needsAudio = supportsAudio(streamForMedia.mediaKind);
    const needsVideo = supportsVideo(streamForMedia.mediaKind);
    const current = localMediaRef.current;
    const currentMatches =
      current &&
      (needsAudio ? current.getAudioTracks().length > 0 : current.getAudioTracks().length === 0) &&
      (needsVideo ? current.getVideoTracks().length > 0 : current.getVideoTracks().length === 0);

    if (currentMatches) {
      return current;
    }

    releaseLocalMedia();
    setBrowserRunnerStatus("connecting");
    setBrowserRunnerNote("Waiting for browser camera and microphone permission.");
    const media = await navigator.mediaDevices.getUserMedia({
      audio: needsAudio,
      video: needsVideo
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          }
        : false,
    });
    localMediaRef.current = media;
    setLocalMedia(media);
    setBrowserRunnerStatus("ready");
    setBrowserRunnerNote("Camera and microphone are ready.");
    return media;
  };

  const flushPendingIceCandidates = async (peer: BroadcastPeerState) => {
    const pending = [...peer.pendingIceCandidates];
    peer.pendingIceCandidates = [];
    for (const candidate of pending) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const createOrGetBroadcastPeer = (targetPeerId: string) => {
    const existing = peerConnectionsRef.current.get(targetPeerId);
    if (existing) {
      return existing;
    }

    const connection = new RTCPeerConnection({ iceServers: iceServersRef.current });
    const peer: BroadcastPeerState = {
      connection,
      remoteDescriptionSet: false,
      pendingIceCandidates: [],
    };

    connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      const currentStreamId = currentStreamIdRef.current;
      if (!currentStreamId) {
        return;
      }
      sendStreamSignal(currentStreamId, {
        signalType: "ICE",
        targetPeerId,
        payload: { candidate: serializeIceCandidate(event.candidate) },
      });
    };

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === "connected") {
        setBrowserRunnerStatus("live");
      }
      if (connection.connectionState === "failed" || connection.connectionState === "disconnected" || connection.connectionState === "closed") {
        peerConnectionsRef.current.delete(targetPeerId);
        setConnectedPeers(peerConnectionsRef.current.size);
      }
    };

    const media = localMediaRef.current;
    media?.getTracks().forEach((track) => connection.addTrack(track, media));
    peerConnectionsRef.current.set(targetPeerId, peer);
    setConnectedPeers(peerConnectionsRef.current.size);
    return peer;
  };

  const handleBroadcastSignal = async (body: SignalEnvelope) => {
    const currentStreamId = currentStreamIdRef.current;
    const ownerUserId = ownerUserIdRef.current;
    const senderUserId = typeof body.senderUserId === "string" ? body.senderUserId : "";
    const targetPeerId = typeof body.targetPeerId === "string" ? body.targetPeerId : "";
    const payload = (body.payload ?? {}) as Record<string, unknown>;
    const rawType = typeof body.signalType === "string" ? body.signalType.toUpperCase() : "CONTROL";

    if (!currentStreamId || !senderUserId || senderUserId === ownerUserId) {
      return;
    }
    if (targetPeerId && targetPeerId !== ownerUserId && targetPeerId !== "*" && targetPeerId.toUpperCase() !== "ALL") {
      return;
    }

    if (rawType === "CONTROL") {
      const controlType = typeof payload.controlType === "string" ? payload.controlType : "";
      if (controlType !== "REQUEST_OFFER") {
        return;
      }
      if (!localMediaRef.current) {
        setBrowserRunnerStatus("error");
        setBrowserRunnerNote("A viewer requested the live feed, but camera/mic is not enabled.");
        return;
      }
      if (peerConnectionsRef.current.size >= MAX_BROWSER_RUNNER_VIEWERS) {
        sendStreamSignal(currentStreamId, {
          signalType: "CONTROL",
          targetPeerId: senderUserId,
          payload: { controlType: "FALLBACK_HLS", reason: "Browser runner capacity reached" },
        });
        return;
      }

      const peer = createOrGetBroadcastPeer(senderUserId);
      const offer = await peer.connection.createOffer();
      await peer.connection.setLocalDescription(offer);
      sendStreamSignal(currentStreamId, {
        signalType: "OFFER",
        targetPeerId: senderUserId,
        payload: { type: offer.type, sdp: offer.sdp },
      });
      setBrowserRunnerStatus("live");
      setBrowserRunnerNote("Browser runner is sending live media to viewers.");
      return;
    }

    if (rawType === "OFFER") {
      if (!localMediaRef.current) {
        return;
      }
      const sdp = typeof payload.sdp === "string" ? payload.sdp : "";
      if (!sdp) {
        return;
      }
      const peer = createOrGetBroadcastPeer(senderUserId);
      await peer.connection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }));
      peer.remoteDescriptionSet = true;
      await flushPendingIceCandidates(peer);
      const answer = await peer.connection.createAnswer();
      await peer.connection.setLocalDescription(answer);
      sendStreamSignal(currentStreamId, {
        signalType: "ANSWER",
        targetPeerId: senderUserId,
        payload: { type: answer.type, sdp: answer.sdp },
      });
      setBrowserRunnerStatus("live");
      return;
    }

    if (rawType === "ANSWER") {
      const peer = peerConnectionsRef.current.get(senderUserId);
      const sdp = typeof payload.sdp === "string" ? payload.sdp : "";
      if (!peer || !sdp) {
        return;
      }
      await peer.connection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }));
      peer.remoteDescriptionSet = true;
      await flushPendingIceCandidates(peer);
      setBrowserRunnerStatus("live");
      return;
    }

    if (rawType === "ICE") {
      const candidate = readIceCandidate(payload);
      if (!candidate) {
        return;
      }
      const peer = peerConnectionsRef.current.get(senderUserId) ?? createOrGetBroadcastPeer(senderUserId);
      if (!peer.remoteDescriptionSet) {
        peer.pendingIceCandidates.push(candidate);
        return;
      }
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const startBrowserRunner = async (streamForRunner: StreamDetail) => {
    if (currentStreamIdRef.current && currentStreamIdRef.current !== streamForRunner.id) {
      closeBrowserRunner({ stopMedia: false });
    }

    ownerUserIdRef.current = streamForRunner.ownerUserId || ownerUserIdRef.current || (await me().then((user) => user.id).catch(() => ""));
    currentStreamIdRef.current = streamForRunner.id;
    const joinData = await joinStream(streamForRunner.id, "WEBRTC");
    iceServersRef.current = parseIceServers(joinData.turnServers);
    await connectWs();
    signalSubscriptionRef.current?.unsubscribe();
    signalSubscriptionRef.current = subscribeStreamSignals(streamForRunner.id, (body) => {
      void handleBroadcastSignal(body as SignalEnvelope).catch(() => {
        setBrowserRunnerStatus("error");
        setBrowserRunnerNote("Realtime signaling failed for one viewer. New viewers can retry from the watch page.");
      });
    });
    sendStreamPresenceJoin(streamForRunner.id);
    setBrowserRunnerStatus("live");
    setBrowserRunnerNote("Browser runner is live. Viewers can watch from the stream page.");
  };

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}.`);
    }
  };

  const createDraftStream = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (stream?.status === "LIVE") {
        await stopStreamRecord(stream.id);
      }
      closeBrowserRunner();
      const created = await createStream(buildStreamPayload());
      setStream(created);
      setIngestInfo(null);
      setShowEncoderSetup(false);
      toast.success("Stream draft created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create stream.");
    } finally {
      setSaving(false);
    }
  };

  const saveChanges = async () => {
    if (!stream) return;
    setSaving(true);
    try {
      const updated = await updateStreamRecord(stream.id, buildStreamPayload());
      setStream(updated);
      toast.success("Stream settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save stream.");
    } finally {
      setSaving(false);
    }
  };

  const prepareGoLive = async () => {
    if (!stream) return;
    setSaving(true);
    try {
      const ingest = await getStreamIngestInfo(stream.id);
      setIngestInfo(ingest);
      setShowEncoderSetup(true);
      toast.success("Encoder setup loaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load ingest details.");
    } finally {
      setSaving(false);
    }
  };

  const goLiveNow = async () => {
    setSaving(true);
    try {
      const draftStream = stream ?? (await createStream(buildStreamPayload()));
      if (!stream) {
        setStream(draftStream);
        setIngestInfo(null);
        setShowEncoderSetup(false);
      }
      await ensureLocalBroadcastMedia(draftStream);
      const started = await startStreamRecord(draftStream.id, {
        recordingEnabled: draft.recordingEnabled,
        lowLatencyEnabled: draft.lowLatencyEnabled,
        playbackEnabled: draft.playbackEnabled,
      });
      setStream(started);
      await startBrowserRunner(started);
      toast.success("Stream is live from this browser.");
    } catch (error) {
      setBrowserRunnerStatus("error");
      setBrowserRunnerNote(error instanceof Error ? error.message : "Unable to start browser live runner.");
      toast.error(error instanceof Error ? error.message : "Unable to start stream.");
    } finally {
      setSaving(false);
    }
  };

  const endLive = async () => {
    if (!stream) return;
    setSaving(true);
    try {
      closeBrowserRunner();
      const ended = await stopStreamRecord(stream.id);
      setStream(ended);
      toast.success("Stream stopped.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to stop stream.");
    } finally {
      setSaving(false);
    }
  };

  const runModerationAction = async (action: "mute" | "kick") => {
    if (!stream || !targetUserId.trim()) {
      toast.error("Enter a target user ID first.");
      return;
    }
    try {
      if (action === "mute") {
        await muteStreamViewer(stream.id, { targetUserId: targetUserId.trim(), reason: "Owner moderation action" });
        toast.success("Viewer muted.");
      } else {
        await kickStreamViewer(stream.id, { targetUserId: targetUserId.trim(), reason: "Owner moderation action" });
        toast.success("Viewer removed.");
      }
      setTargetUserId("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Moderation action failed.");
    }
  };

  const copyWatchLink = async () => {
    if (!watchHref || typeof window === "undefined") {
      return;
    }
    await copyValue("Watch link", `${window.location.origin}${watchHref}`);
  };

  const toggleEncoderSetup = async () => {
    if (!stream) {
      return;
    }
    if (ingestInfo) {
      setShowEncoderSetup((current) => !current);
      return;
    }
    await prepareGoLive();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-950">
          <Video className="h-5 w-5 text-gray-700" />
          Live studio
        </div>
        <p className="mt-2 text-sm text-gray-500">Build the stream, preview real video, then go live with a viewer page that feels closer to TikTok and YouTube instead of raw encoder settings.</p>

        <div className="mt-6 space-y-4">
          <StreamVideoStage
            primarySrc={localMedia ? null : previewSource.primaryUrl}
            fallbackSrc={localMedia ? "" : previewSource.fallbackUrl}
            mediaStream={localMedia}
            posterSrc={previewSource.posterUrl}
            headline={stream?.title || draft.title}
            detail={
              localMedia
                ? "Your browser camera and microphone are the active live source. Viewers receive this feed directly over the stream page."
                : stream
                ? `${formatStreamStatus(stream.status)} stream preview. Your audience can watch this from the public live page and use chat while the broadcast is running.`
                : "Play the studio preview now, then create your stream draft to unlock the live page, chat, and moderation buttons."
            }
            statusLabel={localMedia ? "Browser runner" : stream ? `${formatStreamStatus(stream.status)} studio` : "Studio preview"}
            accentLabel={localMedia ? "Device source" : previewSource.accent}
            autoPlay
            muted
          />

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Status: <span className="font-semibold text-gray-950">{stream ? formatStreamStatus(stream.status) : "Ready"}</span>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Mode: <span className="font-semibold text-gray-950">{stream?.mode ?? draft.mode}</span>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Media: <span className="font-semibold text-gray-950">{stream?.mediaKind ?? draft.mediaKind}</span>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Audience cap: <span className="font-semibold text-gray-950">{formatViewerCount(stream?.maxParticipants ?? draft.maxParticipants)}</span>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 md:col-span-4">
              Browser runner: <span className="font-semibold text-gray-950">{browserRunnerStatus}</span>
              <span className="ml-2 text-gray-500">{browserRunnerNote || `${connectedPeers} direct viewer connection${connectedPeers === 1 ? "" : "s"}`}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void goLiveNow()}
              disabled={saving}
              className="inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className="mr-2 h-4 w-4" />
              {stream?.status === "LIVE" ? "Restart live runner" : stream ? "Go live now" : "Create and go live"}
            </button>
            {watchHref ? (
              <Link
                href={watchHref}
                className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700"
              >
                Watch stream page
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void copyWatchLink()}
              disabled={!watchHref}
              className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Copy watch link
            </button>
          </div>
        </div>

        <form onSubmit={createDraftStream} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-gray-900">Title</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-[24px] border border-gray-200 px-4 py-3 text-sm outline-none"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-gray-900">Description</span>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="w-full rounded-[24px] border border-gray-200 px-4 py-3 text-sm outline-none"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-900">Visibility</span>
              <select
                value={draft.visibility}
                onChange={(event) => setDraft((current) => ({ ...current, visibility: event.target.value as StreamVisibility }))}
                className="w-full rounded-[24px] border border-gray-200 px-4 py-3 text-sm outline-none"
              >
                {STREAM_VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-900">Tags</span>
              <input
                value={draft.tags}
                onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
                className="w-full rounded-[24px] border border-gray-200 px-4 py-3 text-sm outline-none"
                placeholder="music, product-demo, ama"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-900">Session mode</span>
              <select
                value={draft.mode}
                onChange={(event) => {
                  const nextMode = event.target.value as StreamMode;
                  setDraft((current) => ({
                    ...current,
                    mode: nextMode,
                    maxParticipants: nextMode === "ONE_TO_ONE" ? 2 : Math.max(100, current.maxParticipants),
                  }));
                }}
                className="w-full rounded-[24px] border border-gray-200 px-4 py-3 text-sm outline-none"
              >
                <option value="ONE_TO_ONE">One-to-one call</option>
                <option value="ONE_TO_MANY">One-to-many broadcast</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-900">Media type</span>
              <select
                value={draft.mediaKind}
                onChange={(event) => setDraft((current) => ({ ...current, mediaKind: event.target.value as StreamMediaKind }))}
                className="w-full rounded-[24px] border border-gray-200 px-4 py-3 text-sm outline-none"
              >
                <option value="AUDIO_VIDEO">Audio + Video</option>
                <option value="AUDIO">Audio only</option>
                <option value="VIDEO">Video only</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-900">Max participants</span>
              <input
                type="number"
                min={draft.mode === "ONE_TO_ONE" ? 2 : 10}
                max={100000}
                value={draft.maxParticipants}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maxParticipants: Math.max(draft.mode === "ONE_TO_ONE" ? 2 : 10, Number(event.target.value || 0)),
                  }))
                }
                className="w-full rounded-[24px] border border-gray-200 px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-sm font-medium text-gray-700">Recording enabled</span>
              <input
                type="checkbox"
                checked={draft.recordingEnabled}
                onChange={(event) => setDraft((current) => ({ ...current, recordingEnabled: event.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-sm font-medium text-gray-700">Low latency mode</span>
              <input
                type="checkbox"
                checked={draft.lowLatencyEnabled}
                onChange={(event) => setDraft((current) => ({ ...current, lowLatencyEnabled: event.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Playback (HLS replay) enabled</span>
              <input
                type="checkbox"
                checked={draft.playbackEnabled}
                onChange={(event) => setDraft((current) => ({ ...current, playbackEnabled: event.target.checked }))}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Saving..." : stream ? "Create another draft" : "Create stream draft"}
            </button>
            {stream ? (
              <button type="button" onClick={() => void saveChanges()} disabled={saving} className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700">
                Save stream config
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <aside className="space-y-6">
        <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-950">
            <Radio className="h-5 w-5 text-gray-700" />
            Live operations
          </div>
          {stream ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div className="font-semibold text-gray-950">{stream.title}</div>
                <div className="mt-1">Status: {stream.status}</div>
                <div className="mt-1">Viewers: {formatViewerCount(stream.viewerCount)}</div>
                <div className="mt-1">Mode: {stream.mode}</div>
                <div className="mt-1">Media: {stream.mediaKind}</div>
                <div className="mt-1">Cap: {formatViewerCount(stream.maxParticipants)}</div>
                <div className="mt-1">Room: {stream.webrtcRoomId || "Pending"}</div>
                <div className="mt-1">Browser runner: {browserRunnerStatus}</div>
                <div className="mt-1">Direct viewers: {formatViewerCount(connectedPeers)}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void toggleEncoderSetup()}
                  disabled={saving}
                  className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 disabled:opacity-60"
                >
                  {showEncoderSetup ? "Hide encoder setup" : "Show encoder setup"}
                </button>
                <button
                  type="button"
                  onClick={() => void endLive()}
                  disabled={saving || stream.status !== "LIVE"}
                  className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 disabled:opacity-60"
                >
                  Stop stream
                </button>
              </div>
              {showEncoderSetup && ingestInfo ? (
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <div className="font-semibold">Advanced encoder setup</div>
                  <p className="mt-1 text-xs text-emerald-800/90">Use this only if you want to publish from OBS, mobile RTMP, or another external encoder.</p>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div className="break-all"><span className="font-medium">RTMP base:</span> {ingestInfo.rtmpIngestBaseUrl}</div>
                    <button
                      type="button"
                      onClick={() => void copyValue("RTMP base URL", ingestInfo.rtmpIngestBaseUrl)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </div>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div className="break-all"><span className="font-medium">Stream key:</span> {ingestInfo.streamKey}</div>
                    <button
                      type="button"
                      onClick={() => void copyValue("Stream key", ingestInfo.streamKey)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </div>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div className="break-all"><span className="font-medium">Publish URL:</span> {ingestInfo.publishUrl}</div>
                    <button
                      type="button"
                      onClick={() => void copyValue("Publish URL", ingestInfo.publishUrl)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </div>
                  <div className="mt-1 break-all"><span className="font-medium">Expected HLS:</span> {ingestInfo.expectedLiveHlsUrl}</div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Create a draft first to unlock publishing controls.</p>
          )}
        </section>

        <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-950">
            <Shield className="h-5 w-5 text-gray-700" />
            Moderation
          </div>
          <p className="mt-2 text-sm text-gray-500">Owner controls to mute or remove viewers by platform user ID.</p>
          <div className="mt-4 grid gap-3">
            <input
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
              placeholder="Target user ID"
              className="w-full rounded-[24px] border border-gray-200 px-4 py-3 text-sm outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => void runModerationAction("mute")} className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700">
                <Mic2 className="mr-2 inline h-4 w-4" />
                Mute viewer
              </button>
              <button type="button" onClick={() => void runModerationAction("kick")} className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">
                Remove viewer
              </button>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
