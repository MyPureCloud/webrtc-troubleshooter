import TestSuite from '../utils/TestSuite';
import { CameraResolutionTest, CameraResolutionTestResults } from './CameraResolutionTest';
import { ObjectLiteral } from '../types/interfaces';

/**
 * Class to test various camera resolutions
 */
export default class AdvancedCameraTest extends TestSuite {

  /**
   * Name of the test
   */
  public name: string;

  private promise: Promise<any>;
  private deferred: { resolve: (...args: any[]) => void, reject: (...args: any[]) => void };

  constructor (options: ObjectLiteral) {
    super(...arguments);
    this.name = 'Advanced Video Test';

    this.promise = new Promise((resolve, reject) => {
      this.deferred = { resolve, reject };
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

  /**
   * Start the test
   */
  public start (): Promise<CameraResolutionTestResults> {
    super.start().then((results) => {
      return this.deferred.resolve(results);
    }, (err) => {
      return this.deferred.reject(err);
    });
    return this.promise;
  }

  /**
   * Tear down the test
   */
  public destroy (): void {
    super.stopAllTests();
  }
}
