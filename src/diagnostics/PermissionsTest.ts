import Test from '../utils/Test';

import LocalMedia from 'localmedia';
import { ObjectLiteral } from '../types/interfaces';

// this is necessary to get the code to compile
// since permissions isn't spec yet
declare var navigator: {
  permissions: {
    query: (options: ObjectLiteral) => Promise<any>
  }
} & Navigator;

/**
 * Class to test camera or microphone permissions
 */
export default class PermissionsTest extends Test {

  private isCamera: boolean;
  private localMedia: LocalMedia;

  constructor (isCamera: boolean, options?: ObjectLiteral) {
    super(options);
    this.name = isCamera ? 'Camera Permissions Test' : 'Microphone Permissions Test';
    this.isCamera = isCamera;
    this.localMedia = new LocalMedia();
  }

  /**
   * Start running the test
   */
  public start (): Promise<any> {
    super.start(); // tslint:disable-line

    // use the permissions api if available
    if (navigator.permissions) {
      this.logger.info('querying using the permissions api');

      let promise: Promise<any>;
      if (this.isCamera) {
        this.logger.info('checking camera permissions');
        promise = navigator.permissions.query({ name: 'camera' });
      } else {
        this.logger.info('checking microphone permissions');
        promise = navigator.permissions.query({ name: 'microphone' });
      }

      return promise.then((result) => {
        if (result.state === 'denied') {
          const message = 'Device permissions denied';
          const error = new Error(message);
          this.logger.error(message);
          return this.reject(error);
        }

        return this.resolve(result);
      });
    }

    this.logger.info('no permissions api, trying to get media to check permissions');
    const options = {
      video: this.isCamera,
      audio: !this.isCamera
    };

    return navigator.mediaDevices.enumerateDevices()
      .then((devices: MediaDeviceInfo[]) => {
        const relevantDevices = devices.filter((device: MediaDeviceInfo) => device.kind === (this.isCamera ? 'videoinput' : 'audioinput'));
        if (!relevantDevices.length) {
          this.logger.error('No relevant devices to check for permissions');
          return this.reject(new Error('noDevice'));
        }
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          this.localMedia.start(options, (err, stream) => {
            if (err) {
              let message: string;
              if (err.name === 'NotAllowedError') {
                message = 'noDevicePermissions';
              } else {
                message = 'Failed to start media';
              }

              const error = new Error(message);
              this.logger.error(err);
              return reject(error);
            }

            stream.getTracks().forEach((track) => track.stop());
            return resolve();
          });
        }).then(this.resolve.bind(this), this.reject.bind(this));
      });
  }

  /**
   * Tear down the test
   */
  public destroy (): void {
    super.destroy();
    this.localMedia.stop();
  }
}
