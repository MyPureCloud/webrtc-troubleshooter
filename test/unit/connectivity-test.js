import test from 'ava';
import sinon from 'sinon';

import ConnectivityTest from '../../src/diagnostics/ConnectivityTest';

let connectivityTest;

test.after(() => {
  delete global.RTCPeerConnection;
  delete global.dataChannel;
  connectivityTest = null;
});

test('logIceServers() should call logger.log and log iceServer.url if they exist', t => {
  const options = {
    iceServers: [
      {
        server1: 'stuff here'
      }
    ],
    logger: {
      log: sinon.stub()
    }
  };
  connectivityTest = new ConnectivityTest(options);
  connectivityTest.logIceServers();
  t.is(options.logger.log.called, true);
});

test('logIceServers() should call logger.error is there is not any iceServers', t => {
  const options = {
    iceServers: [],
    logger: {
      error: sinon.stub()
    }
  };
  connectivityTest = new ConnectivityTest(options);
  connectivityTest.logIceServers();
  t.is(options.logger.error.called, true);
});

test('logIceServers() should call logger.log if no options.iceServers property provided', t => {
  const options = {
    logger: {
      log: sinon.stub()
    }
  };
  connectivityTest = new ConnectivityTest(options);
  connectivityTest.logIceServers();
  t.is(options.logger.log.called, true);
});

test('destroy() should close peer connection', t => {
  connectivityTest = new ConnectivityTest({});
  connectivityTest.pc1 = {
    close: sinon.stub()
  };
  connectivityTest.pc2 = {
    close: sinon.stub()
  };
  connectivityTest.destroy();
  t.is(connectivityTest.pc1.close.called, true);
  t.is(connectivityTest.pc2.close.called, true);
});
