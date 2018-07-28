import test from 'ava';
import sinon from 'sinon';

import CameraResolutionTest from '../../src/diagnostics/CameraResolutionTest';

let cameraResolutionTest;
test.beforeEach(() => {
  const args = [
    {
      props: [
        {
          width: 10
        },
        {
          height: 5
        }
      ]
    },
    {
      duration: 'too darn long',
      logger: {
        log: sinon.stub()
      }
    }
  ];
  cameraResolutionTest = new CameraResolutionTest(...args);
});

test.after(() => {
  delete global.RTCPeerConnection;
  delete global.gotOffer;
});

test('start() should call log function and startGetUserMedia and resolve with results if no error', async t => {
  t.plan(2);
  delete CameraResolutionTest.reject;
  CameraResolutionTest.startGetUserMedia = (resolutions) => Promise.resolve(resolutions);
  CameraResolutionTest.logger = {
    log: sinon.stub()
  };
  CameraResolutionTest.resolutions = [
    {
      prop: 'someProp'
    }
  ];
  CameraResolutionTest.currentResolution = {
    prop: 'someProp'
  };
  CameraResolutionTest.getResults = () => {
    return {
      log: 'blob stuff',
      stats: [{ val: 'blah' }],
      resolutions: [
        {
          height: 5
        },
        {
          width: 23
        }
      ],
      duration: '5ms'
    };
  };
  CameraResolutionTest.resolve = props => props;
  CameraResolutionTest.hasError = false;
  const actual = await cameraResolutionTest.start.call(CameraResolutionTest);
  const expected = {
    val: 'blah'
  };
  t.deepEqual(actual.stats[0], expected);
  t.is(CameraResolutionTest.logger.log.called, true);
});

test('getResults() should return object with results', t => {
  const context = {
    log: 'log it baby',
    stats: [
      {
        prop: 'random stats'
      }
    ],
    resolutions: [
      {
        width: 5
      },
      {
        height: 4
      }
    ],
    duration: '10ms'
  };
  const actual = cameraResolutionTest.getResults.call(context);
  const expected = '10ms';
  t.is(actual.duration, expected);
});

test('reportSuccess(str) should push string onto log and log message', t => {
  const context = {
    log: [],
    logger: {
      log: sinon.stub()
    }
  };
  cameraResolutionTest.reportSuccess.call(context);
  t.is(context.logger.log.called, true);
});

test('reportError(str) should push error to log call logger.warn', t => {
  const context = {
    log: [],
    logger: {
      warn: sinon.stub()
    }
  };
  cameraResolutionTest.reportError.call(context);
  t.is(context.logger.warn.called, true);
});

test('reportInfo(str) should call logger.info', t => {
  const context = {
    logger: {
      info: sinon.stub()
    }
  };
  cameraResolutionTest.reportInfo.call(context);
  t.is(context.logger.info.called, true);
});

test('startGetUserMedia(resolution) should call getUserMedia and maybeContinueGetUserMedia if resolution length is greater than 1', t => {
  global.navigator = {
    mediaDevices: {
      getUserMedia: constraints => {
        constraints.getTracks = (track) => {
          return [
            {
              stop: () => {}
            }
          ];
        };
        return Promise.resolve(constraints);
      }
    }
  };
  const context = {
    resolutions: [
      {
        width: 5
      },
      {
        height: 6
      }
    ],
    reportSuccess: info => info,
    maybeContinueGetUserMedia: sinon.stub()
  };
  cameraResolutionTest.startGetUserMedia.call(
    context,
    [
      {
        width: 5
      },
      {
        height: 6
      }
    ]
  ).then(() => {
    t.is(context.maybeContinueGetUserMedia.called, true);
  });
});

test('startGetUserMedia(resolution) should call logger.log and collectAndAnalyzeStats if resolution is one', t => {
  t.plan(2);
  global.navigator = {
    mediaDevices: {
      getUserMedia: constraints => {
        constraints.getTracks = (track) => {
          return [
            {
              stop: () => {}
            }
          ];
        };
        return Promise.resolve(constraints);
      }
    }
  };
  const context = {
    resolutions: [],
    logger: {
      log: sinon.stub()
    },
    collectAndAnalyzeStats: (stream, resolutions) => resolutions
  };
  return cameraResolutionTest.startGetUserMedia.call(
    context,
    [
      {
        width: 5
      },
      {
        height: 6
      }
    ]
  ).then(info => {
    t.is(context.logger.log.called, true);
    t.deepEqual(info, [ { width: 5 }, { height: 6 } ]);
  });
});

test('maybeContinueGetUserMedia() should return results if currentResolution is equal to resolution', t => {
  const context = {
    currentResolution: 3,
    resolutions: [
      {
        prop1: 'one'
      },
      {
        prop2: 'two'
      },
      {
        prop3: 'three'
      }
    ],
    getResults: () => {
      return {
        log: 'log it baby',
        stats: [
          {
            prop: 'random stats'
          }
        ],
        resolutions: [
          {
            width: 5
          },
          {
            height: 4
          }
        ],
        duration: '10ms'
      };
    }
  };
  const actual = cameraResolutionTest.maybeContinueGetUserMedia.call(context);
  const expected = {
    log: 'log it baby',
    stats: [
      {
        prop: 'random stats'
      }
    ],
    resolutions: [
      {
        width: 5
      },
      {
        height: 4
      }
    ],
    duration: '10ms'
  };
  t.deepEqual(actual, expected);
});

test('maybeContinueGetUserMedia() should call this.startGetUserMedia if resolution and currentResolution are not equal', t => {
  t.plan(0);
  const context = {
    currentResolution: 3,
    resolutions: [
      {
        prop1: 'one'
      },
      {
        prop2: 'two'
      }
    ],
    startGetUserMedia: resolution => Promise.resolve(resolution)
  };
  return cameraResolutionTest.maybeContinueGetUserMedia.call(context)
    .then(resolution => resolution);
});

