import { Test } from '../TestSuite';
const LocalMedia = require('localMedia');

class VideoTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Video Test';

    this.localMedia = new LocalMedia({detectSpeakingEvents: true});
  }

  start () {
    super.start();

    return new Promise((resolve, reject) => {
      this.reject = reject;

      this.localMedia.start(this.options, (err) => {
        if (err) {
          this.logger.log(`webrtc-troubleshooter: Video Local media start failed ${err.name}`);
          reject(err);
        } else {
          this.logger.log('webrtc-troubleshooter: Video Local media started');
        }
      });

      this.localMedia.on('localStream', (stream) => {
        if (stream.getVideoTracks().length) {
          var videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            this.logger.log('webrtc-troubleshooter: Video stream passed');
            resolve();
          } else {
            this.logger.error('webrtc-troubleshooter: Video stream failed');
            reject('no video track available');
          }
        }
      });
    });
  }

  destroy () {
    super.destroy();
    this.localMedia.stop();
  }
}

export default VideoTest;
