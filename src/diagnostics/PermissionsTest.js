import Test from '../utils/Test';

const LocalMedia = require('localmedia');

class PermissionsTest extends Test {
  constructor (isCamera, options) {
    super(options);
    this.name = isCamera ? 'Camera Permissions Test' : 'Microphone Permissions Test';
    this.isCamera = isCamera;
    this.localMedia = new LocalMedia();
  }

  start () {
    super.start();

    // use the permissions api if available
    if (navigator.permissions) {
      this.logger.info('querying using the permissions api');

      let promise;
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
      .then((devices) => {
        const relevantDevices = devices.filter((device) => device.kind === (this.isCamera ? 'videoinput' : 'audioinput'));
        if (!relevantDevices.length) {
          this.logger.error('No relevant devices to check for permissions');
          return this.reject(new Error('noDevice'));
        }
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          this.localMedia.start(options, (err, stream) => {
            if (err) {
              let message;
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

  destroy () {
    super.destroy();
    this.localMedia.stop();
  }
}

export default PermissionsTest;
