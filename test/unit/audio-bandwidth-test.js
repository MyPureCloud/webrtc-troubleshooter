import test from 'ava';
import sinon from 'sinon';

import AudioBandwidthTest from '../../src/diagnostics/AudioBandwidthTest';
import WebrtcCall from '../../src/utils/WebrtcCall';
import ERROR_CODES from '../../src/utils/testErrorCodes';

test('start() return error if iceConfig has no iceServers', async t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [] },
    mediaOptions: { audio: true }
  });
  try {
    await audioBandwidthTest.start();
  } catch (err) {
    t.is(err.message, 'No ice servers were provided');
  }
});

test('start() should call doGetUserMedia if there is iceServers and return error with results', async t => {
  const mediaSpy = sinon.spy(global.navigator.mediaDevices, 'getUserMedia');
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  audioBandwidthTest.start();
  sinon.assert.calledOnce(mediaSpy);
  global.navigator.mediaDevices.getUserMedia.restore();
});

test('getResults() should return object with log, constraints, and stats', t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: { deviceId: 'someAudioId' } }
  });
  const actual = audioBandwidthTest.getResults();
  const expected = {
    log: [],
    stats: {},
    constraints: { video: false, audio: { deviceId: 'someAudioId' } }
  };
  t.deepEqual(actual, expected);
});

test('addLog() should push message to the log', t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  audioBandwidthTest.addLog('info', { val: 'Test add log' });
  audioBandwidthTest.addLog('error', 'my error');
  t.is(audioBandwidthTest.log.length, 2);
});

test('doGetUserMedia() should add logs with the track label and return the stream', async t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  const stream = {
    id: '1234-asdf',
    getAudioTracks: () => []
  };
  // const constraints = { audio: true, video: false };
  global.navigator = {
    mediaDevices: {
      getUserMedia: (constraints) => Promise.resolve(stream)
    }
  };
  sinon.stub(audioBandwidthTest, 'getDeviceName').returns('trackName');
  sinon.stub(audioBandwidthTest, 'addLog');

  const resultStream = await audioBandwidthTest.doGetUserMedia({});
  t.is(resultStream, stream);
  sinon.assert.calledTwice(audioBandwidthTest.addLog);
});

test('doGetUserMedia() should add logs with a media error', async t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  const constraints = { audio: true, video: false };
  const errorMsg = 'Error on getUserMedia()';
  global.navigator = {
    mediaDevices: {
      getUserMedia: (constraints) => Promise.reject(new Error(errorMsg))
    }
  };
  sinon.stub(audioBandwidthTest, 'addLog');

  const expected = { pcCode: ERROR_CODES.MEDIA, message: errorMsg };
  audioBandwidthTest.doGetUserMedia(constraints)
    .then(() => t.fail('should not get here'))
    .catch(err => {
      t.deepEqual(err, expected);
      sinon.assert.calledThrice(audioBandwidthTest.addLog);
    });
});

test('getDeviceName() should return null if tracks are empty', t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  t.is(audioBandwidthTest.getDeviceName([]), null);
});

test('getDeviceName() should return label of first track if not empty', t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  const actual = audioBandwidthTest.getDeviceName([
    {
      label: 'Plantronics'
    }
  ]);
  const expected = 'Plantronics';
  t.is(actual, expected);
});

test('setupCall() should call establishConnection function and addLog function', async t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  audioBandwidthTest.call = new WebrtcCall(audioBandwidthTest.options.iceConfig, audioBandwidthTest.logger);
  sinon.stub(audioBandwidthTest.call, 'establishConnection').returns(Promise.resolve());
  sinon.stub(audioBandwidthTest.call.pc1.pc, 'addTrack');

  const mockTrack = new global.MediaStream({ audio: true });
  await audioBandwidthTest.setupCall(mockTrack);
  sinon.assert.calledOnce(audioBandwidthTest.call.pc1.pc.addTrack);
  sinon.assert.calledOnce(audioBandwidthTest.call.establishConnection);
  t.is(audioBandwidthTest.localTrack, mockTrack.getTracks()[0]);
});

