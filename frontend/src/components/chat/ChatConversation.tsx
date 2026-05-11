"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Info, Maximize2, Mic, MicOff, Minimize2, Phone, PhoneOff, Pin, Radio, Search, Video, VideoOff } from "lucide-react";
import type { Asset, ChatMessage } from "@/lib/api";
import { connectWs, sendThreadTyping, subscribeThreadTyping, type Subscription } from "@/lib/ws";
import {
  buildTypingLabel,
  formatAssetLabel,
  formatDayLabel,
  isSameCalendarDay,
} from "./chat-helpers";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { ChatSearchInput, chatUi } from "./chat-ui";

interface ChatConversationProps {
  conversationId: string;
  title: string;
  subtitle: string;
  headerMeta?: string;
  typingUsers?: string[];
  currentUserId: string | null;
  messages: ChatMessage[];
  assetsById?: Record<string, Asset | null>;
  isLoading?: boolean;
  inputDisabled?: boolean;
  readOnlyNote?: string | null;
  pinnedMessageId?: string | null;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  liveCount?: number;
  unreadCountAtOpen?: number;
  threadType?: "DIRECT" | "GROUP" | "CHANNEL";
  participantIds?: string[];
  onSend: (content: string, options?: { replyToMessageId?: string | null }) => void;
  onSendAsset?: (assetId: string) => void;
  onEditMessage?: (messageId: string, text: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onForwardMessage?: (messageId: string) => void;
  onPinMessage?: (messageId: string) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onTyping?: () => void;
  getDisplayName?: (userId?: string | null) => string;
  onMissedCall?: (conversationId: string) => void;
  onBack?: () => void;
  onOpenDetails?: () => void;
}

type CallMode = "audio" | "video";
type CallState = "idle" | "calling" | "ringing" | "in-call";
type SignalType = "CALL_INVITE" | "CALL_READY" | "CALL_OFFER" | "CALL_ANSWER" | "CALL_ICE" | "CALL_REJECT" | "CALL_HANGUP";

type ThreadSignalPayload = {
  signalType: SignalType;
  fromUserId?: string;
  targetUserId?: string;
  mode?: CallMode;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  callSessionId?: string;
  roomId?: string;
  participants?: string[];
};

const conversationCanvasStyle = {
  backgroundColor: "#f1f5f9",
  backgroundImage: [
    "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.6) 0, rgba(255,255,255,0) 24%)",
    "radial-gradient(circle at 82% 12%, rgba(226,232,240,0.5) 0, rgba(226,232,240,0) 20%)",
    "radial-gradient(circle at 12% 86%, rgba(203,213,225,0.35) 0, rgba(203,213,225,0) 24%)",
    "linear-gradient(180deg, rgba(248,250,252,0.8), rgba(241,245,249,0.95))",
  ].join(", "),
};

function messageMatchesQuery(
  message: ChatMessage,
  assetsById: Record<string, Asset | null>,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const asset = message.assetId ? assetsById[message.assetId] : null;
  const haystack = [
    message.text,
    message.type,
    formatAssetLabel(asset, message.assetId),
    asset?.mimeType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function MessageSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <div
        className={`h-24 w-full max-w-[320px] rounded-[28px] border border-white/70 ${
          align === "right" ? "bg-slate-200" : "bg-white"
        } shadow-sm`}
      />
    </div>
  );
}

function HeaderActionButton({
  label,
  onClick,
  icon,
  active = false,
}: {
  label: string;
  onClick?: () => void;
  icon: ReactNode;
  active?: boolean;
}) {
  if (!onClick) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
        active
          ? "border-slate-300 bg-slate-100 text-slate-900"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

export function ChatConversation({
  conversationId,
  title,
  subtitle,
  headerMeta,
  typingUsers = [],
  currentUserId,
  messages,
  assetsById = {},
  isLoading = false,
  inputDisabled = false,
  readOnlyNote = null,
  pinnedMessageId = null,
  isPinned = false,
  isMuted = false,
  isArchived = false,
  liveCount = 0,
  unreadCountAtOpen = 0,
  threadType = "DIRECT",
  participantIds = [],
  onSend,
  onSendAsset,
  onEditMessage,
  onDeleteMessage,
  onForwardMessage,
  onPinMessage,
  onReactMessage,
  onTyping,
  getDisplayName,
  onMissedCall,
  onBack,
  onOpenDetails,
}: ChatConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [draftText, setDraftText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [callMode, setCallMode] = useState<CallMode>("audio");
  const [callStatus, setCallStatus] = useState<string>("");
  const [incomingInvite, setIncomingInvite] = useState<{ fromUserId: string; mode: CallMode; callSessionId: string; roomId?: string } | null>(null);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [callMinimized, setCallMinimized] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const signalSubscriptionRef = useRef<Subscription | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteDescriptionSetRef = useRef<Map<string, boolean>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const ringingIntervalRef = useRef<number | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callSessionRef = useRef<string | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const hasSearchQuery = deferredSearchQuery.trim().length > 0;
  const remotePeerIds = useMemo(
    () => participantIds.filter((participantId) => participantId !== currentUserId),
    [currentUserId, participantIds],
  );
  const remotePeerId = remotePeerIds[0] ?? null;
  const canCall = (threadType === "DIRECT" || threadType === "GROUP") && Boolean(currentUserId && remotePeerIds.length > 0);

  useEffect(() => {
    if (hasSearchQuery) {
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [hasSearchQuery, messages, typingUsers]);

  const pinnedMessage = useMemo(
    () => (pinnedMessageId ? messages.find((message) => message.id === pinnedMessageId) : null),
    [messages, pinnedMessageId],
  );
  const replyTarget = useMemo(
    () => (replyToId ? messages.find((message) => message.id === replyToId) : null),
    [messages, replyToId],
  );
  const visibleMessages = useMemo(
    () =>
      messages.filter((message) =>
        messageMatchesQuery(message, assetsById, deferredSearchQuery),
      ),
    [assetsById, deferredSearchQuery, messages],
  );
  const unreadDividerIndex = useMemo(() => {
    if (hasSearchQuery || unreadCountAtOpen <= 0) {
      return -1;
    }
    const clamped = Math.min(unreadCountAtOpen, visibleMessages.length);
    if (clamped <= 0) {
      return -1;
    }
    return visibleMessages.length - clamped;
  }, [hasSearchQuery, unreadCountAtOpen, visibleMessages.length]);

  const typingLabel = buildTypingLabel(typingUsers);
  const contextLabel = editingMessageId
    ? "Editing message"
    : replyTarget
      ? `Replying to: ${replyTarget.text || "attachment"}`
      : null;
  const secondaryStatus = typingLabel || headerMeta || subtitle;

  const handleSend = (content: string) => {
    if (editingMessageId && onEditMessage) {
      onEditMessage(editingMessageId, content);
      setEditingMessageId(null);
      setReplyToId(null);
      setDraftText("");
      return;
    }

    onSend(content, { replyToMessageId: replyToId });
    setReplyToId(null);
    setDraftText("");
  };

  const makeSessionId = () => `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const playRingingTone = () => {
    if (typeof window === "undefined" || ringingIntervalRef.current != null) {
      return;
    }
    const ring = () => {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 660;
        gain.gain.value = 0.03;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        window.setTimeout(() => {
          osc.stop();
          void ctx.close();
        }, 180);
      } catch {
        // Ignore tone errors.
      }
    };
    ring();
    ringingIntervalRef.current = window.setInterval(ring, 1800);
  };

  const stopRingingTone = () => {
    if (ringingIntervalRef.current != null) {
      window.clearInterval(ringingIntervalRef.current);
      ringingIntervalRef.current = null;
    }
  };

  const flushPendingCandidates = async (peerUserId: string) => {
    const peer = peersRef.current.get(peerUserId);
    if (!peer || !remoteDescriptionSetRef.current.get(peerUserId)) {
      return;
    }
    const pending = [...(pendingCandidatesRef.current.get(peerUserId) ?? [])];
    pendingCandidatesRef.current.set(peerUserId, []);
    for (const candidate of pending) {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const sendSignal = (payload: ThreadSignalPayload) => {
    sendThreadTyping(conversationId, {
      typing: false,
      kind: "WEBRTC_SIGNAL",
      ...payload,
    });
  };

  const clearCallState = (nextStatus = "") => {
    stopRingingTone();
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    remoteDescriptionSetRef.current.clear();
    pendingCandidatesRef.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingInvite(null);
    setCallSessionId(null);
    setCallMinimized(false);
    setCallState("idle");
    setCallStatus(nextStatus);
  };

  const createOrGetPeerConnection = (peerUserId: string) => {
    const existing = peersRef.current.get(peerUserId);
    if (existing) {
      return existing;
    }
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peer.onicecandidate = (event) => {
      if (!event.candidate || !currentUserId || !peerUserId) {
        return;
      }
      sendSignal({
        signalType: "CALL_ICE",
        fromUserId: currentUserId,
        targetUserId: peerUserId,
        callSessionId: callSessionId ?? undefined,
        candidate: typeof event.candidate.toJSON === "function" ? event.candidate.toJSON() : {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        },
      });
    };
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        stopRingingTone();
        setCallState("in-call");
        setCallStatus("Connected");
      } else if (peer.connectionState === "disconnected" || peer.connectionState === "failed" || peer.connectionState === "closed") {
        peersRef.current.delete(peerUserId);
        remoteDescriptionSetRef.current.delete(peerUserId);
        if (peersRef.current.size === 0) {
          clearCallState("Call ended");
        }
      }
    };
    peersRef.current.set(peerUserId, peer);
    remoteDescriptionSetRef.current.set(peerUserId, false);
    pendingCandidatesRef.current.set(peerUserId, []);
    return peer;
  };

  const ensureSignalSubscription = async () => {
    if (signalSubscriptionRef.current) {
      return;
    }
    await connectWs();
    signalSubscriptionRef.current = subscribeThreadTyping(conversationId, (body) => {
      if (body.kind !== "WEBRTC_SIGNAL") {
        return;
      }
      const fromUserId = typeof body.fromUserId === "string" ? body.fromUserId : "";
      const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId : "";
      const signalType = typeof body.signalType === "string" ? body.signalType : "";
      const incomingSessionId = typeof body.callSessionId === "string" ? body.callSessionId : "";
      const incomingRoomId = typeof body.roomId === "string" ? body.roomId : undefined;
      if (!fromUserId || !signalType || fromUserId === currentUserId) {
        return;
      }
      if (targetUserId && currentUserId && targetUserId !== currentUserId) {
        return;
      }

      if (signalType === "CALL_REJECT") {
        stopRingingTone();
        clearCallState("Call declined");
        return;
      }
      if (signalType === "CALL_HANGUP") {
        if (callState === "ringing") {
          onMissedCall?.(conversationId);
        }
        clearCallState("Call ended");
        return;
      }
      if (signalType === "CALL_INVITE") {
        const mode = body.mode === "video" ? "video" : "audio";
        const session = incomingSessionId || makeSessionId();
        setIncomingInvite({ fromUserId, mode, callSessionId: session, roomId: incomingRoomId });
        setCallMode(mode);
        setCallSessionId(session);
        setCallState("ringing");
        setCallStatus(`${getDisplayName?.(fromUserId) ?? "Caller"} is calling...`);
        playRingingTone();
        window.setTimeout(() => {
          setIncomingInvite((current) => {
            if (!current || current.callSessionId !== session) {
              return current;
            }
            onMissedCall?.(conversationId);
            stopRingingTone();
            setCallState("idle");
            setCallStatus("Missed call");
            return null;
          });
        }, 30000);
        return;
      }
      if (signalType === "CALL_READY") {
        const activeLocalStream = localStreamRef.current;
        if (!currentUserId || !activeLocalStream) {
          return;
        }
        const peer = createOrGetPeerConnection(fromUserId);
        activeLocalStream.getTracks().forEach((track) => peer.addTrack(track, activeLocalStream));
        void peer.createOffer()
          .then(async (offer) => {
            await peer.setLocalDescription(offer);
            sendSignal({
              signalType: "CALL_OFFER",
              fromUserId: currentUserId,
              targetUserId: fromUserId,
              mode: callMode,
              callSessionId: callSessionRef.current ?? (incomingSessionId || undefined),
              roomId: incomingRoomId,
              sdp: offer.sdp || "",
            });
          })
          .catch(() => clearCallState("Call setup failed"));
        return;
      }
      if (signalType === "CALL_OFFER") {
        const sdp = typeof body.sdp === "string" ? body.sdp : "";
        if (!sdp) {
          return;
        }
        const peer = createOrGetPeerConnection(fromUserId);
        void peer.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }))
          .then(async () => {
            remoteDescriptionSetRef.current.set(fromUserId, true);
            await flushPendingCandidates(fromUserId);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            sendSignal({
              signalType: "CALL_ANSWER",
              fromUserId: currentUserId ?? undefined,
              targetUserId: fromUserId,
              callSessionId: incomingSessionId || callSessionId || undefined,
              roomId: incomingRoomId,
              sdp: answer.sdp || "",
            });
            stopRingingTone();
            setIncomingInvite(null);
            setCallState("in-call");
            setCallStatus("Connected");
          })
          .catch(() => clearCallState("Call failed"));
        return;
      }
      if (signalType === "CALL_ANSWER") {
        const sdp = typeof body.sdp === "string" ? body.sdp : "";
        const peer = peersRef.current.get(fromUserId);
        if (!sdp || !peer) {
          return;
        }
        void peer.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }))
          .then(async () => {
            remoteDescriptionSetRef.current.set(fromUserId, true);
            await flushPendingCandidates(fromUserId);
            setCallState("in-call");
            setCallStatus("Connected");
          })
          .catch(() => clearCallState("Call failed"));
        return;
      }
      if (signalType === "CALL_ICE") {
        const candidate = body.candidate as RTCIceCandidateInit | undefined;
        const peer = peersRef.current.get(fromUserId);
        if (!candidate || !peer) {
          return;
        }
        if (!remoteDescriptionSetRef.current.get(fromUserId)) {
          const current = pendingCandidatesRef.current.get(fromUserId) ?? [];
          pendingCandidatesRef.current.set(fromUserId, [...current, candidate]);
          return;
        }
        void peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => null);
      }
    });
  };

  const startCall = async (mode: CallMode) => {
    if (!canCall || !currentUserId || remotePeerIds.length === 0) {
      return;
    }
    try {
      await ensureSignalSubscription();
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video",
      });
      setLocalStream(media);
      localStreamRef.current = media;
      setCallMode(mode);
      setCallState("calling");
      setCallMinimized(false);
      setCallStatus("Calling...");
      const session = makeSessionId();
      setCallSessionId(session);
      callSessionRef.current = session;
      sendSignal({
        signalType: "CALL_INVITE",
        fromUserId: currentUserId,
        targetUserId: "ALL",
        mode,
        callSessionId: session,
        roomId: `thread-${conversationId}`,
        participants: remotePeerIds,
      });
      if (threadType === "DIRECT" && remotePeerId) {
        const peer = createOrGetPeerConnection(remotePeerId);
        media.getTracks().forEach((track) => peer.addTrack(track, media));
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        sendSignal({
          signalType: "CALL_OFFER",
          fromUserId: currentUserId,
          targetUserId: remotePeerId,
          mode,
          callSessionId: session,
          roomId: `thread-${conversationId}`,
          sdp: offer.sdp || "",
        });
      }
    } catch {
      clearCallState("Unable to start call. Check camera/microphone permission.");
    }
  };

  const acceptCall = async () => {
    if (!incomingInvite || !currentUserId) {
      return;
    }
    try {
      await ensureSignalSubscription();
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingInvite.mode === "video",
      });
      setLocalStream(media);
      localStreamRef.current = media;
      setCallMode(incomingInvite.mode);
      setCallSessionId(incomingInvite.callSessionId);
      callSessionRef.current = incomingInvite.callSessionId;
      stopRingingTone();
      sendSignal({
        signalType: "CALL_READY",
        fromUserId: currentUserId,
        targetUserId: incomingInvite.fromUserId,
        callSessionId: incomingInvite.callSessionId,
        roomId: incomingInvite.roomId,
      });
      setCallState("calling");
      setCallStatus("Joining call...");
      setIncomingInvite(null);
    } catch {
      clearCallState("Unable to answer call.");
    }
  };

  const rejectCall = () => {
    if (!incomingInvite || !currentUserId) {
      return;
    }
    sendSignal({
      signalType: "CALL_REJECT",
      fromUserId: currentUserId,
      targetUserId: incomingInvite.fromUserId,
      callSessionId: incomingInvite.callSessionId,
    });
    stopRingingTone();
    onMissedCall?.(conversationId);
    setIncomingInvite(null);
    setCallState("idle");
    setCallStatus("Missed call");
  };

  const endCall = () => {
    if (currentUserId) {
      sendSignal({
        signalType: "CALL_HANGUP",
        fromUserId: currentUserId,
        targetUserId: "ALL",
        callSessionId: callSessionId ?? undefined,
      });
    }
    clearCallState("Call ended");
  };

  const toggleMicrophone = () => {
    if (!localStream) {
      return;
    }
    const next = !micEnabled;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicEnabled(next);
  };

  const toggleCamera = () => {
    if (!localStream) {
      return;
    }
    const next = !cameraEnabled;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCameraEnabled(next);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 0);
      }
      if (event.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    setDraftText("");
    setReplyToId(null);
    setEditingMessageId(null);
    setSearchOpen(false);
    setSearchQuery("");
    signalSubscriptionRef.current?.unsubscribe();
    signalSubscriptionRef.current = null;
    clearCallState("");
  }, [conversationId]);

  useEffect(() => {
    if (!canCall) {
      signalSubscriptionRef.current?.unsubscribe();
      signalSubscriptionRef.current = null;
      return;
    }
    void ensureSignalSubscription();
    return () => {
      signalSubscriptionRef.current?.unsubscribe();
      signalSubscriptionRef.current = null;
    };
  }, [canCall, conversationId]);

  useEffect(() => {
    localStreamRef.current = localStream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    callSessionRef.current = callSessionId;
  }, [callSessionId]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div
      data-thread-id={conversationId}
      className="flex h-full min-h-0 flex-col bg-slate-50"
    >
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
            ) : null}

            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-base font-semibold text-white shadow-sm">
              {title.charAt(0).toUpperCase() || "C"}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-[family:var(--font-display)] text-xl font-semibold text-slate-900">
                  {title}
                </h2>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {subtitle}
                </span>
                {isPinned ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                    Pinned
                  </span>
                ) : null}
                {isMuted ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                    Muted
                  </span>
                ) : null}
                {isArchived ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                    Archived
                  </span>
                ) : null}
                {liveCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cce7d5] bg-[#effaf2] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#287047]">
                    <span className="h-2 w-2 rounded-full bg-[#2fbe62] shadow-[0_0_0_3px_rgba(47,190,98,0.16)]" />
                    Live {liveCount}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                {liveCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <Radio className="h-4 w-4" />
                    Live view active
                  </span>
                ) : null}
                <span>{secondaryStatus}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCall ? (
              <>
                <HeaderActionButton
                  label="Start audio call"
                  onClick={() => void startCall("audio")}
                  icon={<Phone className="h-4.5 w-4.5" />}
                  active={callState !== "idle" && callMode === "audio"}
                />
                <HeaderActionButton
                  label="Start video call"
                  onClick={() => void startCall("video")}
                  icon={<Video className="h-4.5 w-4.5" />}
                  active={callState !== "idle" && callMode === "video"}
                />
              </>
            ) : null}
            <HeaderActionButton
              label={searchOpen ? "Hide in-thread search" : "Search this conversation"}
              onClick={() => {
                setSearchOpen((current) => {
                  const next = !current;
                  if (!next) {
                    setSearchQuery("");
                  }
                  return next;
                });
              }}
              icon={<Search className="h-4.5 w-4.5" />}
              active={searchOpen}
            />
            <HeaderActionButton
              label="Open conversation details"
              onClick={onOpenDetails}
              icon={<Info className="h-4.5 w-4.5" />}
            />
          </div>
        </div>

        {searchOpen ? (
          <ChatSearchInput className="mt-4 rounded-xl px-4 py-3">
            <Search className="h-4.5 w-4.5 text-slate-500" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search messages and attachments in this conversation"
              className={chatUi.input}
            />
            {hasSearchQuery ? (
              <span className={chatUi.subtlePill}>
                {visibleMessages.length} match{visibleMessages.length === 1 ? "" : "es"}
              </span>
            ) : null}
          </ChatSearchInput>
        ) : null}

        {readOnlyNote ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {readOnlyNote}
          </div>
        ) : null}

        {pinnedMessage ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
            <div className="mt-0.5 rounded-xl bg-white p-2 text-slate-700 shadow-sm">
              <Pin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pinned message</p>
              <p className="mt-2 line-clamp-2">
                {pinnedMessage.type === "ASSET" ? "Pinned attachment" : pinnedMessage.text || "Pinned message"}
              </p>
            </div>
          </div>
        ) : null}

      </div>

      {canCall && callState !== "idle" ? (
        <div className="fixed bottom-5 right-5 z-50 w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{callMode === "video" ? "Video call" : "Audio call"}</p>
              <p className="text-xs text-slate-500">{callStatus || "In progress"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCallMinimized((current) => !current)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700"
                aria-label={callMinimized ? "Expand call widget" : "Minimize call widget"}
              >
                {callMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={endCall}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white"
                aria-label="End call"
              >
                <PhoneOff className="h-4 w-4" />
              </button>
            </div>
          </div>

          {incomingInvite ? (
            <div className="mt-3 flex items-center gap-2">
              <button type="button" onClick={() => void acceptCall()} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                Accept
              </button>
              <button type="button" onClick={rejectCall} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                Decline
              </button>
            </div>
          ) : null}

          {!callMinimized ? (
            <>
              <div className="mt-3 grid gap-2">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
                  {callMode === "video" ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="aspect-video w-full object-cover" />
                  ) : (
                    <audio ref={remoteAudioRef} autoPlay controls className="w-full" />
                  )}
                </div>
                {callMode === "video" ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
                    <video ref={localVideoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {micEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                  {micEnabled ? "Mute mic" : "Unmute mic"}
                </button>
                {callMode === "video" ? (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {cameraEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                    {cameraEnabled ? "Turn camera off" : "Turn camera on"}
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-3 py-3 sm:px-4 lg:px-6" style={conversationCanvasStyle}>
        {isLoading && messages.length === 0 ? (
          <div className="mx-auto max-w-4xl space-y-4">
            <MessageSkeleton />
            <MessageSkeleton align="right" />
            <MessageSkeleton />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
              <Info className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No messages yet</h3>
            <p className="mt-2 max-w-[340px] text-sm text-slate-500">
              Start the conversation with a message, file, image, video, or voice note.
            </p>
          </div>
        ) : hasSearchQuery && visibleMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No search matches</h3>
            <p className="mt-2 max-w-[340px] text-sm text-slate-500">
              Try another keyword. Search looks through message text and shared attachment names.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            {hasSearchQuery ? (
              <div className="flex justify-center">
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                  Showing {visibleMessages.length} result{visibleMessages.length === 1 ? "" : "s"} from {messages.length} messages
                </span>
              </div>
            ) : null}

            {visibleMessages.map((message, index) => {
              const previous = index > 0 ? visibleMessages[index - 1] : null;
              const showDate = !previous || !isSameCalendarDay(previous.createdAt, message.createdAt);
              const previousTime = previous?.createdAt ? Date.parse(previous.createdAt) : 0;
              const currentTime = message.createdAt ? Date.parse(message.createdAt) : 0;
              const showSender =
                !previous
                || previous.senderId !== message.senderId
                || Math.abs(currentTime - previousTime) > 5 * 60_000;

              return (
                <div key={message.id} className="space-y-3">
                  {unreadDividerIndex === index ? (
                    <div className="flex justify-center">
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-700 shadow-sm">
                        New messages
                      </span>
                    </div>
                  ) : null}
                  {showDate ? (
                    <div className="flex justify-center">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm">
                        {formatDayLabel(message.createdAt)}
                      </span>
                    </div>
                  ) : null}

                  <MessageBubble
                    message={message}
                    asset={message.assetId ? assetsById[message.assetId] : null}
                    isMe={Boolean(currentUserId && message.senderId === currentUserId)}
                    currentUserId={currentUserId}
                    senderLabel={getDisplayName?.(message.senderId)}
                    showSender={showSender}
                    replyPreview={
                      message.replyToMessageId
                        ? messages.find((item) => item.id === message.replyToMessageId)?.text || "Reply"
                        : null
                    }
                    highlightQuery={hasSearchQuery ? deferredSearchQuery : null}
                    onReply={(target) => {
                      setReplyToId(target.id);
                      setEditingMessageId(null);
                    }}
                    onEdit={
                      onEditMessage
                        ? (target) => {
                            setEditingMessageId(target.id);
                            setReplyToId(null);
                            setDraftText(target.text || "");
                          }
                        : undefined
                    }
                    onDelete={onDeleteMessage ? (target) => onDeleteMessage(target.id) : undefined}
                    onForward={onForwardMessage ? (target) => onForwardMessage(target.id) : undefined}
                    onPin={onPinMessage ? (target) => onPinMessage(target.id) : undefined}
                    onReact={onReactMessage ? (target, emoji) => onReactMessage(target.id, emoji) : undefined}
                  />
                </div>
              );
            })}

            {typingUsers.length > 0 && !hasSearchQuery ? (
              <div className="flex justify-start">
                <TypingIndicator label={typingLabel || "Typing…"} />
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white">
        <MessageInput
          onSend={handleSend}
          onSendAsset={onSendAsset}
          onTyping={onTyping}
          disabled={inputDisabled}
          draftText={draftText}
          onDraftChange={setDraftText}
          contextLabel={contextLabel}
          onClearContext={() => {
            setReplyToId(null);
            setEditingMessageId(null);
            setDraftText("");
          }}
        />
      </div>
    </div>
  );
}
