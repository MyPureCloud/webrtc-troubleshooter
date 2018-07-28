import test from 'ava';

import AdvancedCameraTest from '../../src/diagnostics/AdvancedCameraTest';
import CameraResolutionTest from '../../src/diagnostics/CameraResolutionTest';

test('AdvancedCameraTest is a suite of 14 CameraResolutionTest tests', t => {
  const options = { duration: 30 };
  const advancedCameraTest = new AdvancedCameraTest(options);
  t.is(advancedCameraTest.queue.length, 14);
  advancedCameraTest.queue.forEach(cameraTest => {
    t.is(cameraTest instanceof CameraResolutionTest, true);
    t.is(cameraTest.options, options);
  });
});
