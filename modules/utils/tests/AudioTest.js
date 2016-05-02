/* global localMedia */

import { Test } from '../TestSuite';
const localMedia = require('localMedia');

class AudioTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Audio Test';

    this.localMedia = new localMedia({detectSpeakingEvents: true}); // eslint-disable-line
  }

  start () {
    super.start();

    this.log.push('INFO: Audio Test starting');

    return new Promise((resolve, reject) => {
      this.reject = reject;
      var volumeCheckFailure = window.setTimeout(() => {
        this.log.push('WARN: no change in mic volume');
        reject('audio timeout');
      }, 5000);
      this.localMedia.start(this.options, (err) => {
        if (err) {
          this.log.push('ERROR: Audio Local media start failed');
          reject(err);
        } else {
          this.log.push('SUCCESS: Audio Local media started');
        }
      });
      this.localMedia.on('volumeChange', () => {
        window.clearTimeout(volumeCheckFailure);
        resolve();
      });
      this.localMedia.on('localStream', (stream) => {
        if (stream.getAudioTracks().length) {
          var audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            this.log.push('SUCCESS: Audio stream passed');
          } else {
            this.log.push('ERROR: Audio stream failed');
            reject('no audio tracks available');
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

export default AudioTest;
