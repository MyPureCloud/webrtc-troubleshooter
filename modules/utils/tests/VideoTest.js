/* global localMedia */
import { Test } from '../TestSuite';
const localMedia = require('localMedia');

class VideoTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Video Test';

    this.localMedia = new localMedia({detectSpeakingEvents: true}); // eslint-disable-line
  }
  start () {
    super.start();

    this.log.push('INFO: Video Test');

    return new Promise((resolve, reject) => {
      this.reject = reject;
      this.localMedia.start(this.options, (err) => {
        if (err) {
          this.log.push(`ERROR: Video Local media start failed ${err.name}`);
          reject(err);
        } else {
          this.log.push('SUCCESS: Video Local media started');
        }
      });
      this.localMedia.on('localStream', (stream) => {
        if (stream.getVideoTracks().length) {
          var videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            this.log.push('SUCCESS: Video stream passed');
            resolve();
          } else {
            this.log.push('ERROR: Video stream failed');
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
