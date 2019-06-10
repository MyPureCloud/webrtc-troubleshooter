declare module 'rtcpeerconnection' {
  export default class PeerConnection {
    pc: RTCPeerConnection;
    constructor(config: RTCConfiguration | null, constraints?: MediaStreamConstraints);
    on (event: 'ice', callback: (candidate: RTCPeerConnectionIceEvent) => void ): void;
    on (event: 'answer', callback: (answer: { type: string, sdp: string }) => void ): void;
    on (event: 'offer', callback: (offer: { type: string, sdp: string }) => void ): void;
    on (event: 'addChannel', callback: (channel: RTCDataChannel) => void ): void;
    close (): void;
    getSenders (): RTCRtpSender[];
    getTransceivers (): RTCRtpTransceiver[];
    processIce (candidate: RTCPeerConnectionIceEvent): void;
    handleAnswer (answer: { type: string, sdp: string }): void;
    handleOffer (offer: { type: string, sdp: string }, callback: (err: any) => void): void;
    answer (callback: (err: any, answer: { type: string, sdp: string }) => void): void;
    offer (): void;
    createDataChannel (name: string | null, options?: RTCDataChannelInit): RTCDataChannel;
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
