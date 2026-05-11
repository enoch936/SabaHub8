import {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  type MediaStream,
} from "react-native-webrtc";

type SignalType = "OFFER" | "ANSWER" | "ICE" | "CONTROL";

type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

type IceCandidatePayload = {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
};

export type RemotePeerStream = {
  peerId: string;
  stream: MediaStream;
};

type PeerState = {
  connection: RTCPeerConnection;
  remoteStream: MediaStream | null;
  localTracksAttached: boolean;
  remoteDescriptionSet: boolean;
  pendingIceCandidates: IceCandidatePayload[];
};

function readIceCandidate(payload: Record<string, unknown>): IceCandidatePayload | null {
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
  };
}

export class RealtimeCallSession {
  private readonly selfUserId: string;
  private readonly includeVideo: boolean;
  private readonly interactive: boolean;
  private readonly isBroadcaster: boolean;
  private readonly iceServers: IceServer[];
  private readonly onSignal: (payload: {
    signalType: SignalType;
    targetPeerId?: string;
    payload: Record<string, unknown>;
  }) => void;
  private readonly onLocalStream: (stream: MediaStream | null) => void;
  private readonly onRemoteStreamsChanged: (streams: RemotePeerStream[]) => void;
  private readonly onControl: (payload: Record<string, unknown>, senderUserId: string) => void;

  private localStream: MediaStream | null = null;
  private readonly peers = new Map<string, PeerState>();

  constructor(input: {
    selfUserId: string;
    includeVideo: boolean;
    interactive: boolean;
    isBroadcaster: boolean;
    iceServers?: IceServer[];
    onSignal: (payload: { signalType: SignalType; targetPeerId?: string; payload: Record<string, unknown> }) => void;
    onLocalStream?: (stream: MediaStream | null) => void;
    onRemoteStreamsChanged?: (streams: RemotePeerStream[]) => void;
    onControl?: (payload: Record<string, unknown>, senderUserId: string) => void;
  }) {
    this.selfUserId = input.selfUserId;
    this.includeVideo = input.includeVideo;
    this.interactive = input.interactive;
    this.isBroadcaster = input.isBroadcaster;
    this.iceServers = input.iceServers?.length ? input.iceServers : [{ urls: "stun:stun.l.google.com:19302" }];
    this.onSignal = input.onSignal;
    this.onLocalStream = input.onLocalStream ?? (() => undefined);
    this.onRemoteStreamsChanged = input.onRemoteStreamsChanged ?? (() => undefined);
    this.onControl = input.onControl ?? (() => undefined);
  }

  shouldPublishLocalMedia() {
    return this.interactive || this.isBroadcaster;
  }

