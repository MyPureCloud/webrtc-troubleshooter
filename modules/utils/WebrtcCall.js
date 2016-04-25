/* global RTCPeerConnection, mozRTCPeerConnection */

// adapted from https://github.com/webrtc/testrtc

class WebrtcCall {
  constructor (config) {
    pc1 = new RTCPeerConnection(config);
    pc2 = new RTCPeerConnection(config);

    pc1.addEventListener('icecandidate', onIceCandidate_.bind(this, pc2));
    pc2.addEventListener('icecandidate', onIceCandidate_.bind(this, pc1));

    iceCandidateFilter_ = WebrtcCall.noFilter;
  }

  establishConnection () {
    pc1.createOffer(gotOffer_.bind(this), console.error.bind(console));
  }

  close () {
    pc1.close();
    pc2.close();
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
    if (constrainOfferToRemoveVideoFec_) {
      offer.sdp = offer.sdp.replace(/(m=video 1 [^\r]+)(116 117)(\r\n)/g, '$1\r\n');
      offer.sdp = offer.sdp.replace(/a=rtpmap:116 red\/90000\r\n/g, '');
      offer.sdp = offer.sdp.replace(/a=rtpmap:117 ulpfec\/90000\r\n/g, '');
    }
    pc1.setLocalDescription(offer);
    pc2.setRemoteDescription(offer);
    pc2.createAnswer(gotAnswer_.bind(this), console.error.bind(console));
  }

  gotAnswer_ (answer) {
    if (constrainVideoBitrateKbps_) {
      answer.sdp = answer.sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + constrainVideoBitrateKbps_ + '\r\n');
    }
    pc2.setLocalDescription(answer);
    pc1.setRemoteDescription(answer);
  }

  onIceCandidate_ (otherPeer, event) {
    if (event.candidate) {
      var parsed = parseCandidate(event.candidate.candidate);
      if (iceCandidateFilter_(parsed)) {
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
    iceCandidateFilter_ = filter;
  }

  // Remove video FEC if available on the offer.
  disableVideoFec () {
    constrainOfferToRemoveVideoFec_ = true;
  }

  // Constraint max video bitrate by modifying the SDP when creating an answer.
  constrainVideoBitrate (maxVideoBitrateKbps) {
    constrainVideoBitrateKbps_ = maxVideoBitrateKbps;
  }

  static noFilter () {
    return true;
  }

  static isRelay (candidate) {
    return candidate.type === 'relay';
  }
}

export default WebrtcCall;
