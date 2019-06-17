import AdvancedCameraTest from '../../src/diagnostics/AdvancedCameraTest';
import CameraResolutionTest from '../../src/diagnostics/CameraResolutionTest';

describe('AdvancedCameraTest', () => {
  it('should be a suite of 14 CameraResolutionTest tests', () => {
    const options = { duration: 30 };
    const advancedCameraTest = new AdvancedCameraTest(options);
    expect(advancedCameraTest).toBeTruthy();
    expect(advancedCameraTest['queue'].length).toBe(14);
    advancedCameraTest['queue'].forEach(cameraTest => {
      expect(cameraTest instanceof CameraResolutionTest).toBe(true);
      expect(cameraTest['options']).toEqual(options);
    });
  });
});