test('runTest() should run gatherStats function', async t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  audioBandwidthTest.durationMs = 4;
  sinon.stub(audioBandwidthTest, 'gatherStats').callsFake(() => {
    audioBandwidthTest.destroy();
  });
  sinon.stub(audioBandwidthTest, 'gotStats');
  audioBandwidthTest.gatherStats = () => Promise.resolve({ prop: 'some Properties' });
  const actual = await audioBandwidthTest.runTest();
  const expected = { prop: 'some Properties' };
  t.deepEqual(actual, expected);
});

test('gatherStats() should resolve if starttime difference is large enough between durationMs', async t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  audioBandwidthTest.call = { pc1: { getStats: sinon.stub() } };
  await audioBandwidthTest.gatherStats();
  sinon.assert.notCalled(audioBandwidthTest.call.pc1.getStats);
});

test('gatherStats() should call gotStats', async t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  const mockStats = {};
  audioBandwidthTest.durationMs = 10000;
  audioBandwidthTest.startTime = new Date();
  audioBandwidthTest.call = new WebrtcCall(audioBandwidthTest.options.iceConfig, audioBandwidthTest.logger);
  sinon.stub(audioBandwidthTest.call.pc1.pc, 'getStats').returns(Promise.resolve(mockStats));
  sinon.stub(audioBandwidthTest, 'gotStats');
  await audioBandwidthTest.gatherStats();
  sinon.assert.calledOnce(audioBandwidthTest.gotStats);
  sinon.assert.calledWith(audioBandwidthTest.gotStats, mockStats);
});

test('gotStats() calls rttStats and bweStats if availableOutgoingBitrate and roundTripTime', async t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  sinon.stub(audioBandwidthTest.rttStats, 'add');
  sinon.stub(audioBandwidthTest.bweStats, 'add');
  sinon.stub(audioBandwidthTest, 'runTest');
  await audioBandwidthTest.gotStats([{
    roundTripTime: '30',
    timestamp: new Date(),
    availableOutgoingBitrate: '2000'
  }]);

  sinon.assert.calledOnce(audioBandwidthTest.rttStats.add);
  sinon.assert.calledWith(audioBandwidthTest.rttStats.add, sinon.match.date, 30);
  sinon.assert.calledOnce(audioBandwidthTest.bweStats.add);
  sinon.assert.calledWith(audioBandwidthTest.bweStats.add, sinon.match.date, 2000);
});

test('gotStats() calls rttStats if totalRoundTripTime', async t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  sinon.stub(audioBandwidthTest.rttStats, 'add');
  sinon.stub(audioBandwidthTest, 'runTest');
  await audioBandwidthTest.gotStats([{
    roundTripTime: '30',
    timestamp: new Date()
  }]);
  sinon.assert.calledOnce(audioBandwidthTest.rttStats.add);
  sinon.assert.calledWith(audioBandwidthTest.rttStats.add, sinon.match.date, 30);
});

test('completed() call addLog multiple times and return results', t => {
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true }
  });
  sinon.stub(audioBandwidthTest, 'addLog');
  const mockResults = {};
  audioBandwidthTest.results = mockResults;

  const results = audioBandwidthTest.completed();
  t.is(results, mockResults);
  sinon.assert.callCount(audioBandwidthTest.addLog, 6);
});

test('destroy() calls close and stop functions and then assigns null to call', t => {
  t.plan(2);
  const audioBandwidthTest = new AudioBandwidthTest({
    iceConfig: { iceServers: [{ urls: [] }] },
    mediaOptions: { audio: true },
    logger: { log () { }, error () { }, warn () { }, info () { } }
  });
  audioBandwidthTest.call = new WebrtcCall(audioBandwidthTest.options.iceConfig, audioBandwidthTest.logger);
  sinon.stub(audioBandwidthTest.call, 'close').callsFake(() => t.pass());
  audioBandwidthTest.destroy();
  t.is(audioBandwidthTest.call, null);
});
