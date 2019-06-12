import test from 'ava';
import sinon from 'sinon';

import VideoBandwidthTest from '../../src/diagnostics/VideoBandwidthTest';

// let videoBandwidthTest;
// test.beforeEach(() => {
//   const context = {
//     mediaOptions: {
//       video: {
//         deviceId: 'some deviceId'
//       }
//     },
//     screenStream: {
//       prop: 'some Prop'
//     }
//   };
//   videoBandwidthTest = new VideoBandwidthTest(context);
// });

// test.after(() => {
//   delete global.navigator;
// });

// test('start() should reject with error message', t => {
//   const context = {
//     options: {
//       iceConfig: {
//         iceServers: []
//       }
//     },
//     reject: err => err
//   };
//   const actual = videoBandwidthTest.start.call(context);
//   t.is(actual.message, 'No ice servers were provided');
// });

// test('start() should call gotStream when providedStream and return results', async t => {
//   const context = {
//     options: {
//       iceConfig: {
//         iceServers: [
//           {
//             server1: 'I am server 1'
//           }
//         ]
//       }
//     },
//     providedStream: {
//       stream: 'I am a stream'
//     },
//     gotStream: () => Promise.resolve(),
//     getResults: () => {
//       return {
//         verses: ['I can do all this through him who gives me strength.']
//       };
//     },
//     hasError: false,
//     resolve: val => val,
//     runTest: () => null,
//     completed: () => null
//   };
//   const actual = await videoBandwidthTest.start.call(context);
//   t.deepEqual(actual.verses, ['I can do all this through him who gives me strength.']);
// });

// test('start() should call doGetUserMedia when not providedStream and return results', async t => {
//   const context = {
//     options: {
//       iceConfig: {
//         iceServers: [
//           {
//             server1: 'I am server 1'
//           }
//         ]
//       }
//     },
//     doGetUserMedia: () => Promise.resolve(),
//     getResults: () => {
//       return {
//         verses: ['Finally, be strong in the Lord and in his mighty power.']
//       };
//     },
//     hasError: false,
//     resolve: val => val,
//     runTest: () => null,
//     completed: () => null
//   };
//   const actual = await videoBandwidthTest.start.call(context);
//   t.deepEqual(actual.verses, ['Finally, be strong in the Lord and in his mighty power.']);
// });

// test('start() should return error if hasError', async t => {
//   const context = {
//     options: {
//       iceConfig: {
//         iceServers: [
//           {
//             server1: 'I am server 1'
//           }
//         ]
//       }
//     },
//     doGetUserMedia: () => Promise.resolve(),
//     getResults: () => {
//       return {
//         verses: ['Finally, be strong in the Lord and in his mighty power.']
//       };
//     },
//     hasError: true,
//     reject: val => val,
//     runTest: () => null,
//     completed: () => null
//   };
//   const actual = await videoBandwidthTest.start.call(context);
//   t.is(actual.error.message, 'Video Bandwidth Error');
// });

// test('getResults() should return object with results', t => {
//   const context = {
//     log: 'I am a log',
//     stats: [],
//     constraints: {
//       prop1: 'one'
//     }
//   };
//   const actual = videoBandwidthTest.getResults.call(context);
//   const expected = {
//     prop1: 'one'
//   };
//   t.deepEqual(actual.constraints, expected);
// });

// test('addLog() should push message to log', t => {
//   t.plan(0);
//   const context = {
//     logger: {
//       error: val => val,
//       info: val => val
//     },
//     log: []
//   };
//   videoBandwidthTest.addLog.call(context, 'error', 'Going to get pushed to log');
// });

// test('doGetUserMedia() should return stream', async t => {
//   const options = {
//     mediaOptions: {
//       video: {
//         deviceId: 'some deviceId'
//       }
//     },
//     screenStream: {
//       prop: 'some Prop'
//     }
//   };
//   const videoBandwidthTest = new VideoBandwidthTest(options);
//   global.navigator = {
//     mediaDevices: {
//       getUserMedia: (constraints) => Promise.resolve(constraints)
//     }
//   };
//   let audioElement = document.createElement('video');
//   audioElement.src = `data:audio/x-wav;base64,${new Buffer('wave')}>`; // eslint-disable-line
//   audioElement.getVideoTracks = () => ['track1', 'track2'];
//   const context = {
//     gotStream: stream => stream,
//     addLog: sinon.stub(),
//     getDeviceName: name => name
//   };
//   const actual = await videoBandwidthTest.doGetUserMedia.call(context, audioElement);
//   t.truthy(actual);
//   t.is(context.addLog.called, true);
// });

// test('getDeviceName() should return null if tracks are empty', t => {
//   t.is(videoBandwidthTest.getDeviceName([]), null);
// });

// test('getDeviceName() should return label of first track if not empty', t => {
//   const actual = videoBandwidthTest.getDeviceName([
//     {
//       label: 'Lady Dragon'
//     }
//   ]);
//   const expected = 'Lady Dragon';
//   t.is(actual, expected);
// });

// test('gotStream() should call establishConnect', t => {
//   t.plan(0);
// });

