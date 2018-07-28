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

global.RTCTrackEvent = global.window.RTCTrackEvent = class extends Listener {};

global.RTCDataChannel = global.window.RTCDataChannel = class extends Listener {
  constructor (label) {
    super();
    this.label = label;
  }
};

global.RTCPeerConnection = global.window.RTCPeerConnection = class extends Listener {
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
