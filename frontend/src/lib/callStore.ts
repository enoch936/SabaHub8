declare module "simple-peer" {
  const SimplePeer: any;
  export default SimplePeer;
}

import { create } from "zustand";
import SimplePeer from "simple-peer";

export type CallType = "audio" | "video";
export type CallStatus = "idle" | "ringing" | "active" | "ended";

export interface CallState {
  // Call info
  callId: string | null;
  callType: CallType | null;
  status: CallStatus;
  participantId: string | null;
  participantName: string | null;

  // WebRTC
  peerConnection: SimplePeer.Instance | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  // UI state
  isMuted: boolean;
  isVideoOn: boolean;
  duration: number;

  // Actions
  initiatCall: (participantId: string, participantName: string, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  setRemoteStream: (stream: MediaStream) => void;
  setDuration: (duration: number) => void;
  reset: () => void;
}

const useCallStore = create<CallState>((set, get) => ({
  // Initial state
  callId: null,
  callType: null,
  status: "idle",
  participantId: null,
  participantName: null,
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOn: true,
  duration: 0,

  // Initiate a call
  initiatCall: async (participantId, participantName, type) => {
    try {
      // Check if we're in the browser and media devices are available
      if (typeof window === "undefined") {
        throw new Error("Media API not available - browser context required");
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera/Microphone access not supported in this browser");
      }

      // Generate call ID
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get local media stream
      const constraints =
        type === "video" ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create peer connection
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: ["stun:stun.l.google.com:19302"] },
            { urls: ["stun:stun1.l.google.com:19302"] },
          ],
        },
      });

      // Handle peer events
      peer.on("error", (err) => {
        console.error("Peer connection error:", err);
        get().endCall();
      });

      peer.on("close", () => {
        get().endCall();
      });

      set({
        callId,
        callType: type,
        status: "ringing",
        participantId,
        participantName,
        peerConnection: peer,
        localStream: stream,
        isVideoOn: type === "video",
      });
    } catch (error) {
      console.error("Failed to initiate call:", error);
      set({ status: "idle" });
    }
  },

  // Accept a call
  acceptCall: async () => {
    const state = get();
    if (state.status !== "ringing") return;

    try {
      // Check if we're in the browser and media devices are available
      if (typeof window === "undefined") {
        throw new Error("Media API not available - browser context required");
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera/Microphone access not supported in this browser");
      }

      const constraints =
        state.callType === "video" ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Update local stream
      if (state.peerConnection) {
        stream.getTracks().forEach((track) => {
          state.peerConnection!.addTrack(track, stream);
        });
      }

      set({
        status: "active",
        localStream: stream,
      });
    } catch (error) {
      console.error("Failed to accept call:", error);
      get().rejectCall();
    }
  },

  // Reject/decline call
  rejectCall: () => {
    const state = get();
    if (state.peerConnection) {
      state.peerConnection.destroy();
    }
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
    }
    set({
      callId: null,
      callType: null,
      status: "idle",
      participantId: null,
      participantName: null,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      duration: 0,
    });
  },

  // End call
  endCall: () => {
    const state = get();
    if (state.peerConnection) {
      state.peerConnection.destroy();
    }
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
    }
    set({
      callId: null,
      callType: null,
      status: "ended",
      participantId: null,
      participantName: null,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      duration: 0,
    });
  },

  // Toggle mute
  toggleMute: () => {
    const state = get();
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    set({ isMuted: !state.isMuted });
  },

  // Toggle video
  toggleVideo: () => {
    const state = get();
    if (state.localStream && state.callType === "video") {
      state.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    set({ isVideoOn: !state.isVideoOn });
  },

  // Set remote stream
  setRemoteStream: (stream: MediaStream) => {
    set({ remoteStream: stream, status: "active" });
  },

  // Set call duration
  setDuration: (duration: number) => {
    set({ duration });
  },

  // Reset store
  reset: () => {
    const state = get();
    if (state.peerConnection) {
      state.peerConnection.destroy();
    }
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
    }
    set({
      callId: null,
      callType: null,
      status: "idle",
      participantId: null,
      participantName: null,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOn: true,
      duration: 0,
    });
  },
}));

export default useCallStore;
