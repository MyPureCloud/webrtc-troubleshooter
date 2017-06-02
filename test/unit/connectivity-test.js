import test from 'ava';
import sinon from 'sinon';

import ConnectivityTest from '../../src/diagnostics/ConnectivityTest';

let connectivityTest;
test.beforeEach(() => {
  connectivityTest = new ConnectivityTest([
    {
      prop: 'some property'
    }
  ]);
});

test.after(() => {
  delete global.RTCPeerConnection;
  delete global.dataChannel;
});

test('logIceServers() should call logger.log and log iceServer.url if they exist', t => {
  const context = {
    options: {
      iceServers: [
        {
          server1: 'stuff here'
        }
      ]
    },
    logger: {
      log: sinon.stub()
    }
  };
  connectivityTest.logIceServers.call(context);
  t.is(context.logger.log.called, true);
});

test('logIceServers() should call logger.error is there is not any iceServers', t => {
  const context = {
    options: {
      iceServers: []
    },
    logger: {
      error: sinon.stub()
    }
  };
  connectivityTest.logIceServers.call(context);
  t.is(context.logger.error.called, true);
});

test('logIceServers() should call logger.log if no options.iceServers property provided', t => {
  const context = {
    options: {},
    logger: {
      log: sinon.stub()
    }
  };
  connectivityTest.logIceServers.call(context);
  t.is(context.logger.log.called, true);
});

test('start() should create offer and return promise', async t => {
  t.plan(0);
  // Mock out RTCPeerConnection for node runtime.
  global.RTCPeerConnection = () => {
    return {
      addEventListener: () => {},
      addStream: () => {},
      createOffer: () => Promise.resolve(),
      setLocalDescription: () => {},
      setRemoteDescription: () => {},
      createAnswer: () => Promise.resolve(),
      gatherStats: () => {},
      getStats: () => {
        return {
          then: () => {}
        };
      },
      gotStats: () => {},
      getRemoteStreams: () => {},
      createDataChannel: () => {
        return {
          onmessage: null
        };
      },
      offer: () => {}
    };
  };
  const context = {
    logger: {
      log: sinon.stub()
    }
  };
  await connectivityTest.start.call(context);
});

test('destroy() should close peer connection', t => {
  const context = {
    pc1: {
      close: sinon.stub()
    },
    pc2: {
      close: sinon.stub()
    }
  };
  connectivityTest.destroy.call(context);
  t.is(context.pc1.close.called, true);
  t.is(context.pc2.close.called, true);
});
