declare module "simple-peer" {
  export interface SimplePeerOptions {
    initiator?: boolean;
    trickle?: boolean;
    stream?: MediaStream;
    config?: RTCConfiguration;
    channelConfig?: Record<string, unknown>;
    allowHalfTrickle?: boolean;
    objectMode?: boolean;
  }

  export interface Instance {
    on(event: "signal", callback: (data: unknown) => void): this;
    on(event: "stream", callback: (stream: MediaStream) => void): this;
    on(event: "connect", callback: () => void): this;
    on(event: "close", callback: () => void): this;
    on(event: "error", callback: (error: Error) => void): this;
    on(event: "data", callback: (data: unknown) => void): this;
    on(event: string, callback: (...args: any[]) => void): this;
    signal(data: unknown): void;
    send(data: string | ArrayBuffer | ArrayBufferView): void;
    destroy(error?: Error): void;
    readonly connected: boolean;
    readonly destroyed: boolean;
  }

  const SimplePeer: {
    new (options?: SimplePeerOptions): Instance;
    readonly WEBRTC_SUPPORT: boolean;
  };

  export default SimplePeer;
}
