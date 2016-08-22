import TestSuite from '../utils/TestSuite';
import VideoFrameChecker from '../utils/VideoFrameChecker';
import WebrtcCall from '../utils/WebrtcCall';
import CameraResolutionTest from './CameraResolutionTest';

export default class AdvancedCameraTest extends TestSuite {
  constructor (options) {
    super(...arguments);
    this.name = 'Advanced Video Test';
    this.tests = [];
    this.promise = new Promise((resolve, reject) => {
      this.deferred = {resolve, reject};
    });
    this.stopOnFailure = true;

    this.addTest(new CameraResolutionTest([[320, 240]], options));
    this.addTest(new CameraResolutionTest([[640, 480]], options));
    this.addTest(new CameraResolutionTest([[1280, 720]], options));
    this.addTest(new CameraResolutionTest([[160, 120], [320, 180], [320, 240], [640, 360], [640, 480], [768, 576],
      [1024, 576], [1280, 720], [1280, 768], [1280, 800], [1920, 1080],
      [1920, 1200], [3840, 2160], [4096, 2160]], options));
  }
  start () {
    super.start().then((results) => {
      return this.deferred.resolve(results);
    }, (err) => {
      return this.deferred.reject(err);
    });
    return this.promise;
  }

  destroy () {
    super.stopAllTests();
  }
}
