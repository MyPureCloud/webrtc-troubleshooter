import test from 'ava';
import sinon from 'sinon';

import DataThroughPutTest from '../../src/diagnostics/DataThroughputTest';

let dataThroughPutTest;
test.beforeEach(() => {
  dataThroughPutTest = new DataThroughPutTest();
});

test.after(() => {
  delete global.RTCPeerConnection;
});

test('start() should reject if there is now iceServers', async t => {
  const context = {
    options: {
      iceServers: []
    },
    logger: {
      error: () => {}
    },
    reject: sinon.stub()
  };
  await dataThroughPutTest.start.call(context);
  t.is(context.reject.called, true);
});

test('start() should setup webrtc call', async t => {
  t.plan(2);
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
          onmessage: null,
          addEventListener: () => {}
        };
      },
      offer: () => {}
    };
  };
  const context = {
    options: {
      iceServers: [
        {
          server1: 'server 1 here'
        }
      ]
    },
    logger: {
      error: () => {}
    },
    sendingStep: {
      bind: sinon.stub()
    },
    onReceiverChannel: {
      bind: sinon.stub()
    }
  };
  await dataThroughPutTest.start.call(context);
  t.is(context.sendingStep.bind.called, true);
  t.is(context.onReceiverChannel.bind.called, true);
});

test('onReceiverChannel(event) should addEventListener', t => {
  const context = {
    onMessageReceived: {
      bind: sinon.stub()
    }
  };
  dataThroughPutTest.onReceiverChannel.call(
    context,
    {
      channel: {
        addEventListener: () => {}
      }
    }
  );
  t.is(context.onMessageReceived.bind.called, true);
});

test('sendingStep() should send packets', t => {
  const context = {
    maxNumberOfPacketsToSend: 5,
    senderChannel: {
      bufferedAmount: 5,
      send: sinon.stub()
    },
    bytesToKeepBuffered: 6,
    samplePacket: [ {prop: 'val 1'}, {prop: 'val 2'} ],
    startTime: 255,
    testDurationSeconds: 9
  };
  dataThroughPutTest.sendingStep.call(context);
  t.is(context.senderChannel.send.called, true);
});

test('onMessageReceived(event) should compute values but not resolve if now - this.lastBitrateMeasureTime >= 1000', t => {
  const context = {
    lastBitrateMeasureTime: 0,
    receivedPayloadBytes: 1000,
    lastReceivedPayloadBytes: 80,
    stopSending: true,
    call: {
      close: sinon.stub()
    },
    logger: {
      log: sinon.stub()
    },
    resolve: () => {}
  };
  dataThroughPutTest.onMessageReceived.call(
    context,
    {
      data: []
    }
  );
  t.is(context.logger.log.called, true);
});

test('destroy() should call close', t => {
  t.plan(0);
  const context = {
    call: {
      close: () => {}
    },
    throughputTimeout: 5
  };
  dataThroughPutTest.destroy.call(context);
});
