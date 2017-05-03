import test from 'ava';

import AdvancedCameraTest from '../../src/diagnostics/AdvancedCameraTest';

let CameraResolutionStub, options, advancedCameraTest;
test.beforeEach(() => {
  CameraResolutionStub = {
    resolutions: [
      [320, 240]
    ],
    start: Promise.resolve([320, 240]),
    deferred: {
      resolve: () => [320, 240],
      reject: () => 'an error'
    }
  };
  options = {
    mediaStream: document.createElement('video').mediaStream,
    duration: 5,
    addTest: () => {},
    runNextTest: () => {},
    deferred: {
      resolve: () => [320, 240],
      reject: () => 'received error'
    },
    stopAllTests: () => {}
  };
  advancedCameraTest = new AdvancedCameraTest(options);
});

test('start() will return undefined if no more tests', async t => {
  const actual = await advancedCameraTest.start.call(CameraResolutionStub);
  t.is(actual, undefined);
});
