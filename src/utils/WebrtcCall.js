/* global RTCPeerConnection */
// adapted from https://github.com/webrtc/testrtc

class WebrtcCall {
  constructor (config) {
    this.pc1 = new RTCPeerConnection(config);
    this.pc2 = new RTCPeerConnection(config);

    this.pc1.addEventListener('icecandidate', this.onIceCandidate.bind(this, this.pc2));
    this.pc2.addEventListener('icecandidate', this.onIceCandidate.bind(this, this.pc1));

    this.iceCandidateFilter = WebrtcCall.noFilter;
  }

  establishConnection () {
    return this.pc1.createOffer().then(this.gotOffer.bind(this), () => this.logger.error(...arguments));
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
        window.pc = peerConnection;
        if (peerConnection.signalingState === 'closed') {
          return resolve({stats, statsCollectTime});
        }
        setTimeout(() => {
          let getStatsTimeout = setTimeout(() => {
            resolve({stats, statsCollectTime});
          }, 1000);
          peerConnection.getStats(null).then((response) => {
            clearTimeout(getStatsTimeout);
            getStatsTimeout = null;
            gotStats(response);
          });
        }, interval);
      };

      const gotStats = (response) => {
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
    this.pc1.setLocalDescription(offer);
    this.pc2.setRemoteDescription(offer);
    return this.pc2.createAnswer().then(this.gotAnswer.bind(this), console.error.bind(console));
  }

  gotAnswer (answer) {
    if (this.constrainVideoBitrateKbps) {
      answer.sdp = answer.sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + this.constrainVideoBitrateKbps + '\r\n');
    }
    this.pc2.setLocalDescription(answer);
    return this.pc1.setRemoteDescription(answer);
  }

  onIceCandidate (otherPeer, event) {
    if (event.candidate) {
      var parsed = this.parseCandidate(event.candidate.candidate);
      if (this.iceCandidateFilter(parsed)) {
        otherPeer.addIceCandidate(event.candidate);
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
