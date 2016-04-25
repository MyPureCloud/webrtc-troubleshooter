/* global localMedia */

import { Test } from '../TestSuite';
// const Promise = RSVP.Promise;

class AudioTest extends Test {
  constructor () {
    super(...arguments);
    name = 'Audio Test';
  }
  start () {
    super.start();
    localMedia = new localMedia({detectSpeakingEvents: true}); // eslint-disable-line
    return new Promise((resolve, reject) => {
      reject = reject;
      var volumeCheckFailure = window.setTimeout(() => {
        log.push('warn: no change in mic volume');
        reject('audio timeout');
      }, 5000);
      localMedia.start(options, (err) => {
        if (err) {
          log.push('Error: Audio Local media start failed');
          reject(err);
        } else {
          log.push('Success: Audio Local media started');
        }
      });
      localMedia.on('volumeChange', () => {
        window.clearTimeout(volumeCheckFailure);
        resolve();
      });
      localMedia.on('localStream', (stream) => {
        if (stream.getAudioTracks().length) {
          var audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            log.push('Success: Audio stream passed');
          } else {
            log.push('Error: Audio stream failed');
            reject('no audio tracks available');
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

export default AudioTest;
