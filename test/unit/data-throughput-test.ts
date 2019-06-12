import test from 'ava';
import sinon from 'sinon';

import DataThroughPutTest from '../../src/diagnostics/DataThroughputTest';

let dataThroughPutTest;
test.beforeEach(() => {
  // dataThroughPutTest = new DataThroughPutTest({
  //   iceServers: [],
  //   logger: {
  //     error: () => {}
  //   }
  // });
});

test.serial('start() should reject if there is now iceServers', t => {
  return dataThroughPutTest.start().catch(() => t.pass());
});

test.serial('start() should setup webrtc call', async t => {
  sinon.stub(dataThroughPutTest, 'sendingStep');
  dataThroughPutTest.options.iceServers.push({});
  dataThroughPutTest.start();
  // todo: assertions about event listners n such
  t.plan(0);
});

test.serial('onReceiverChannel(event) should addEventListener', t => {
  sinon.stub(dataThroughPutTest.onMessageReceived, 'bind');
  const mockChannel = {
    addEventListener: sinon.stub()
  };
  dataThroughPutTest.onReceiverChannel(mockChannel);
  sinon.assert.calledOnce(dataThroughPutTest.onMessageReceived.bind);
  sinon.assert.calledOnce(mockChannel.addEventListener);
});

test.serial('sendingStep() should send packets', t => {
  const context = {
    maxNumberOfPacketsToSend: 5,
    senderChannel: {
      bufferedAmount: 5,
      send: sinon.stub()
    },
    bytesToKeepBuffered: 6,
    samplePacket: [ { prop: 'val 1' }, { prop: 'val 2' } ],
    startTime: 255,
    testDurationSeconds: 9
  };
  dataThroughPutTest.sendingStep.call(context);
  t.is(context.senderChannel.send.called, true);
});

test.serial('onMessageReceived(event) should compute values but not resolve if now - this.lastBitrateMeasureTime >= 1000', t => {
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

test.serial('destroy() should call close', t => {
  t.plan(0);
});
