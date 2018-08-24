import browserEnv from 'browser-env';
browserEnv();

class Listener {
  constructor () {
    this._listeners = {};
  }
  addEventListener (event, listener) {
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(listener);
  }
  trigger (event, args) {
    const listeners = this._listeners[event];
    if (!listeners || listeners.length === 0) {
      return;
    }
    listeners.forEach(l => l(...args));
  }
}

global.RTCTrackEvent = class extends Listener {};

global.RTCDataChannel = class extends Listener {
  constructor (label) {
    super();
    this.label = label;
  }
};

global.RTCPeerConnection = class extends Listener {
  addTrack () {}
  addStream () {}
  createOffer () { return Promise.resolve(); }
  setLocalDescription () {}
  setRemoteDescription () {}
  createAnswer () { return Promise.resolve(); }
  getStats () { return Promise.resolve(); }
  createDataChannel (label) {
    return new global.window.RTCDataChannel(label);
  }
};

global.MediaTrack = class {
  constructor (kind) {
    this.kind = kind;
  }
  stop () {}
};

global.MediaStream = class {
  constructor (constraints) {
    this._tracks = [];
    if (constraints.audio) {
      this._tracks.push(new global.MediaTrack('audio'));
    }
    if (constraints.video) {
      this._tracks.push(new global.MediaTrack('video'));
    }
  }

  getTracks () {
    return this._tracks;
  }

  getAudioTracks () {
    return this._tracks.filter(t => t.kind === 'audio');
  }

  getVideoTracks () {
    return this._tracks.filter(t => t.kind === 'video');
  }
};

global.navigator = {
  mediaDevices: {
    getUserMedia: constraints => Promise.resolve(new global.MediaStream(constraints))
  },
  userAgent: 'NODE'
};

global.window = global;
