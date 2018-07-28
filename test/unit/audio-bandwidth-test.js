import test from 'ava';
import sinon from 'sinon';

import AudioBandwidthTest from '../../src/diagnostics/AudioBandwidthTest';

let audioBandwidthTest, options;
test.beforeEach(() => {
  options = {
    mediaOptions: {
      audio: {
        deviceId: 'someAudioId'
      }
    },
    iceConfig: {
      iceServers: []
    },
    doGetUserMedia: () => Promise.resolve(document.createElement('audio')),
    getDeviceName: () => {},
    call: {
      pc1: {
        addTrack: sinon.stub()
      },
      establishConnection: () => Promise.resolve()
    },
    gatherStats: () => Promise.resolve('stats')
  };
  audioBandwidthTest = new AudioBandwidthTest(options);
});

test.after(() => {
  delete global.RTCPeerConnection;
  delete global.navigator;
  delete global.document.documentElement.style.WebkitAppearance;
});

test('start() return error if iceConfig has no iceServers', async t => {
  try {
    await audioBandwidthTest.start();
  } catch (err) {
    t.is(err.message, 'No ice servers were provided');
  }
});

test('start() should call doGetUserMedia if there is iceServers and return error with results', async t => {
  const options = {
    options: {
      mediaOptions: {
        audio: {
          deviceId: 'someAudioId'
        }
      },
      iceConfig: {
        iceServers: [{ server: '1' }]
      }
    },
    doGetUserMedia: () => Promise.resolve(document.createElement('audio')),
    runTest: () => {},
    completed: () => {},
    getResults: () => ['Some Audio'],
    mediaOptions: {
      audio: {
        deviceId: 'someAudioId'
      }
    },
    iceConfig: {
      iceServers: [{ server: '1' }]
    },
    reject: () => 'return results and err'
  };
  const audioBandwidthTest = new AudioBandwidthTest(options);
  // Mock out RTCPeerConnection for node runtime.
  global.RTCPeerConnection = () => {
    return {
      addEventListener: () => {}
    };
  };
  const actual = await audioBandwidthTest.start.call(options);
  t.is(actual, 'return results and err');
});

test('getResults() should return object with log, constraints, and stats', t => {
  const actual = audioBandwidthTest.getResults();
  const expected = {
    log: [],
    stats: {},
    constraints: { video: false, audio: { deviceId: 'someAudioId' } }
  };
  t.deepEqual(actual, expected);
});

test('addLog() should push message to the log', t => {
  audioBandwidthTest.addLog('info', { val: 'Test add log' });
  audioBandwidthTest.addLog('error', 'my error');
  t.is(audioBandwidthTest.log.length, 2);
});

test('doGetUserMedia() should return stream', async t => {
  const options = {
    options: {
      mediaOptions: {
        audio: {
          deviceId: 'someAudioId'
        }
      },
      iceConfig: {
        iceServers: [{ server: '1' }]
      }
    },
    doGetUserMedia: () => Promise.resolve(document.createElement('audio')),
    runTest: () => {},
    completed: () => {},
    getResults: () => ['Some Audio'],
    mediaOptions: {
      audio: {
        deviceId: 'someAudioId'
      }
    },
    iceConfig: {
      iceServers: [{ server: '1' }]
    },
    reject: () => 'return results and err'
  };
  const audioBandwidthTest = new AudioBandwidthTest(options);
  global.navigator = {
    mediaDevices: {
      getUserMedia: (constraints) => Promise.resolve(constraints)
    }
  };
  let audioElement = document.createElement('audio');
  audioElement.src = `data:audio/x-wav;base64,${new Buffer('wave')}>`; // eslint-disable-line
  audioElement.getAudioTracks = () => ['track1', 'track2'];
  const actual = await audioBandwidthTest.doGetUserMedia(audioElement);
  t.truthy(actual.getAudioTracks(), ['track1', 'track2']);
});

test('getDeviceName() should return null if tracks are empty', t => {
  t.is(audioBandwidthTest.getDeviceName([]), null);
});

test('getDeviceName() should return label of first track if not empty', t => {
  const actual = audioBandwidthTest.getDeviceName([
    {
      label: 'Mommas don\'t let your babies grow up to be cowboys'
    }
  ]);
  const expected = 'Mommas don\'t let your babies grow up to be cowboys';
  t.is(actual, expected);
});

