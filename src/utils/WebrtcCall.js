// adapted from https://github.com/webrtc/testrtc
import ERROR_CODES from './testErrorCodes';

const WebrtcStatsGather = require('webrtc-stats-gatherer');
const PeerConnection = require('rtcpeerconnection');

class WebrtcCall {
  constructor (config, logger) {
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

    this.pc1.on('ice', candidate => {
      this.logger.log('webrtc call pc1 candidate', candidate);
      this.hasIceCandidates.pc1 = true;
      this.onIceCandidate(this.pc2, candidate);
    });
    this.pc2.on('ice', candidate => {
      this.logger.log('webrtc call pc2 candidate', candidate);
      this.hasIceCandidates.pc2 = true;
      this.onIceCandidate(this.pc1, candidate);
    });

    this.iceCandidateFilter = WebrtcCall.noFilter;
  }

  establishConnection () {
    return this.pc1.pc.createOffer()
      .then(this.gotOffer.bind(this), () => this.logger.error(...arguments))
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
              error.pcCode = ERROR_CODES.ICE;
              reject(error);
            } else {
              attempt++;
            }
          }, 500);
        });
      });
  }

  close () {
    this.pc1.close();
    this.pc2.close();
  }

  // When the peerConnection is closed the statsCb is called once with an array
  // of gathered stats.
  gatherStats (peerConnection, interval) {
    let stats = [];
    let statsCollectTime = [];

    return new Promise((resolve, reject) => {
      const getStats = () => {
        if (peerConnection.signalingState === 'closed') {
          return resolve({ stats, statsCollectTime });
        }
        setTimeout(() => {
          let getStatsTimeout = setTimeout(() => {
            resolve({ stats, statsCollectTime });
          }, 1000);
          peerConnection.getStats(null).then((response) => {
            clearTimeout(getStatsTimeout);
            getStatsTimeout = null;
            gotStats(response);
          });
        }, interval);
      };

      const gotStats = (response) => {
        if (!response) {
          return getStats();
        }
        const now = Date.now();
        const results = response.result ? response.result() : response;
        stats = results;
        statsCollectTime = Object.keys(results).map(() => now);
        getStats();
      };

      getStats();
    });
  }

  gotOffer (offer) {
    // if (this.constrainOfferToRemoveVideoFec) {
    //   offer.sdp = offer.sdp.replace(/(m=video 1 [^\r]+)(116 117)(\r\n)/g, '$1\r\n');
    //   offer.sdp = offer.sdp.replace(/a=rtpmap:116 red\/90000\r\n/g, '');
    //   offer.sdp = offer.sdp.replace(/a=rtpmap:117 ulpfec\/90000\r\n/g, '');
    // }
    this.pc1.pc.setLocalDescription(offer);
    this.pc2.pc.setRemoteDescription(offer);
    return this.pc2.pc.createAnswer().then(this.gotAnswer.bind(this), console.error.bind(console));
  }

  gotAnswer (answer) {
    if (this.constrainVideoBitrateKbps) {
      answer.sdp = answer.sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + this.constrainVideoBitrateKbps + '\r\n');
    }
    this.pc2.pc.setLocalDescription(answer);
    return this.pc1.pc.setRemoteDescription(answer);
  }

  onIceCandidate (otherPeer, event) {
    if (event.candidate) {
      var parsed = this.parseCandidate(event.candidate.candidate);
      if (this.iceCandidateFilter(parsed)) {
        otherPeer.pc.addIceCandidate(event.candidate);
      }
    }
  }

  parseCandidate (text) {
    const candidateStr = 'candidate:';
    const pos = text.indexOf(candidateStr) + candidateStr.length;
    const fields = text.substr(pos).split(' ');
    return {
      'type': fields[7],
      'protocol': fields[2],
      'address': fields[4]
    };
  }

  setIceCandidateFilter (filter) {
    this.iceCandidateFilter = filter;
  }

  // Remove video FEC if available on the offer.
  disableVideoFec () {
    this.constrainOfferToRemoveVideoFec = true;
  }

  // Constraint max video bitrate by modifying the SDP when creating an answer.
  constrainVideoBitrate (maxVideoBitrateKbps) {
    this.constrainVideoBitrateKbps = maxVideoBitrateKbps;
  }

  static noFilter () {
    return true;
  }

  static isRelay (candidate) {
    return candidate.type === 'relay';
  }
}

export default WebrtcCall;
