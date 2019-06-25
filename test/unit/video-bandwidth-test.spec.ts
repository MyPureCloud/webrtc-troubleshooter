import VideoBandwidthTest from '../../src/diagnostics/VideoBandwidthTest';

function setNavigator (newNavigator): void {
  Object.defineProperty(global, 'navigator', { value: newNavigator });
}

function setWebkitAppearance (value: any | null): void {
  if (value === null || value === undefined) {
    delete global['document'].documentElement.style.WebkitAppearance;
  } else {
    global['document'].documentElement.style.WebkitAppearance = value;
  }
}

describe('VideoBandwidthTest', () => {
  let videoBandwidthTest: VideoBandwidthTest;
  let savedNavigator;
  let savedWebkit;
  beforeEach(() => {
    savedNavigator = global['navigator'];
    savedWebkit = global['document'].documentElement.style.WebkitAppearance;
    const context = {
      mediaOptions: {
        video: {
          deviceId: 'some deviceId'
        }
      },
      screenStream: {
        prop: 'some Prop'
      }
    };
    videoBandwidthTest = new VideoBandwidthTest(context);
  });

  afterEach(() => {
    setNavigator(savedNavigator);
    setWebkitAppearance(savedWebkit);
  });

  describe('start()', () => {
    test('should reject with error message', async () => {
      const context = {
        options: {
          iceConfig: {
            iceServers: []
          }
        },
        reject: err => err
      };
      const actual = await videoBandwidthTest.start.call(context);
      expect(actual.message).toBe('No ice servers were provided');
    });

    test('should call gotStream when providedStream and return results', async () => {
      const context = {
        options: {
          iceConfig: {
            iceServers: [
              {
                server1: 'I am server 1'
              }
            ]
          }
        },
        providedStream: {
          stream: 'I am a stream'
        },
        gotStream: () => Promise.resolve(),
        getResults: () => {
          return {
            verses: ['I can do all this through him who gives me strength.']
          };
        },
        maxVideoBitrateKbps: 12345,
        hasError: false,
        resolve: val => val,
        runTest: () => null,
        completed: () => null
      };
      const actual = await videoBandwidthTest.start.call(context);
      expect(actual.verses).toEqual(['I can do all this through him who gives me strength.']);
    });

    test('should call doGetUserMedia when not providedStream and return results', async () => {
      const context = {
        options: {
          iceConfig: {
            iceServers: [
              {
                server1: 'I am server 1'
              }
            ]
          }
        },
        doGetUserMedia: () => Promise.resolve(),
        getResults: () => {
          return {
            verses: ['Finally, be strong in the Lord and in his mighty power.']
          };
        },
        maxVideoBitrateKbps: 12345,
        hasError: false,
        resolve: val => val,
        runTest: () => null,
        completed: () => null
      };
      const actual = await videoBandwidthTest.start.call(context);
      expect(actual.verses).toEqual(['Finally, be strong in the Lord and in his mighty power.']);
    });

    test('should return error if hasError', async () => {
      const context = {
        options: {
          iceConfig: {
            iceServers: [
              {
                server1: 'I am server 1'
              }
            ]
          }
        },
        doGetUserMedia: () => Promise.resolve(),
        getResults: () => {
          return {
            verses: ['Finally, be strong in the Lord and in his mighty power.']
          };
        },
        maxVideoBitrateKbps: 12345,
        hasError: true,
        reject: val => val,
        runTest: () => null,
        completed: () => null
      };
      const actual = await videoBandwidthTest.start.call(context);
      expect(actual.error.message).toBe('Video Bandwidth Error');
    });
  });

  describe('getResults()', () => {
    test('should return object with results', async () => {
      const context = {
        log: 'I am a log',
        stats: [],
        constraints: {
          prop1: 'one'
        }
      };
      const actual = await videoBandwidthTest['getResults'].call(context);
      const expected = {
        prop1: 'one'
      };
      expect(actual.constraints).toEqual(expected);
    });
  });

  describe('addLog()', () => {
    test('should push message to log and flag hasError', () => {
      videoBandwidthTest['addLog']('error', 'Going to get pushed to log');
      expect(videoBandwidthTest['log']).toEqual(['error: Going to get pushed to log']);
      expect(videoBandwidthTest['hasError']).toBe(true);
    });
  });

  describe('doGetUserMedia()', () => {
    test('should return stream', async () => {
      const options = {
        mediaOptions: {
          video: {
            deviceId: 'some deviceId'
          }
        },
        screenStream: {
          prop: 'some Prop'
        }
      };
      const videoBandwidthTest = new VideoBandwidthTest(options);
      setNavigator({
        mediaDevices: {
          getUserMedia: (constraints) => Promise.resolve(constraints)
        }
      });
      let audioElement = document.createElement('video');
      audioElement.src = `data:audio/x-wav;base64,${new Buffer('wave')}>`; // tslint:disable-line
      audioElement['getVideoTracks'] = () => ['track1', 'track2'];
      const context = {
        gotStream: stream => stream,
        addLog: jest.fn(),
        getDeviceName: name => name
      };
      const actual = await videoBandwidthTest['doGetUserMedia'].call(context, audioElement);
      expect(actual).toBeTruthy();
      expect(context.addLog).toHaveBeenCalled();
    });
  });

  describe('getDeviceName()', () => {
    test('should return null if tracks are empty', () => {
      expect(videoBandwidthTest['getDeviceName']([])).toBeNull();
    });

    test('should return label of first track if not empty', () => {
      const actual = videoBandwidthTest['getDeviceName']([
        { label: 'Lady Dragon' } as any
      ]);
      const expected = 'Lady Dragon';
      expect(actual).toBe(expected);
    });
  });

  describe('getStream()', () => {
    test('should call establisthConnect and set localStream', async () => {
      const context = {
        call: {
          pc1: {
            pc: {
              addTrack: jest.fn()
            }
          },
          establishConnection: jest.fn().mockResolvedValue(null)
        },
        addLog: jest.fn(),
        startTime: null,
        localStream: null
      };
      const fakeStream = {
        getTracks: () => [
          { id: 'fakeId1', kind: 'video' },
          { id: 'fakeId2', kind: 'audio' }
        ],
        getVideoTracks: () => [
          { id: 'fakeId1', kind: 'video' }
        ]
      };

      await videoBandwidthTest['gotStream'].call(context, fakeStream);
      expect(context.call.establishConnection).toHaveBeenCalled();
      expect(context.call.pc1.pc.addTrack).toHaveBeenCalledTimes(2);
      expect(context.addLog).toHaveBeenCalled();
      expect(context.startTime).toBeTruthy();
      expect(context.localStream).toEqual({ id: 'fakeId1', kind: 'video' });
    });
  });

  describe('gatherStats()', () => {
    test('should esolve if startTime difference is large enough between durationMs', (done) => {
      const context = {
        completed: () => 'completed',
        call: {
          pc1: {
            pc: {
              getStats: () => Promise.resolve()
            }
          }
        },
        gotStats: {
          bind: jest.fn()
        },
        startTime: new Date(0),
        durationMs: 50
      };
      videoBandwidthTest['gatherStats'].call(context)
        .then(val => {
          expect(val).toBe('completed');
          done();
        });
    });

    test('should call gotStats if durationMs is greater than difference of now and startTime', (done) => {
      const context = {
        completed: () => 'completed',
        call: {
          pc1: {
            pc: {
              getStats: () => Promise.resolve()
            }
          }
        },
        gotStats: {
          bind: jest.fn()
        },
        startTime: new Date(9000),
        durationMs: 10000000000000000
      };
      videoBandwidthTest['gatherStats'].call(context)
        .then(val => {
          expect(context.gotStats.bind).toHaveBeenCalled();
          done();
        });
    });
  });

  describe('gotStats()', () => {
    test('should call bweStats if availableOutgoingBitrate', (done) => {
      const context = {
        addLog: () => null,
        rttStats: {
          add: jest.fn()
        },
        bweStats: {
          add: jest.fn()
        },
        runTest: () => Promise.resolve(),
        gatherStats: () => Promise.resolve()
      };
      videoBandwidthTest['gotStats'].call(context, [{
        type: 'ssrc',
        mediaType: 'video',
        googRtt: 10,
        timestamp: new Date(),
        googJitterReceived: 3,
        packetsLost: 0,
        packetsSent: 1,
        googFrameWidthSent: 5,
        googFrameHeightSent: 9,
        googAvailableSendBandwidth: 18,
        availableOutgoingBitrate: 20000
      }]).then(() => {
        expect(context.bweStats.add).toHaveBeenCalled();
        done();
      });
    });

    test('should call rttStats if roundTripTime', (done) => {
      const context = {
        addLog: () => null,
        rttStats: {
          add: jest.fn()
        },
        bweStats: {
          add: jest.fn()
        },
        runTest: () => Promise.resolve(),
        gatherStats: () => Promise.resolve()
      };
      videoBandwidthTest['gotStats'].call(context, [
        {
          type: 'ssrc',
          id: 'outbound_rtcp_video_blah',
          mediaType: 'video',
          googRtt: 10,
          timestamp: new Date(),
          googJitterReceived: 3,
          packetsLost: 0,
          packetsSent: 1,
          googFrameWidthSent: 5,
          googFrameHeightSent: 9,
          googAvailableSendBandwidth: 18,
          jitter: 'some Jitter stuff',
          roundTripTime: 55
        }
      ]).then(() => {
        expect(context.rttStats.add).toHaveBeenCalled();
        done();
      });
    });

    test('should call addLog if no reponse', (done) => {
      setWebkitAppearance(null);
      setNavigator({ userAgent: '' });
      const context = {
        addLog: jest.fn(),
        rttStats: {
          add: jest.fn()
        },
        bweStats: {
          add: jest.fn()
        },
        runTest: () => Promise.resolve(),
        gatherStats: () => Promise.resolve()
      };
      videoBandwidthTest['gotStats'].call(context, null).then(() => {
        expect(context.addLog).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('completed()', () => {
    test('should call addLog 5 times if chrome browser and videoStats are below 2 threshold', () => {
      setWebkitAppearance('');
      setNavigator({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.36 Safari/537.36' });
      const context = {
        addLog: jest.fn(),
        rttStats: {
          add: jest.fn(),
          getAverage: jest.fn(),
          getMax: jest.fn()
        },
        bweStats: {
          add: jest.fn()
        },
        runTest: () => Promise.resolve(),
        gatherStats: () => Promise.resolve(),
        call: {
          pc1: {
            getLocalStreams: () => {
              return [
                {
                  getTracks: () => {
                    return [
                      {
                        stop: () => null
                      }
                    ];
                  }
                }
              ];
            }
          },
          close: () => null
        },
        videoStats: [1, 1],
        stats: {},
        results: {
          prop: 'prop for chrom results'
        }
      };
      const actual = videoBandwidthTest['completed'].call(context);
      const expected = { prop: 'prop for chrom results' };
      expect(context.addLog).toHaveBeenCalledTimes(5);
      expect(actual).toEqual(expected);
    });

    test('should call addLog 8 times if chrome browser and videoStats are over 2 threshold', () => {
      setWebkitAppearance('');
      setNavigator({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.36 Safari/537.36' });
      const context = {
        addLog: jest.fn(),
        rttStats: {
          add: jest.fn(),
          getAverage: jest.fn(),
          getMax: jest.fn()
        },
        bweStats: {
          add: jest.fn(),
          getAverage: () => 100,
          getMax: () => 1000,
          getRampUpTime: () => 8
        },
        bweStats2: {
          getAverage: () => 0,
          getMax: () => 0
        },
        runTest: () => Promise.resolve(),
        gatherStats: () => Promise.resolve(),
        call: {
          pc1: {
            getLocalStreams: () => {
              return [
                {
                  getTracks: () => {
                    return [
                      {
                        stop: () => null
                      }
                    ];
                  }
                }
              ];
            }
          },
          close: () => null
        },
        videoStats: [8, 5],
        stats: {},
        results: {
          prop: 'prop for chrom results'
        }
      };
      const actual = videoBandwidthTest['completed'].call(context);
      const expected = { prop: 'prop for chrom results' };
      expect(context.addLog).toHaveBeenCalledTimes(8);
      expect(actual).toEqual(expected);
    });

    test('should call addLog 7 times if firefox browser and compute stats', () => {
      setWebkitAppearance(null);
      setNavigator({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:54.0) Gecko/20100101 Firefox/54.0' });
      const context = {
        addLog: jest.fn(),
        rttStats: {
          add: jest.fn(),
          getAverage: jest.fn(),
          getMax: jest.fn()
        },
        bweStats: {
          add: jest.fn(),
          getAverage: () => 100,
          getMax: () => 1000,
          getRampUpTime: () => 8
        },
        runTest: () => Promise.resolve(),
        gatherStats: () => Promise.resolve(),
        call: {
          pc1: {
            getLocalStreams: () => {
              return [
                {
                  getTracks: () => {
                    return [
                      {
                        stop: () => null
                      }
                    ];
                  }
                }
              ];
            }
          },
          close: () => null
        },
        videoStats: [8, 5],
        stats: {},
        results: {
          prop: 'prop for firefox results'
        },
        framerateMean: 11,
        bitrateMean: 15,
        mbpsStdDev: 5,
        mbpsAvg: 8
      };
      const actual = videoBandwidthTest['completed'].call(context);
      const expected = { prop: 'prop for firefox results' };
      expect(context.addLog).toHaveBeenCalledTimes(7);
      expect(actual).toEqual(expected);
    });

    test('should call addLog 7 times if firefox browser and compute stats but log error if framerateMean is not positive number', () => {
      setWebkitAppearance(null);
      setNavigator({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:54.0) Gecko/20100101 Firefox/54.0' });
      const context = {
        addLog: jest.fn(),
        rttStats: {
          add: jest.fn(),
          getAverage: jest.fn(),
          getMax: jest.fn()
        },
        bweStats: {
          add: jest.fn(),
          getAverage: () => 100,
          getMax: () => 1000,
          getRampUpTime: () => 8
        },
        runTest: () => Promise.resolve(),
        gatherStats: () => Promise.resolve(),
        call: {
          pc1: {
            getLocalStreams: () => {
              return [
                {
                  getTracks: () => {
                    return [
                      {
                        stop: () => null
                      }
                    ];
                  }
                }
              ];
            }
          },
          close: () => null
        },
        videoStats: [8, 5],
        stats: {},
        results: {
          prop: 'prop for firefox results'
        },
        framerateMean: 0,
        bitrateMean: 15,
        mbpsStdDev: 5,
        mbpsAvg: 8,
        packetsLost: 0,
        packetsSent: 5
      };
      const actual = videoBandwidthTest['completed'].call(context);
      const expected = { prop: 'prop for firefox results' };
      expect(context.addLog).toHaveBeenCalledTimes(7);
      expect(actual).toEqual(expected);
    });

    test('should stop transceivers if they exist', () => {
      const mockTransceiver = { stop: jest.fn() };
      const context = {
        addLog: jest.fn(),
        rttStats: {
          add: jest.fn(),
          getAverage: jest.fn(),
          getMax: jest.fn()
        },
        bweStats: {
          add: jest.fn(),
          getAverage: () => 100,
          getMax: () => 1000,
          getRampUpTime: () => 8
        },
        runTest: () => Promise.resolve(),
        gatherStats: () => Promise.resolve(),
        call: {
          pc1: {
            getTransceivers: () => [mockTransceiver]
          },
          close: () => null
        },
        stats: {},
        results: {
          prop: 'prop for firefox results'
        }
      };
      videoBandwidthTest['completed'].call(context);
      expect(mockTransceiver.stop).toHaveBeenCalled();
    });
  });

  describe('destroy()', () => {
    test('should clearTimeout, call close(), and clear localStream', () => {
      const context = {
        nextTimeout: 918273645,
        call: {
          close: () => null
        },
        localStream: {
          stop: jest.fn()
        }
      };
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
      const closeSpy = spyOn(context.call, 'close');
      videoBandwidthTest.destroy.call(context);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(context.nextTimeout);
      expect(closeSpy).toHaveBeenCalled();
      expect(context.call).toBeFalsy();
      expect(context.localStream.stop).toHaveBeenCalled();
    });
  });

});
