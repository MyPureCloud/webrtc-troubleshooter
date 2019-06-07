declare module 'rtcpeerconnection' {
  export class PeerConnection {
    pc: RTCPeerConnection;
    constructor(config: RTCConfiguration, constraints?: MediaStreamConstraints);
    on (event: 'ice', callback: (candidate: RTCPeerConnectionIceEvent) => void ): void;
    close (): void;
  }
}

declare module 'webrtc-stats-gatherer' {
  import { PeerConnection } from "rtcpeerconnection";

  export class WebrtcStatsGather {
    constructor(args: PeerConnection);
    on (event: 'stats', callback: (candidate: any) => void): void; //TODO: type this
    collectInitialConnectionStats(): void;
    collectStats (): void;
  }
}