test('setupCall() should call establishConnection function and addLog function', t => {
  const options = {
    mediaOptions: {
      audio: {
        deviceId: 'someAudioId'
      }
    },
    iceConfig: {
      iceServers: []
    },
    doGetUserMedia: () => Promise.resolve(document.createElement('audio')),
    getDeviceName: () => {},
    call: {
      pc1: {
        addTrack: sinon.stub()
      },
      establishConnection: () => Promise.resolve()
    },
    addLog: sinon.stub()
  };
  const audioBandwidthTest = new AudioBandwidthTest(options);
  t.notThrows(() => audioBandwidthTest.setupCall.apply(options, [
    {
      getTracks () { return this.getAudioTracks(); },
      getAudioTracks: () => {
        return [
          {
            track: 'track1'
          }
        ];
      }
    }
  ]));
});

test('runTest() should run gatherStats function', async t => {
  audioBandwidthTest.gatherStats = () => Promise.resolve({ prop: 'some Properties' });
  const actual = await audioBandwidthTest.runTest();
  const expected = { prop: 'some Properties' };
  t.deepEqual(actual, expected);
});

test('gatherStats() should resolve if starttime difference is large enough between durationMs', t => {
  return audioBandwidthTest.gatherStats.call({
    startTime: 100,
    durationMs: 900
  }).then(() => {
    t.truthy(true);
  });
});

test('gatherStats() should call gotStats', t => {
  const context = {
    call: {
      pc1: {
        getStats: () => Promise.resolve('value')
      }
    },
    localTrack: [
      {
        track: 'track1'
      }
    ],
    gotStats: sinon.stub()
  };
  return audioBandwidthTest.gatherStats.call(context).then(() => {
    t.is(context.gotStats.called, true);
  });
});

test('gotStats() calls rttStats and bweStats if availableOutgoingBitrate and totalRoundTripTime', t => {
  global.document.documentElement.style.WebkitAppearance = '';
  global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.36 Safari/537.36';
  const context = {
    addLog: () => {},
    rttStats: {
      add: sinon.stub()
    },
    bweStats: {
      add: sinon.stub()
    },
    runTest: () => Promise.resolve()
  };
  return audioBandwidthTest.gotStats.call(context, [{
    type: 'ssrc',
    mediaType: 'audio',
    googRtt: 10,
    timestamp: new Date(),
    googJitterReceived: 3,
    packetsLost: 0,
    packetsSent: 1,
    totalRoundTripTime: 55,
    availableOutgoingBitrate: 2000
  }]).then(() => {
    t.is(context.rttStats.add.called, true);
    t.is(context.bweStats.add.called, true);
  });
});

test('gotStats() calls rttStats if totalRoundTripTime', t => {
  const context = {
    addLog: () => {},
    rttStats: {
      add: sinon.stub()
    },
    bweStats: {
      add: sinon.stub()
    },
    runTest: () => Promise.resolve()
  };
  return audioBandwidthTest.gotStats.call(context, [{
    id: 'outbound_rtcp_audio_',
    jitter: 'too much caffeine, now I have the jitters',
    packetsLost: 0,
    bytesSent: 25,
    timestamp: new Date(),
    packetsSent: 3,
    totalRoundTripTime: 55
  }]).then(() => {
    t.is(context.rttStats.add.called, true);
    t.is(context.bweStats.add.called, false);
  });
});

test('completed() call addLog multiple times and return results', t => {
  t.plan(2);
  const context = {
    addLog: sinon.stub(),
    stats: {
      mbpsAvg: 5,
      mbpsMax: 10
    },
    bweStats: {
      getAverage: () => 25,
      getMax: () => 19
    },
    rttStats: {
      getAverage: () => 23,
      getMax: () => 50
    },
    packetsSent: 11,
    packetsLost: 2,
    jitter: 'some Jitters',
    results: {
      id: 5,
      props: ['one', 'two']
    }
  };
  const actual = audioBandwidthTest.completed.call(context);
  t.is(context.addLog.callCount, 6);
  t.is(actual.id, 5);
});

test('destroy() calls close and stop functions and then assigns null to call', t => {
  const context = {
    call: {
      pc1: {
        getLocalStreams: () => [
          {
            prop: 'someProp',
            getTracks: () => [
              {
                stop: sinon.stub()
              }
            ]
          }
        ]
      },
      close: sinon.stub()
    }
  };
  audioBandwidthTest.destroy.call(context);
  t.is(context.call, null);
});
