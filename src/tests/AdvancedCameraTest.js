import Test from '../utils/Test';
import VideoFrameChecker from '../utils/VideoFrameChecker';
import WebrtcCall from '../utils/WebrtcCall';
import CameraResolutionTest from '../utils/CameraResolutionTest';

export default class AdvancedCameraTest extends Test {
  constructor (options) {
    super(...arguments);
    this.name = 'Advanced Video Test';
    this.tests = [];

    this.tests.push(new CameraResolutionTest([[320, 240]], options));
    this.tests.push(new CameraResolutionTest([[640, 480]], options));
    this.tests.push(new CameraResolutionTest([[1280, 720]], options));
    this.tests.push(new CameraResolutionTest([[160, 120], [320, 180], [320, 240], [640, 360], [640, 480], [768, 576],
      [1024, 576], [1280, 720], [1280, 768], [1280, 800], [1920, 1080],
      [1920, 1200], [3840, 2160], [4096, 2160]], options));
  }
  start () {
    super.start();
    const testResults = this.tests.map((test) => test.run());
    return Promise.all(testResults).then(this.resolve.bind(this), this.reject.bind(this));
  }

  destroy () {
    super.destroy();
  }
}