// test('gatherStats() should resolve if starttime difference is large enough between durationMs', t => {
//   const context = {
//     completed: () => 'completed',
//     call: {
//       pc1: {
//         pc: {
//           getStats: () => Promise.resolve()
//         }
//       }
//     },
//     gotStats: {
//       bind: sinon.stub()
//     },
//     startTime: 0,
//     durationMs: 50
//   };
//   return videoBandwidthTest.gatherStats.call(context)
//     .then(val => {
//       t.is(val, 'completed');
//     });
// });

// test('gatherStats() should call gotStats if durationMs is greater than difference of now and startTime', t => {
//   const context = {
//     completed: () => 'completed',
//     call: {
//       pc1: {
//         pc: {
//           getStats: () => Promise.resolve()
//         }
//       }
//     },
//     gotStats: {
//       bind: sinon.stub()
//     },
//     startTime: 90000,
//     durationMs: 10000000000000000
//   };
//   return videoBandwidthTest.gatherStats.call(context)
//     .then(val => {
//       t.is(context.gotStats.bind.called, true);
//     });
// });

// test('gotStats() should call bweStats if availableOutgoingBitrate', t => {
//   const context = {
//     addLog: () => {},
//     rttStats: {
//       add: sinon.stub()
//     },
//     bweStats: {
//       add: sinon.stub()
//     },
//     runTest: () => Promise.resolve(),
//     gatherStats: () => Promise.resolve()
//   };
//   return videoBandwidthTest.gotStats.call(context, [{
//     type: 'ssrc',
//     mediaType: 'video',
//     googRtt: 10,
//     timestamp: new Date(),
//     googJitterReceived: 3,
//     packetsLost: 0,
//     packetsSent: 1,
//     googFrameWidthSent: 5,
//     googFrameHeightSent: 9,
//     googAvailableSendBandwidth: 18,
//     availableOutgoingBitrate: 20000
//   }]).then(() => {
//     t.is(context.bweStats.add.called, true);
//   });
// });

// test('gotStats() should call rttStats if roundTripTime', t => {
//   const context = {
//     addLog: () => {},
//     rttStats: {
//       add: sinon.stub()
//     },
//     bweStats: {
//       add: sinon.stub()
//     },
//     runTest: () => Promise.resolve(),
//     gatherStats: () => Promise.resolve()
//   };
//   return videoBandwidthTest.gotStats.call(context, [
//     {
//       type: 'ssrc',
//       id: 'outbound_rtcp_video_blah',
//       mediaType: 'video',
//       googRtt: 10,
//       timestamp: new Date(),
//       googJitterReceived: 3,
//       packetsLost: 0,
//       packetsSent: 1,
//       googFrameWidthSent: 5,
//       googFrameHeightSent: 9,
//       googAvailableSendBandwidth: 18,
//       jitter: 'some Jitter stuff',
//       roundTripTime: 55
//     }
//   ]).then(() => {
//     t.is(context.rttStats.add.called, true);
//   });
// });

// test('gotStats() should call addLog if no reponse', t => {
//   delete global.document.documentElement.style.WebkitAppearance;
//   global.navigator.userAgent = '';
//   const context = {
//     addLog: sinon.stub(),
//     rttStats: {
//       add: sinon.stub()
//     },
//     bweStats: {
//       add: sinon.stub()
//     },
//     runTest: () => Promise.resolve(),
//     gatherStats: () => Promise.resolve()
//   };
//   return videoBandwidthTest.gotStats.call(context, null).then(() => {
//     t.is(context.addLog.called, true);
//   });
// });

// test('completed() should call addLog 5 times if chrome browser and videoStats are below 2 threshold', t => {
//   global.document.documentElement.style.WebkitAppearance = '';
//   global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.36 Safari/537.36';
//   const context = {
//     addLog: sinon.stub(),
//     rttStats: {
//       add: sinon.stub(),
//       getAverage: sinon.stub(),
//       getMax: sinon.stub()
//     },
//     bweStats: {
//       add: sinon.stub()
//     },
//     runTest: () => Promise.resolve(),
//     gatherStats: () => Promise.resolve(),
//     call: {
//       pc1: {
//         getLocalStreams: () => {
//           return [
//             {
//               getTracks: () => {
//                 return [
//                   {
//                     stop: () => {}
//                   }
//                 ];
//               }
//             }
//           ];
//         }
//       },
//       close: () => {}
//     },
//     videoStats: [1, 1],
//     stats: {},
//     results: {
//       prop: 'prop for chrom results'
//     }
//   };
//   const actual = videoBandwidthTest.completed.call(context);
//   const expected = { prop: 'prop for chrom results' };
//   t.is(context.addLog.callCount, 5);
//   t.deepEqual(actual, expected);
// });

