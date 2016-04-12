/* global RTCPeerConnection, mozRTCPeerConnection */

// adapted from https://github.com/webrtc/testrtc

class WebrtcCall {
  constructor (config) {
    this.pc1 = new RTCPeerConnection(config);
    this.pc2 = new RTCPeerConnection(config);

    this.pc1.addEventListener('icecandidate', this.onIceCandidate_.bind(this, this.pc2));
    this.pc2.addEventListener('icecandidate', this.onIceCandidate_.bind(this, this.pc1));

    this.iceCandidateFilter_ = WebrtcCall.noFilter;
  }

  establishConnection () {
    this.pc1.createOffer(this.gotOffer_.bind(this), console.error.bind(console));
  }

  close () {
    this.pc1.close();
    this.pc2.close();
  }

  // When the peerConnection is closed the statsCb is called once with an array
  // of gathered stats.
  gatherStats (peerConnection, statsCb, interval) {
    const stats = [];
    const statsCollectTime = [];
    getStats_();

    function getStats_ () {
      if (peerConnection.signalingState === 'closed') {
        statsCb(stats, statsCollectTime);
        return;
      }
      // Work around for webrtc/testrtc#74
      if (typeof mozRTCPeerConnection !== 'undefined' && peerConnection instanceof mozRTCPeerConnection) {
        setTimeout(getStats_, interval);
      } else {
        setTimeout(peerConnection.getStats.bind(peerConnection, gotStats_), interval);
      }
    }

    function gotStats_ (response) {
      for (let index in response.result()) {
        stats.push(response.result()[index]);
        statsCollectTime.push(Date.now());
      }
      getStats_();
    }
  }

  gotOffer_ (offer) {
    if (this.constrainOfferToRemoveVideoFec_) {
      offer.sdp = offer.sdp.replace(/(m=video 1 [^\r]+)(116 117)(\r\n)/g, '$1\r\n');
      offer.sdp = offer.sdp.replace(/a=rtpmap:116 red\/90000\r\n/g, '');
      offer.sdp = offer.sdp.replace(/a=rtpmap:117 ulpfec\/90000\r\n/g, '');
    }
    this.pc1.setLocalDescription(offer);
    this.pc2.setRemoteDescription(offer);
    this.pc2.createAnswer(this.gotAnswer_.bind(this), console.error.bind(console));
  }

  gotAnswer_ (answer) {
    if (this.constrainVideoBitrateKbps_) {
      answer.sdp = answer.sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + this.constrainVideoBitrateKbps_ + '\r\n');
    }
    this.pc2.setLocalDescription(answer);
    this.pc1.setRemoteDescription(answer);
  }

  onIceCandidate_ (otherPeer, event) {
    if (event.candidate) {
      var parsed = this.parseCandidate(event.candidate.candidate);
      if (this.iceCandidateFilter_(parsed)) {
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
    this.iceCandidateFilter_ = filter;
  }

  // Remove video FEC if available on the offer.
  disableVideoFec () {
    this.constrainOfferToRemoveVideoFec_ = true;
  }

  // Constraint max video bitrate by modifying the SDP when creating an answer.
  constrainVideoBitrate (maxVideoBitrateKbps) {
    this.constrainVideoBitrateKbps_ = maxVideoBitrateKbps;
  }

  static noFilter () {
    return true;
  }

  static isRelay (candidate) {
    return candidate.type === 'relay';
  }
}

export default WebrtcCall;
