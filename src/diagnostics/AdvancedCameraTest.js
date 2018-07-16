import TestSuite from '../utils/TestSuite';
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

    this.addTest(new CameraResolutionTest([[160, 120]], options));
    this.addTest(new CameraResolutionTest([[320, 180]], options));
    this.addTest(new CameraResolutionTest([[320, 240]], options));
    this.addTest(new CameraResolutionTest([[640, 360]], options));
    this.addTest(new CameraResolutionTest([[640, 480]], options));
    this.addTest(new CameraResolutionTest([[768, 576]], options));
    this.addTest(new CameraResolutionTest([[1024, 576]], options));
    this.addTest(new CameraResolutionTest([[1280, 720]], options));
    this.addTest(new CameraResolutionTest([[1280, 768]], options));
    this.addTest(new CameraResolutionTest([[1280, 800]], options));
    this.addTest(new CameraResolutionTest([[1920, 1080]], options));
    this.addTest(new CameraResolutionTest([[1920, 1200]], options));
    this.addTest(new CameraResolutionTest([[3840, 2160]], options));
    this.addTest(new CameraResolutionTest([[4096, 2160]], options));
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
