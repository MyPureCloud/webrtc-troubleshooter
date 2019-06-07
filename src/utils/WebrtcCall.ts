// adapted from https://github.com/webrtc/testrtc
import PeerConnection from 'rtcpeerconnection';
import WebrtcStatsGather from 'webrtc-stats-gatherer';
import { Logger } from '../types/interfaces';
import ERROR_CODES from './testErrorCodes';

/**
 * Helper class to start and answer a Webrtc call using Peer Connections
 */
export default class WebrtcCall {

  /**
   * 1st peer connection
   */
  public pc1: PeerConnection;

  /**
   * 2nd peer connection
   */
  public pc2: PeerConnection;

  private logger: Logger;
  private pc1Gatherer: WebrtcStatsGather;
  private pc2Gatherer: WebrtcStatsGather;
  private hasIceCandidates: { pc1: boolean, pc2: boolean };
  private iceCandidateFilter: (arg?: any) => boolean;
  private constrainVideoBitrateKbps: string;
  private constrainOfferToRemoveVideoFec: boolean;
  private connectionRetries: number;

  constructor (config: RTCConfiguration, logger: Logger) {
    this.pc1 = new PeerConnection(config);
    this.pc2 = new PeerConnection(config);
    this.hasIceCandidates = {
      pc1: false,
      pc2: false
    };
    this.connectionRetries = 6;

    this.logger = logger;

    this.pc1Gatherer = new WebrtcStatsGather(this.pc1);
    this.pc1Gatherer.on('stats', stats => this.logger.log('pc1 webrtc stats', stats));
    this.pc1Gatherer.collectInitialConnectionStats();
    this.pc1Gatherer.collectStats();

    this.pc2Gatherer = new WebrtcStatsGather(this.pc2);
    this.pc2Gatherer.on('stats', stats => this.logger.log('pc2 webrtc stats', stats));
    this.pc2Gatherer.collectInitialConnectionStats();
    this.pc2Gatherer.collectStats();

    this.pc1.on('ice', (candidate: RTCPeerConnectionIceEvent) => {
      this.logger.log('webrtc call pc1 candidate', candidate);
      this.hasIceCandidates.pc1 = true;
      this.onIceCandidate(this.pc2, candidate);
    });
    this.pc2.on('ice', (candidate: RTCPeerConnectionIceEvent) => {
      this.logger.log('webrtc call pc2 candidate', candidate);
      this.hasIceCandidates.pc2 = true;
      this.onIceCandidate(this.pc1, candidate);
    });

    this.iceCandidateFilter = WebrtcCall.noFilter;
  }

  /**
   * Attempt to make a peer connection
   */
  public establishConnection (): Promise<void> {
    return this.pc1.pc.createOffer()
      .then(this.gotOffer.bind(this), function () { this.logger.error(...arguments); })
      .then(() => {
        return new Promise((resolve, reject) => {
          let attempt = 1;
          let interval = setInterval(() => {
            if (this.hasIceCandidates.pc1 && this.hasIceCandidates.pc2) {
              clearInterval(interval);
              resolve();
            } else if (attempt > this.connectionRetries) {
              clearInterval(interval);
              const error = new Error('No valid ICE candidates were found to establish a peer connection');
              error['pcCode'] = ERROR_CODES.ICE;
              reject(error);
            } else {
              attempt++;
            }
          }, 500);
        });
      });
  }

  /**
   * Close the peer connections
   */
  public close (): void {
    this.pc1.close();
    this.pc2.close();
  }

