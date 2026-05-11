import {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  type MediaStream,
} from "react-native-webrtc";

type SignalType = "OFFER" | "ANSWER" | "ICE" | "CONTROL";

type SignalCallback = (payload: {
  signalType: SignalType;
  targetPeerId?: string;
  payload: Record<string, unknown>;
}) => void;

export class WebRtcService {
  private peer: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private onSignal: SignalCallback | null = null;

  constructor(onSignal: SignalCallback) {
    this.onSignal = onSignal;
  }

  async startPublisher() {
    await this.ensurePeer();
    const stream = await mediaDevices.getUserMedia({ audio: true, video: true });
    this.localStream = stream;
    stream.getTracks().forEach((track) => {
      this.peer?.addTrack(track, stream);
    });
    const offer = await this.peer!.createOffer();
    await this.peer!.setLocalDescription(offer);
    this.onSignal?.({
      signalType: "OFFER",
      payload: {
        sdp: offer.sdp,
        type: offer.type,
      },
    });
    return stream;
  }

  async startViewer() {
    await this.ensurePeer();
  }

  async handleSignal(signalType: SignalType, payload: Record<string, unknown>) {
    await this.ensurePeer();
    if (!this.peer) {
      return;
    }
    if (signalType === "OFFER") {
      const offer = new RTCSessionDescription({
        type: "offer",
        sdp: String(payload.sdp ?? ""),
      });
      await this.peer.setRemoteDescription(offer);
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);
      this.onSignal?.({
        signalType: "ANSWER",
        payload: {
          sdp: answer.sdp,
          type: answer.type,
        },
      });
      return;
    }

    if (signalType === "ANSWER") {
      const answer = new RTCSessionDescription({
        type: "answer",
        sdp: String(payload.sdp ?? ""),
      });
      await this.peer.setRemoteDescription(answer);
      return;
    }

    if (signalType === "ICE") {
      await this.peer.addIceCandidate(
        new RTCIceCandidate({
          candidate: String(payload.candidate ?? ""),
          sdpMid: payload.sdpMid ? String(payload.sdpMid) : undefined,
          sdpMLineIndex: typeof payload.sdpMLineIndex === "number" ? payload.sdpMLineIndex : undefined,
        }),
      );
    }
  }

  async close() {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.peer?.close();
    this.peer = null;
  }

  private async ensurePeer() {
    if (this.peer) {
      return;
    }
    this.peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    const nativePeer = this.peer as any;
    nativePeer.onicecandidate = (event: any) => {
      if (!event.candidate) {
        return;
      }
      this.onSignal?.({
        signalType: "ICE",
        payload: {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid ?? null,
          sdpMLineIndex: event.candidate.sdpMLineIndex ?? null,
        },
      });
    };
  }
}
