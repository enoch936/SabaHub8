"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Copy, MessageSquare, Radio, Users, Video } from "lucide-react";
import { toast } from "sonner";
import {
  getStream,
  joinStream,
  leaveStreamRecord,
  me,
  type StreamDetail,
  type StreamJoinResponse,
} from "@/lib/api";
import {
  connectWs,
  sendStreamChat,
  sendStreamPresenceJoin,
  sendStreamPresenceLeave,
  sendStreamSignal,
  subscribeStreamChat,
  subscribeStreamPresence,
  subscribeStreamSignals,
} from "@/lib/ws";
import { StreamVideoStage } from "./StreamVideoStage";
import {
  buildStreamWatchHref,
  formatStreamStatus,
  formatViewerCount,
  resolveStreamPlaybackSource,
} from "@/lib/streaming";

type StreamEvent = {
  senderDisplayName?: string;
  body?: string;
  occurredAt?: number;
};

type SignalEnvelope = {
  signalType?: string;
  senderUserId?: string;
  targetPeerId?: string;
  payload?: Record<string, unknown>;
};

type WebRtcState = "idle" | "connecting" | "connected" | "fallback" | "error";

const MAX_WEBRTC_MESH_VIEWERS = 12;
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

function supportsAudio(mediaKind?: string | null) {
  return mediaKind === "AUDIO" || mediaKind === "AUDIO_VIDEO";
}

function supportsVideo(mediaKind?: string | null) {
  return mediaKind === "VIDEO" || mediaKind === "AUDIO_VIDEO";
}

