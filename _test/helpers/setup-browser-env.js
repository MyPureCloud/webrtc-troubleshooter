import browserEnv from 'browser-env';
browserEnv();

class Listener {
  constructor() {
    this._listeners = {};
  }
  addEventListener(event, listener) {
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(listener);
  }
  trigger(event, args) {
    const listeners = this._listeners[event];
    if (!listeners || listeners.length === 0) {
      return;
    }
    listeners.forEach(l => l(...args));
  }
}

let RTCTrackEvent = class extends Listener { };
Object.defineProperty(global, 'RTCTrackEvent', { value: RTCTrackEvent, writeable: true, configurable: true });

let RTCDataChannel = class extends Listener {
  constructor(label) {
    super();
    this.label = label;
  }
};
Object.defineProperty(global, 'RTCDataChannel', { value: RTCDataChannel, writeable: true, configurable: true });

let RTCPeerConnection = class extends Listener {
  addTrack() { }
  addStream() { }
  createOffer() { return Promise.resolve(); }
  setLocalDescription() { }
  setRemoteDescription() { }
  createAnswer() { return Promise.resolve(); }
  getStats() { return Promise.resolve(); }
  createDataChannel(label) {
    return new global.window.RTCDataChannel(label);
  }
  close() { }
};
Object.defineProperty(global, 'RTCPeerConnection', { value: RTCPeerConnection, writeable: true, configurable: true });

let MediaTrack = class {
  constructor(kind) {
    this.kind = kind;
  }
  stop() { }
};
Object.defineProperty(global, 'MediaTrack', { value: MediaTrack, writeable: true, configurable: true });

let MediaStream = class {
  constructor(constraints) {
    this._tracks = [];
    if (constraints.audio) {
      this._tracks.push(new global.MediaTrack('audio'));
    }
    if (constraints.video) {
      this._tracks.push(new global.MediaTrack('video'));
    }
  }

  getTracks() {
    return this._tracks;
  }

  getAudioTracks() {
    return this._tracks.filter(t => t.kind === 'audio');
  }

  getVideoTracks() {
    return this._tracks.filter(t => t.kind === 'video');
  }
};
Object.defineProperty(global, 'MediaStream', { value: MediaStream, writeable: true, configurable: true });

let navigator = {
  mediaDevices: {
    getUserMedia: constraints => Promise.resolve(new global.MediaStream(constraints))
  },
  userAgent: 'NODE'
};
Object.defineProperty(global, 'navigator', { value: navigator, writeable: true, configurable: true });

global.window = global;