  /**
   * Gather stats for a given peer connection call.
   * When the peerConnection is closed the statsCb is called once with an array
   *  of gathered stats.
   * @param peerConnection peer connect to gather stats from
   * @param interval between stats gathering
   */
  public gatherStats (peerConnection: RTCPeerConnection, interval: number): Promise<{ stats: RTCStatsReport, statsCollectTime: number[] }> {
    let stats: RTCStatsReport; // TODO: this was an array... why?
    let statsCollectTime: number[] = [];

    return new Promise((resolve, reject) => {
      const getStats = () => {
        if (peerConnection.signalingState === 'closed') {
          return resolve({ stats, statsCollectTime });
        }
        setTimeout(() => {
          let getStatsTimeout = setTimeout(() => {
            resolve({ stats, statsCollectTime });
          }, 1000);
          peerConnection.getStats(null).then((response) => { // tslint:disable-line
            clearTimeout(getStatsTimeout);
            // getStatsTimeout = null;
            gotStats(response);
          });
        }, interval);
      };

      const gotStats = (response) => {
        if (!response) {
          return getStats();
        }
        const now = Date.now();
        const results: RTCStatsReport = response.result ? response.result() : response;
        stats = results;
        statsCollectTime = Object.keys(results).map(() => now);
        getStats();
      };

      getStats();
    });
  }

  /**
   * Setter for ice candidate filter
   * @param filter filter function
   */
  public setIceCandidateFilter (filter: (arg?: any) => boolean): void {
    this.iceCandidateFilter = filter;
  }

  /**
   * Remove video FEC if available on the offer.
   */
  public disableVideoFec (): void {
    this.constrainOfferToRemoveVideoFec = true;
  }

  /**
   * Constraint max video bitrate by modifying the SDP when creating an answer.
   */
  public constrainVideoBitrate (maxVideoBitrateKbps: string): void {
    this.constrainVideoBitrateKbps = maxVideoBitrateKbps;
  }

  /**
   * Function that returns true
   */
  public static noFilter (): boolean {
    return true;
  }

  /**
   * Check if a candidate type is 'relay'
   * @param candidate to check
   */
  public static isRelay (candidate: RTCIceCandidate) {
    return candidate.type === 'relay';
  }

  /**
   * Set the local desc. for pc1 and the remote desc. for pc2.
   *  Then return the answer from pc2.
   * @param offer from pc1
   */
  private gotOffer (offer: RTCSessionDescriptionInit): Promise<void> {
    // if (this.constrainOfferToRemoveVideoFec) {
    //   offer.sdp = offer.sdp.replace(/(m=video 1 [^\r]+)(116 117)(\r\n)/g, '$1\r\n');
    //   offer.sdp = offer.sdp.replace(/a=rtpmap:116 red\/90000\r\n/g, '');
    //   offer.sdp = offer.sdp.replace(/a=rtpmap:117 ulpfec\/90000\r\n/g, '');
    // }
    this.pc1.pc.setLocalDescription(offer); // tslint:disable-line
    this.pc2.pc.setRemoteDescription(offer); // tslint:disable-line
    return this.pc2.pc.createAnswer().then(this.gotAnswer.bind(this), console.error.bind(console));
  }

  /**
   * Set the local desc. for pc2 and the remote desc. for pc1.
   * Then return the promise from pc1 setting remote desc.
   * @param offer from pc1
   */
  private gotAnswer (answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.constrainVideoBitrateKbps && answer.sdp) {
      answer.sdp = answer.sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + this.constrainVideoBitrateKbps + '\r\n');
    }
    this.pc2.pc.setLocalDescription(answer); // tslint:disable-line
    return this.pc1.pc.setRemoteDescription(answer);
  }

  /**
   * Add an ice candidate for the passed in peer connection
   * @param otherPeer opposite peer than the caller
   * @param event ice event
   */
  private onIceCandidate (otherPeer: PeerConnection, event: RTCPeerConnectionIceEvent): void {
    if (event.candidate) {
      let parsed = this.parseCandidate(event.candidate.candidate);
      if (this.iceCandidateFilter(parsed)) {
        otherPeer.pc.addIceCandidate(event.candidate); // tslint:disable-line
      }
    }
  }

  /**
   * Parse a RTC Candidate string into a useful object
   * @param text candidate string
   */
  private parseCandidate (text: string): { type: string, protocol: string, address: string } {
    const candidateStr = 'candidate:';
    const pos = text.indexOf(candidateStr) + candidateStr.length;
    const fields = text.substr(pos).split(' ');
    return {
      'type': fields[7],
      'protocol': fields[2],
      'address': fields[4]
    };
  }

}