test('collectAndAnalyzeStats(stream, resolution) should reportError and call maybeContinueGetUserMedia is tracks is less than 1', async t => {
  const args = [
    {
      getVideoTracks: () => {
        return [];
      }
    },
    {}
  ];
  const context = {
    maybeContinueGetUserMedia: () => Promise.resolve([
      {
        width: 5
      },
      {
        height: 6
      }
    ]),
    reportError: () => {}
  };
  const actual = await cameraResolutionTest.collectAndAnalyzeStats.apply(context, args);
  const expected = [
    {
      width: 5
    },
    {
      height: 6
    }
  ];
  t.deepEqual(actual, expected);
});

test('collectAndAnalyzeStats(stream, resolution) should return data with analyzeStats final call', async t => {
  // Mock out RTCPeerConnection for node runtime.
  global.RTCPeerConnection = () => {
    return {
      addEventListener: () => {},
      addTrack: () => {},
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
      gotStats: () => {}
    };
  };
  global.gotOffer = () => {};
  const args = [
    {
      getTracks () { return this.getVideoTracks(); },
      getVideoTracks: () => {
        return [
          {
            addEventListener: () => {}
          }
        ];
      }
    },
    {}
  ];
  const context = {
    reportError: () => {},
    endCall: () => {},
    analyzeStats: () => {
      return [
        {
          resolution: [
            {
              width: 5
            },
            {
              height: 6
            }
          ]
        }
      ];
    }
  };
  const actual = await cameraResolutionTest.collectAndAnalyzeStats.apply(context, args);
  const expected = [
    {
      width: 5
    },
    {
      height: 6
    }
  ];
  t.deepEqual(actual[0].resolution, expected);
});

test('analyzeStats should generate statsReport object and call testExpectations', t => {
  const context = {
    testExpectations: sinon.stub(),
    isMuted: false,
    extractEncoderSetupTime: () => {},
    arrayAverage: () => {}
  };
  const args = {
    resolution: [
      {
        width: 5
      },
      {
        height: 6
      }
    ],
    videoElement: document.createElement('video'),
    stream: {
      getVideoTracks: () => {
        return [
          {
            label: 'Johnny Walker'
          }
        ];
      }
    },
    frameChecker: {
      frameStats: {
        numFrames: 5,
        numBlackFrames: 0,
        numFrozenFrames: 0
      }
    },
    stats: [
      {
        type: 'ssrc',
        googFrameRateInput: 0,
        googFrameRateSen: 5
      }
    ]
  };
  const actual = cameraResolutionTest.analyzeStats.call(context, args);
  t.is(actual.cameraName, 'Johnny Walker');
});

test('endCall() should call stop and close', t => {
  const context = {
    isShuttingDown: false
  };
  const args = [
    {
      close: sinon.stub()
    },
    {
      getTracks: () => {
        return [
          {
            stop: () => {}
          }
        ];
      }
    }
  ];
  cameraResolutionTest.endCall.apply(context, args);
  t.is(args[0].close.called, true);
});

test('extractEncodeSetupTime() should annotate and return result', t => {
  const stats = [
    {
      type: 'ssrc',
      googFrameRateInput: 50
    }
  ];
  const statsCollectTime = [100];
  const actual = JSON.parse(cameraResolutionTest.extractEncoderSetupTime(stats, statsCollectTime));
  t.is(actual, 0);
});

test('resolutionMatchesIndependentOfRotationOrCrop() should evaulate to boolean from properties passed in', t => {
  const args = [10, 15, 10, 15];
  const actual = cameraResolutionTest.resolutionMatchesIndependentOfRotationOrCrop(...args);
  t.is(actual, true);
  t.is(cameraResolutionTest.resolutionMatchesIndependentOfRotationOrCrop([10, 15, 5, 5]), false);
});

test('testExpectations() should call reportSuccess twice if avgSentFbs is positive number and resolutions match', t => {
  const context = {
    reportInfo: sinon.stub(),
    reportError: sinon.stub(),
    reportSuccess: sinon.stub(),
    resolutionMatchesIndependentOfRotationOrCrop: () => true
  };
  const report = {
    number: 5,
    notAvailableStatus: 'not here',
    avgSentFps: 5
  };
  cameraResolutionTest.testExpectations.call(context, report);
  t.is(context.reportSuccess.calledTwice, true);
});

test('testExpectations() should call reportError twice if avgSentFbs is less than 5 and resolutions do not match', t => {
  const context = {
    reportInfo: sinon.stub(),
    reportError: sinon.stub(),
    reportSuccess: sinon.stub(),
    resolutionMatchesIndependentOfRotationOrCrop: () => false
  };
  const report = {
    number: 5,
    notAvailableStatus: 'not here',
    avgSentFps: 3
  };
  cameraResolutionTest.testExpectations.call(context, report);
  t.is(context.reportError.calledTwice, true);
});

test('testExpectations() should call reportInfo if avgSentFbs is not a number', t => {
  const context = {
    reportInfo: sinon.stub(),
    reportError: sinon.stub(),
    reportSuccess: sinon.stub(),
    resolutionMatchesIndependentOfRotationOrCrop: () => false
  };
  const report = {
    number: 5,
    notAvailableStatus: 'not here',
    avgSentFps: 'what'
  };
  cameraResolutionTest.testExpectations.call(context, report);
  t.is(context.reportInfo.called, true);
});

test('arrayAverage() should compute array average', t => {
  const actual = cameraResolutionTest.arrayAverage([1, 2, 3, 4, 5]);
  t.is(actual, 3);
});