  async ensureLocalMedia() {
    if (this.localStream) {
      return this.localStream;
    }
    if (!this.shouldPublishLocalMedia()) {
      return null;
    }
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: this.includeVideo,
    });
    this.localStream = stream;
    this.onLocalStream(stream);
    return stream;
  }

  async connectToPeer(peerId: string) {
    if (!peerId || peerId === this.selfUserId) {
      return;
    }
    const peer = await this.ensurePeer(peerId);
    await this.attachLocalTracks(peer);

    const offer = await peer.connection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: this.includeVideo,
    });
    await peer.connection.setLocalDescription(offer);

    this.onSignal({
      signalType: "OFFER",
      targetPeerId: peerId,
      payload: {
        sdp: offer.sdp,
        type: offer.type,
      },
    });
  }

  async handleSignal(input: {
    signalType: SignalType;
    senderUserId: string;
    targetPeerId?: string | null;
    payload: Record<string, unknown>;
  }) {
    const { payload, senderUserId, signalType, targetPeerId } = input;
    if (!senderUserId || senderUserId === this.selfUserId) {
      return;
    }
    if (targetPeerId && targetPeerId !== this.selfUserId && targetPeerId !== "*" && targetPeerId.toUpperCase() !== "ALL") {
      return;
    }
    if (signalType === "CONTROL") {
      this.onControl(payload, senderUserId);
      return;
    }

    const peer = await this.ensurePeer(senderUserId);

    if (signalType === "OFFER") {
      await this.attachLocalTracks(peer);
      await peer.connection.setRemoteDescription(
        new RTCSessionDescription({
          type: "offer",
          sdp: String(payload.sdp ?? ""),
        }),
      );
      peer.remoteDescriptionSet = true;
      await this.flushPendingIceCandidates(peer);

      const answer = await peer.connection.createAnswer();
      await peer.connection.setLocalDescription(answer);
      this.onSignal({
        signalType: "ANSWER",
        targetPeerId: senderUserId,
        payload: {
          sdp: answer.sdp,
          type: answer.type,
        },
      });
      return;
    }

    if (signalType === "ANSWER") {
      await peer.connection.setRemoteDescription(
        new RTCSessionDescription({
          type: "answer",
          sdp: String(payload.sdp ?? ""),
        }),
      );
      peer.remoteDescriptionSet = true;
      await this.flushPendingIceCandidates(peer);
      return;
    }

    if (signalType === "ICE") {
      const candidate = readIceCandidate(payload);
      if (!candidate) {
        return;
      }
      if (!peer.remoteDescriptionSet) {
        peer.pendingIceCandidates.push(candidate);
        return;
      }
      await peer.connection.addIceCandidate(
        new RTCIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid ?? undefined,
          sdpMLineIndex: candidate.sdpMLineIndex ?? undefined,
        }),
      );
    }
  }

  setMicrophoneEnabled(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  setCameraEnabled(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  sendControl(targetPeerId: string | undefined, payload: Record<string, unknown>) {
    this.onSignal({
      signalType: "CONTROL",
      targetPeerId,
      payload,
    });
  }

  removePeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      return;
    }
    peer.connection.close();
    this.peers.delete(peerId);
    this.publishRemoteStreams();
  }

  async close() {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.onLocalStream(null);

    this.peers.forEach((peer) => {
      peer.connection.close();
    });
    this.peers.clear();
    this.publishRemoteStreams();
  }

  private async ensurePeer(peerId: string) {
    const existing = this.peers.get(peerId);
    if (existing) {
      return existing;
    }

    const connection = new RTCPeerConnection({
      iceServers: this.iceServers,
    });
    const nativeConnection = connection as any;

    const peer: PeerState = {
      connection,
      remoteStream: null,
      localTracksAttached: false,
      remoteDescriptionSet: false,
      pendingIceCandidates: [],
    };

    nativeConnection.onicecandidate = (event: any) => {
      if (!event.candidate) {
        return;
      }
      this.onSignal({
        signalType: "ICE",
        targetPeerId: peerId,
        payload: {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid ?? null,
          sdpMLineIndex: event.candidate.sdpMLineIndex ?? null,
        },
      });
    };

    nativeConnection.ontrack = (event: any) => {
      const stream = event.streams[0];
      if (!stream) {
        return;
      }
      peer.remoteStream = stream;
      this.publishRemoteStreams();
    };

    nativeConnection.onconnectionstatechange = () => {
      const state = nativeConnection.connectionState;
      if (state === "closed" || state === "disconnected" || state === "failed") {
        this.removePeer(peerId);
      }
    };

    this.peers.set(peerId, peer);
    if (this.localStream) {
      await this.attachLocalTracks(peer);
    }
    return peer;
  }

  private async attachLocalTracks(peer: PeerState) {
    if (peer.localTracksAttached) {
      return;
    }
    const stream = await this.ensureLocalMedia();
    if (!stream) {
      return;
    }
    stream.getTracks().forEach((track) => {
      peer.connection.addTrack(track, stream);
    });
    peer.localTracksAttached = true;
  }

  private async flushPendingIceCandidates(peer: PeerState) {
    const pending = [...peer.pendingIceCandidates];
    peer.pendingIceCandidates = [];
    for (const candidate of pending) {
      await peer.connection.addIceCandidate(
        new RTCIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid ?? undefined,
          sdpMLineIndex: candidate.sdpMLineIndex ?? undefined,
        }),
      );
    }
  }

  private publishRemoteStreams() {
    const streams: RemotePeerStream[] = [];
    this.peers.forEach((peer, peerId) => {
      if (peer.remoteStream) {
        streams.push({ peerId, stream: peer.remoteStream });
      }
    });
    this.onRemoteStreamsChanged(streams);
  }
}