function parseIceServers(turnServers?: Array<Record<string, unknown>> | null): RTCIceServer[] {
  if (!turnServers || turnServers.length === 0) {
    return FALLBACK_ICE_SERVERS;
  }
  const parsed: RTCIceServer[] = [];
  for (const item of turnServers) {
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

export function LiveViewerWorkspace({ streamId }: { streamId: string }) {
  const [stream, setStream] = useState<StreamDetail | null>(null);
  const [joinInfo, setJoinInfo] = useState<StreamJoinResponse | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<StreamEvent[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [webrtcState, setWebrtcState] = useState<WebRtcState>("idle");
  const [webrtcNote, setWebrtcNote] = useState("");
  const [connectedPeers, setConnectedPeers] = useState(0);
  const [localMedia, setLocalMedia] = useState<MediaStream | null>(null);
  const [remoteMedia, setRemoteMedia] = useState<MediaStream | null>(null);
  const [localMediaBusy, setLocalMediaBusy] = useState(false);

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localMediaRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const playbackSource = useMemo(
    () =>
      resolveStreamPlaybackSource({
        id: stream?.id ?? streamId,
        status: stream?.status ?? "DRAFT",
        liveHlsUrl: joinInfo?.liveHlsUrl ?? stream?.liveHlsUrl,
        playbackHlsUrl: joinInfo?.playbackHlsUrl ?? stream?.playbackHlsUrl,
        mediaKind: stream?.mediaKind,
      }),
    [
      joinInfo?.liveHlsUrl,
      joinInfo?.playbackHlsUrl,
      stream?.id,
      stream?.liveHlsUrl,
      stream?.mediaKind,
      stream?.playbackHlsUrl,
      stream?.status,
      streamId,
    ],
  );

  const isOwner = Boolean(stream?.permissions?.canManage && currentUserId && stream?.ownerUserId === currentUserId);
  const canUseWebRtc = stream?.status === "LIVE" && joinInfo?.preferredProtocol === "WEBRTC";
  const iceServers = useMemo(() => parseIceServers(joinInfo?.turnServers), [joinInfo?.turnServers]);
  const watchHref = useMemo(() => buildStreamWatchHref(streamId), [streamId]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localMedia;
    }
  }, [localMedia]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteMedia;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteMedia;
    }
  }, [remoteMedia]);

  useEffect(() => {
    let active = true;
    let chatSubscription: { unsubscribe: () => void } | null = null;
    let presenceSubscription: { unsubscribe: () => void } | null = null;
    let signalSubscription: { unsubscribe: () => void } | null = null;

    const closePeerConnections = () => {
      peerConnectionsRef.current.forEach((connection) => {
        try {
          connection.close();
        } catch {
          // Ignore peer close issues during teardown.
        }
      });
      peerConnectionsRef.current.clear();
      setConnectedPeers(0);
    };

    const stopLocalMedia = () => {
      const media = localMediaRef.current;
      if (!media) {
        return;
      }
      media.getTracks().forEach((track) => track.stop());
      localMediaRef.current = null;
      setLocalMedia(null);
    };

    const createOrGetPeer = (targetPeerId: string, streamData: StreamDetail, myUserId: string) => {
      const existing = peerConnectionsRef.current.get(targetPeerId);
      if (existing) {
        return existing;
      }

      const peer = new RTCPeerConnection({ iceServers });

      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }
        sendStreamSignal(streamId, {
          signalType: "ICE",
          targetPeerId,
          payload: { candidate: event.candidate },
        });
      };

      peer.ontrack = (event) => {
        const [incoming] = event.streams;
        if (incoming) {
          setRemoteMedia(incoming);
          setWebrtcState("connected");
        }
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") {
          setWebrtcState("connected");
        } else if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
          setWebrtcState("fallback");
          setWebrtcNote("WebRTC link dropped. Falling back to HLS playback.");
        }
      };

      const local = localMediaRef.current;
      const myTracks = local?.getTracks() ?? [];

      if (myTracks.length > 0) {
        myTracks.forEach((track) => peer.addTrack(track, local!));
      } else {
        if (supportsAudio(streamData.mediaKind)) {
          peer.addTransceiver("audio", { direction: "recvonly" });
        }
        if (supportsVideo(streamData.mediaKind)) {
          peer.addTransceiver("video", { direction: "recvonly" });
        }
      }

      peerConnectionsRef.current.set(targetPeerId, peer);
      setConnectedPeers(peerConnectionsRef.current.size);
      return peer;
    };

    const handleSignal = async (body: SignalEnvelope, streamData: StreamDetail, myUserId: string) => {
      const rawType = typeof body.signalType === "string" ? body.signalType.toUpperCase() : "CONTROL";
      const senderUserId = typeof body.senderUserId === "string" ? body.senderUserId : "";
      const targetPeerId = typeof body.targetPeerId === "string" ? body.targetPeerId : "";
      const payload = (body.payload ?? {}) as Record<string, unknown>;

      if (!senderUserId || senderUserId === myUserId) {
        return;
      }
      if (targetPeerId && targetPeerId !== myUserId && targetPeerId !== "*" && targetPeerId.toUpperCase() !== "ALL") {
        return;
      }

      if (rawType === "CONTROL") {
        const controlType = typeof payload.controlType === "string" ? payload.controlType : "";

        if (controlType === "REQUEST_OFFER" && isOwner) {
          if (!localMediaRef.current) {
            setWebrtcNote("Owner media is not enabled yet. Turn on camera/mic first.");
            return;
          }
          if (peerConnectionsRef.current.size >= MAX_WEBRTC_MESH_VIEWERS) {
            sendStreamSignal(streamId, {
              signalType: "CONTROL",
              targetPeerId: senderUserId,
              payload: { controlType: "FALLBACK_HLS", reason: "Mesh capacity reached" },
            });
            return;
          }
          const ownerPeer = createOrGetPeer(senderUserId, streamData, myUserId);
          const offer = await ownerPeer.createOffer();
          await ownerPeer.setLocalDescription(offer);
          sendStreamSignal(streamId, {
            signalType: "OFFER",
            targetPeerId: senderUserId,
            payload: { type: offer.type, sdp: offer.sdp },
          });
          setWebrtcState("connecting");
          return;
        }

        if (controlType === "FALLBACK_HLS") {
          setWebrtcState("fallback");
          setWebrtcNote("Low-latency channel saturated, using HLS playback.");
        }
        return;
      }

      if (rawType === "OFFER") {
        const peer = createOrGetPeer(senderUserId, streamData, myUserId);
        const sdp = typeof payload.sdp === "string" ? payload.sdp : "";
        const type = typeof payload.type === "string" ? payload.type : "offer";
        if (!sdp) {
          return;
        }
        await peer.setRemoteDescription(new RTCSessionDescription({ type: type as RTCSdpType, sdp }));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        sendStreamSignal(streamId, {
          signalType: "ANSWER",
          targetPeerId: senderUserId,
          payload: { type: answer.type, sdp: answer.sdp },
        });
        setWebrtcState("connecting");
        return;
      }

      if (rawType === "ANSWER") {
        const ownerPeer = peerConnectionsRef.current.get(senderUserId);
        if (!ownerPeer) {
          return;
        }
        const sdp = typeof payload.sdp === "string" ? payload.sdp : "";
        const type = typeof payload.type === "string" ? payload.type : "answer";
        if (!sdp) {
          return;
        }
        await ownerPeer.setRemoteDescription(new RTCSessionDescription({ type: type as RTCSdpType, sdp }));
        setWebrtcState("connected");
        return;
      }

      if (rawType === "ICE") {
        const peer = peerConnectionsRef.current.get(senderUserId);
        const candidate = readIceCandidate(payload);
        if (!peer || !candidate) {
          return;
        }
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const load = async () => {
      try {
        const [streamData, joinData, meData] = await Promise.all([
          getStream(streamId),
          joinStream(streamId),
          me().catch(() => null),
        ]);
        if (!active) {
          return;
        }

        const myUserId = meData?.id ?? "";
        setCurrentUserId(myUserId);
        setStream(streamData);
        setJoinInfo(joinData);
        setViewerCount(streamData.viewerCount ?? 0);

        await connectWs();
        if (!active) {
          return;
        }

        chatSubscription = subscribeStreamChat(streamId, (body) => {
          setChatMessages((current) => [...current.slice(-39), body as StreamEvent]);
        });
        presenceSubscription = subscribeStreamPresence(streamId, (body) => {
          setViewerCount((current) => (typeof body.viewerCount === "number" ? body.viewerCount : current));
        });
        signalSubscription = subscribeStreamSignals(streamId, (body) => {
          void handleSignal(body as SignalEnvelope, streamData, myUserId).catch(() => {
            setWebrtcState("fallback");
            setWebrtcNote("Signal processing failed. Streaming continues on HLS.");
          });
        });

        sendStreamPresenceJoin(streamId);

        if (
          streamData.status === "LIVE" &&
          joinData.preferredProtocol === "WEBRTC" &&
          !streamData.permissions.canManage &&
          myUserId &&
          streamData.ownerUserId
        ) {
          sendStreamSignal(streamId, {
            signalType: "CONTROL",
            targetPeerId: streamData.ownerUserId,
            payload: { controlType: "REQUEST_OFFER" },
          });
          setWebrtcState("connecting");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load the stream.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
      sendStreamPresenceLeave(streamId);
      signalSubscription?.unsubscribe();
      chatSubscription?.unsubscribe();
      presenceSubscription?.unsubscribe();
      closePeerConnections();
      stopLocalMedia();
      setRemoteMedia(null);
      void leaveStreamRecord(streamId).catch(() => null);
    };
  }, [iceServers, isOwner, streamId]);

  const enableOwnerMedia = async () => {
    if (!stream || !isOwner) {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("This browser does not support live media capture.");
      return;
    }

    setLocalMediaBusy(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: supportsAudio(stream.mediaKind),
        video: supportsVideo(stream.mediaKind),
      });
      localMediaRef.current = media;
      setLocalMedia(media);
      setWebrtcState("connecting");
      setWebrtcNote("Owner media enabled. Viewers can now request low-latency WebRTC.");
    } catch {
      setWebrtcState("error");
      setWebrtcNote("Unable to access camera/microphone. Check browser permissions.");
    } finally {
      setLocalMediaBusy(false);
    }
  };

  const requestLowLatency = () => {
    if (!stream || !currentUserId || !stream.ownerUserId || isOwner) {
      return;
    }
    sendStreamSignal(streamId, {
      signalType: "CONTROL",
      targetPeerId: stream.ownerUserId,
      payload: { controlType: "REQUEST_OFFER" },
    });
    setWebrtcState("connecting");
  };

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatInput.trim()) {
      return;
    }
    sendStreamChat(streamId, { body: chatInput.trim() });
    setChatInput("");
  };

  const copyLiveLink = async () => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${watchHref}`);
      toast.success("Live link copied.");
    } catch {
      toast.error("Unable to copy live link.");
    }
  };

  if (loading) {
    return <div className="rounded-[28px] border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading live stream...</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
              <Radio className="h-3.5 w-3.5" />
              {formatStreamStatus(stream?.status)}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-gray-950">{stream?.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-500">{stream?.description || "No description yet."}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <div className="font-semibold text-gray-900">{formatViewerCount(viewerCount)} viewers</div>
            <div className="mt-1 text-xs text-gray-500">Protocol: {joinInfo?.preferredProtocol || "WEBRTC"}</div>
            <div className="mt-1 text-xs text-gray-500">Mode: {stream?.mode || "ONE_TO_MANY"} | Media: {stream?.mediaKind || "AUDIO_VIDEO"}</div>
            <div className="mt-1 text-xs text-gray-500">WebRTC: {webrtcState}</div>
          </div>
        </div>

        <div className="mt-6">
          {remoteMedia ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-[28px] border border-gray-200/80 bg-black shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      <Radio className="h-3.5 w-3.5" />
                      Low-latency live
                    </div>
                    <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      WebRTC connected
                    </div>
                  </div>
                  {stream?.mediaKind === "AUDIO" ? (
                    <div className="flex aspect-video items-center justify-center">
                      <audio ref={remoteAudioRef} autoPlay controls className="w-full max-w-2xl px-6" />
                    </div>
                  ) : (
                    <video ref={remoteVideoRef} playsInline autoPlay controls className="aspect-video w-full bg-black object-cover" />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">Connected WebRTC playback</span>
                <span>{connectedPeers} direct peer connection{connectedPeers === 1 ? "" : "s"}</span>
              </div>
            </div>
          ) : (
            <StreamVideoStage
              primarySrc={playbackSource.primaryUrl}
              posterSrc={playbackSource.posterUrl}
              headline={stream?.title || "Live stream"}
              detail={
                stream?.status === "LIVE"
                  ? "Watch the live program here with native controls, chat on the right, and low-latency WebRTC when the direct media channel is available."
                  : "Replay is available here when the creator has published stream playback."
              }
              statusLabel={stream?.status === "LIVE" ? "Live playback" : "Replay preview"}
              accentLabel={playbackSource.accent}
              autoPlay
              muted={!playbackSource.primaryUrl}
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void copyLiveLink()}
            className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy live link
          </button>
          {isOwner ? (
            <button
              type="button"
              onClick={() => void enableOwnerMedia()}
              disabled={!canUseWebRtc || localMediaBusy}
              className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 disabled:opacity-60"
            >
              {localMediaBusy ? "Enabling media..." : localMedia ? "Owner camera ready" : "Enable owner media"}
            </button>
          ) : (
            <button
              type="button"
              onClick={requestLowLatency}
              disabled={!canUseWebRtc}
              className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 disabled:opacity-60"
            >
              Retry low-latency
            </button>
          )}
        </div>

        <div className="mt-4 rounded-[24px] border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
          <div className="font-semibold text-sky-950">Low-latency session</div>
          <p className="mt-1">
            {webrtcNote || "WebRTC signaling is live through stream topics. HLS handles larger audience playback while chat and viewer activity stay interactive."}
          </p>
          <div className="mt-2 text-xs">Connected peers: {connectedPeers}</div>
        </div>

        {localMedia && isOwner ? (
          <div className="mt-4 overflow-hidden rounded-[24px] border border-gray-200 bg-black">
            <div className="border-b border-white/10 bg-black/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
              Backstage preview
            </div>
            <video ref={localVideoRef} muted playsInline autoPlay className="aspect-video w-full bg-black object-cover" />
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Visibility: <span className="font-semibold text-gray-950">{stream?.visibility}</span>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Recording: <span className="font-semibold text-gray-950">{stream?.recordingEnabled ? "On" : "Off"}</span> / Replay:{" "}
            <span className="font-semibold text-gray-950">{stream?.playbackEnabled ? "On" : "Off"}</span>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Room: <span className="font-semibold text-gray-950">{stream?.webrtcRoomId || "Pending"}</span>
          </div>
        </div>
      </section>

      <aside className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-950">
          <MessageSquare className="h-5 w-5 text-gray-700" />
          Live chat
        </div>
        <p className="mt-2 text-sm text-gray-500">Join stream conversation in real time (YouTube/TikTok style side chat).</p>

        <div className="mt-4 rounded-[24px] border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Users className="h-4 w-4" />
            {formatViewerCount(viewerCount)} active now
          </div>
        </div>

        <div className="mt-4 flex max-h-[420px] min-h-[320px] flex-col gap-3 overflow-y-auto rounded-[24px] border border-gray-200 bg-gray-50 p-4">
          {chatMessages.length === 0 ? (
            <div className="text-sm text-gray-500">No chat messages yet.</div>
          ) : (
            chatMessages.map((message, index) => (
              <div key={`${message.occurredAt ?? index}-${index}`} className="rounded-2xl bg-white px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{message.senderDisplayName || "Viewer"}</div>
                <div className="mt-1 text-sm text-gray-800">{message.body}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="mt-4 grid gap-3">
          <textarea
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            rows={3}
            placeholder="Write a message..."
            className="w-full rounded-[24px] border border-gray-200 px-4 py-3 text-sm outline-none"
          />
          <button type="submit" className="rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white">
            Send
          </button>
        </form>
      </aside>
    </div>
  );
}
