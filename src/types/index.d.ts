declare module 'rtcpeerconnection' {
  export default class PeerConnection {
    pc: RTCPeerConnection;
    constructor(config: RTCConfiguration, constraints?: MediaStreamConstraints);
    on (event: 'ice', callback: (candidate: RTCPeerConnectionIceEvent) => void ): void;
    close (): void;
    getSenders (): RTCRtpSender[];
    getTransceivers (): RTCRtpTransceiver[];
  }
}

declare module 'webrtc-stats-gatherer' {
  import PeerConnection from "rtcpeerconnection";

  export default class WebrtcStatsGather {
    constructor(args: PeerConnection);
    on (event: 'stats', callback: (candidate: any) => void): void; //TODO: type this
    collectInitialConnectionStats(): void;
    collectStats (): void;
  }
}

declare module 'localmedia' {
  export default class LocalMedia {
    constructor(options?: any);
    start (opts: MediaStreamConstraints, callback: (error: any, stream: MediaStream) => void): void;
    stop (): void;
    getSenders (): RTCRtpSender[];
    on (event: 'localStream', callback: (stream: MediaStream) => void): void;
    on (event: 'volumeChange', callback: (volumn: number) => void): void;
  }
}
