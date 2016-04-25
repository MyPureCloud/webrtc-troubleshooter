/* global localMedia */
import { Test } from '../TestSuite';

class VideoTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Video Test';
  }
  start () {
    super.start();
    localMedia = new localMedia(); // eslint-disable-line
    return new Promise((resolve, reject) => {
      reject = reject;
      localMedia.start(options, (err) => {
        if (err) {
          log.push(`Error: Video Local media start failed ${err.name}`);
          reject(err);
        } else {
          log.push('Success: Video Local media started');
        }
      });
      localMedia.on('localStream', (stream) => {
        if (stream.getVideoTracks().length) {
          var videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            log.push('Success: Video stream passed');
            resolve();
          } else {
            log.push('Error: Video stream failed');
            reject('no video track available');
          }
        }
      });
    });
  }
  destroy () {
    super.destroy();
    localMedia.stop();
  }
}

export default VideoTest;