// test('completed() should call addLog 8 times if chrome browser and videoStats are over 2 threshold', t => {
//   global.document.documentElement.style.WebkitAppearance = '';
//   global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.36 Safari/537.36';
//   const context = {
//     addLog: sinon.stub(),
//     rttStats: {
//       add: sinon.stub(),
//       getAverage: sinon.stub(),
//       getMax: sinon.stub()
//     },
//     bweStats: {
//       add: sinon.stub(),
//       getAverage: () => 100,
//       getMax: () => 1000,
//       getRampUpTime: () => 8
//     },
//     bweStats2: {
//       getAverage: () => 0,
//       getMax: () => 0
//     },
//     runTest: () => Promise.resolve(),
//     gatherStats: () => Promise.resolve(),
//     call: {
//       pc1: {
//         getLocalStreams: () => {
//           return [
//             {
//               getTracks: () => {
//                 return [
//                   {
//                     stop: () => {}
//                   }
//                 ];
//               }
//             }
//           ];
//         }
//       },
//       close: () => {}
//     },
//     videoStats: [8, 5],
//     stats: {},
//     results: {
//       prop: 'prop for chrom results'
//     }
//   };
//   const actual = videoBandwidthTest.completed.call(context);
//   const expected = { prop: 'prop for chrom results' };
//   t.is(context.addLog.callCount, 8);
//   t.deepEqual(actual, expected);
// });

// test('completed() should call addLog 7 times if firefox browser and compute stats', t => {
//   delete global.document.documentElement.style.WebkitAppearance;
//   global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:54.0) Gecko/20100101 Firefox/54.0';
//   const context = {
//     addLog: sinon.stub(),
//     rttStats: {
//       add: sinon.stub(),
//       getAverage: sinon.stub(),
//       getMax: sinon.stub()
//     },
//     bweStats: {
//       add: sinon.stub(),
//       getAverage: () => 100,
//       getMax: () => 1000,
//       getRampUpTime: () => 8
//     },
//     runTest: () => Promise.resolve(),
//     gatherStats: () => Promise.resolve(),
//     call: {
//       pc1: {
//         getLocalStreams: () => {
//           return [
//             {
//               getTracks: () => {
//                 return [
//                   {
//                     stop: () => {}
//                   }
//                 ];
//               }
//             }
//           ];
//         }
//       },
//       close: () => {}
//     },
//     videoStats: [8, 5],
//     stats: {},
//     results: {
//       prop: 'prop for firefox results'
//     },
//     framerateMean: 11,
//     bitrateMean: 15,
//     mbpsStdDev: 5,
//     mbpsAvg: 8
//   };
//   const actual = videoBandwidthTest.completed.call(context);
//   const expected = { prop: 'prop for firefox results' };
//   t.is(context.addLog.callCount, 7);
//   t.deepEqual(actual, expected);
// });

// test('completed() should call addLog 7 times if firefox browser and compute stats but log error if framerateMean is not positive number', t => {
//   delete global.document.documentElement.style.WebkitAppearance;
//   global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:54.0) Gecko/20100101 Firefox/54.0';
//   const context = {
//     addLog: sinon.stub(),
//     rttStats: {
//       add: sinon.stub(),
//       getAverage: sinon.stub(),
//       getMax: sinon.stub()
//     },
//     bweStats: {
//       add: sinon.stub(),
//       getAverage: () => 100,
//       getMax: () => 1000,
//       getRampUpTime: () => 8
//     },
//     runTest: () => Promise.resolve(),
//     gatherStats: () => Promise.resolve(),
//     call: {
//       pc1: {
//         getLocalStreams: () => {
//           return [
//             {
//               getTracks: () => {
//                 return [
//                   {
//                     stop: () => {}
//                   }
//                 ];
//               }
//             }
//           ];
//         }
//       },
//       close: () => {}
//     },
//     videoStats: [8, 5],
//     stats: {},
//     results: {
//       prop: 'prop for firefox results'
//     },
//     framerateMean: 0,
//     bitrateMean: 15,
//     mbpsStdDev: 5,
//     mbpsAvg: 8,
//     packetsLost: 0,
//     packetsSent: 5
//   };
//   const actual = videoBandwidthTest.completed.call(context);
//   const expected = { prop: 'prop for firefox results' };
//   t.is(context.addLog.callCount, 7);
//   t.deepEqual(actual, expected);
// });

// test('completed() should stop transceivers if they exist', function (t) {
//   const mockTransceiver = { stop: sinon.stub() };
//   const context = {
//     addLog: sinon.stub(),
//     rttStats: {
//       add: sinon.stub(),
//       getAverage: sinon.stub(),
//       getMax: sinon.stub()
//     },
//     bweStats: {
//       add: sinon.stub(),
//       getAverage: () => 100,
//       getMax: () => 1000,
//       getRampUpTime: () => 8
//     },
//     runTest: () => Promise.resolve(),
//     gatherStats: () => Promise.resolve(),
//     call: {
//       pc1: {
//         getTransceivers: () => [ mockTransceiver ]
//       },
//       close: () => {}
//     },
//     stats: {},
//     results: {
//       prop: 'prop for firefox results'
//     }
//   };
//   videoBandwidthTest.completed.call(context);
//   t.is(mockTransceiver.stop.called, true);
// });

// test('destroy() should clearTimeout and call close', t => {
//   t.plan(0);
//   const context = {
//     nextTimeout: 0,
//     call: {
//       close: () => {}
//     }
//   };
//   videoBandwidthTest.destroy.call(context);
// });
