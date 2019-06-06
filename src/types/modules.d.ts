declare module 'rtcpeerconnection' {
  export class PeerConnection {
    pc: RTCPeerConnection;
    constructor(config: RTCConfiguration, constraints?: MediaStreamConstraints);
    on(event: 'ice', callback: Function): void;
    close(): void;
  }
}

declare module 'webrtc-stats-gatherer' {
  import { PeerConnection } from "rtcpeerconnection";

  export class WebrtcStatsGather {
    constructor(args: PeerConnection);
    on(event: 'stats', callback: Function): void;
    collectInitialConnectionStats(): void;
    collectStats(): void;
  }
}
