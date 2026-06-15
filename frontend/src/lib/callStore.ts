import { create } from "zustand";
import SimplePeer from "simple-peer";
import { sendCallSignal } from "./ws";

export type CallType = "audio" | "video";
export type CallStatus = "idle" | "ringing" | "active" | "ended";

export interface CallState {
  // Call info
  callId: string | null;
  callType: CallType | null;
  status: CallStatus;
  participantId: string | null;
  participantName: string | null;
  isInitiator: boolean;

  // WebRTC
  peerConnection: SimplePeer.Instance | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  // UI state
  isMuted: boolean;
  isVideoOn: boolean;
  remoteIsMuted: boolean;
  remoteIsVideoOn: boolean;
  duration: number;
  mediaError: string | null;

  // Actions
  initiateCall: (participantId: string, participantName: string, type: CallType) => Promise<void>;
  handleIncomingCall: (participantId: string, participantName: string, type: CallType, callId: string) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  handleSignal: (signal: any) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  updateRemoteStatus: (isMuted: boolean, isVideoOn: boolean) => void;
  setRemoteStream: (stream: MediaStream) => void;
  tickDuration: () => void;
  reset: () => void;
}

const useCallStore = create<CallState>((set, get) => ({
  // Initial state
  callId: null,
  callType: null,
  status: "idle",
  participantId: null,
  participantName: null,
  isInitiator: false,
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOn: true,
  remoteIsMuted: false,
  remoteIsVideoOn: true,
  duration: 0,
  mediaError: null,

  // Initiate a call
  initiateCall: async (participantId, participantName, type) => {
    try {
      if (typeof window === "undefined") return;

      const callId = `call_${Date.now()}`;
      const constraints = {
        video: type === "video",
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        }
      });

      peer.on("signal", (data) => {
        sendCallSignal({
          targetUserId: participantId,
          type: "ringing",
          callId,
          callType: type,
          fromUserName: "User", // Should ideally be from session
          signal: data
        });
      });

      peer.on("stream", (remoteStream) => {
        set({ remoteStream, status: "active" });
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        get().endCall();
      });

      set({
        callId,
        callType: type,
        status: "ringing",
        participantId,
        participantName,
        isInitiator: true,
        localStream: stream,
        peerConnection: peer,
        isVideoOn: type === "video",
        mediaError: null
      });
    } catch (error: any) {
      console.error("Failed to initiate call:", error);
      set({ mediaError: error.message || "Failed to access camera/mic" });
    }
  },

  handleIncomingCall: (participantId, participantName, type, callId) => {
    set({
      callId,
      callType: type,
      status: "ringing",
      participantId,
      participantName,
      isInitiator: false,
      mediaError: null
    });
  },

  acceptCall: async () => {
    const { callId, participantId, callType } = get();
    if (!callId || !participantId) return;

    try {
      const constraints = {
        video: callType === "video",
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        }
      });

      peer.on("signal", (data) => {
        sendCallSignal({
          targetUserId: participantId,
          type: "signal",
          callId,
          signal: data
        });
      });

      peer.on("stream", (remoteStream) => {
        set({ remoteStream, status: "active" });
      });

      // If we have a pending signal (offer), apply it now
      const { pendingSignal } = get();
      if (pendingSignal) {
        peer.signal(pendingSignal);
      }

      sendCallSignal({
        targetUserId: participantId,
        type: "accept",
        callId
      });

      set({
        status: "active",
        localStream: stream,
        peerConnection: peer,
        isVideoOn: callType === "video",
        pendingSignal: null
      });
    } catch (error: any) {
      console.error("Failed to accept call:", error);
      set({ mediaError: error.message || "Failed to access camera/mic" });
    }
  },

  handleSignal: (signal) => {
    const { peerConnection } = get();
    if (peerConnection) {
      peerConnection.signal(signal);
    }
  },

  rejectCall: () => {
    const { callId, participantId } = get();
    if (callId && participantId) {
      sendCallSignal({
        targetUserId: participantId,
        type: "reject",
        callId
      });
    }
    get().reset();
  },

  endCall: () => {
    const { callId, participantId } = get();
    if (callId && participantId) {
      sendCallSignal({
        targetUserId: participantId,
        type: "end",
        callId
      });
    }
    get().reset();
  },

  toggleMute: () => {
    const { localStream, isMuted, participantId, callId, isVideoOn } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = isMuted);
      set({ isMuted: !isMuted });
      
      if (participantId && callId) {
        sendCallSignal({
          targetUserId: participantId,
          type: "mute-status",
          callId,
          isMuted: !isMuted,
          isVideoOn
        });
      }
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOn, participantId, callId, isMuted } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOn);
      set({ isVideoOn: !isVideoOn });

      if (participantId && callId) {
        sendCallSignal({
          targetUserId: participantId,
          type: "mute-status",
          callId,
          isMuted,
          isVideoOn: !isVideoOn
        });
      }
    }
  },

  updateRemoteStatus: (remoteIsMuted, remoteIsVideoOn) => {
    set({ remoteIsMuted, remoteIsVideoOn });
  },

  setRemoteStream: (remoteStream) => {
    set({ remoteStream, status: "active" });
  },

  tickDuration: () => {
    set(state => ({ duration: state.duration + 1 }));
  },

  reset: () => {
    const { peerConnection, localStream } = get();
    if (peerConnection) peerConnection.destroy();
    if (localStream) localStream.getTracks().forEach(t => t.stop());

    set({
      callId: null,
      callType: null,
      status: "idle",
      participantId: null,
      participantName: null,
      isInitiator: false,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOn: true,
      remoteIsMuted: false,
      remoteIsVideoOn: true,
      duration: 0,
      mediaError: null
    });
  }
}));

export default useCallStore;
