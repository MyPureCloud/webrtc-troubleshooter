/* global localMedia */

import { Test } from '../TestSuite';
const localMedia = require('localMedia');
// const Promise = RSVP.Promise;

class AudioTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Audio Test';
  }

  start () {
    super.start();

    this.localMedia = new localMedia({detectSpeakingEvents: true}); // eslint-disable-line
    return new Promise((resolve, reject) => {
      this.reject = reject;
      var volumeCheckFailure = window.setTimeout(() => {
        this.log.push('WARN - no change in mic volume');
        console.log('warn');
        reject('audio timeout');
      }, 5000);
      this.localMedia.start(this.options, (err) => {
        if (err) {
          this.log.push('ERROR - Audio Local media start failed');
          console.log('error');
          reject(err);
        } else {
          this.log.push('SUCCESS - Audio Local media started');
          console.log('succcess');
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
            this.log.push('SUCCESS - Audio stream passed');
            console.log('succcess');
          } else {
            this.log.push('ERROR - Audio stream failed');
            console.log('error');
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
