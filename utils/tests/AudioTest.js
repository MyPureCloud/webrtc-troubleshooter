import { Test } from '../TestSuite';
const LocalMedia = require('localMedia');

class AudioTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Audio Test';
    this.volumeTimeout = this.options.volumeTimeout || 5000;

    this.localMedia = new LocalMedia({detectSpeakingEvents: true});
  }

  start () {
    super.start();

    return new Promise((resolve, reject) => {
      this.reject = reject;
      
      var volumeCheckFailure = window.setTimeout(() => {
        this.logger.error('webrtc-troubleshooter: No change in mic volume');
        reject('audio timeout');
      }, this.volumeTimeout);
      
      this.localMedia.start(this.options, (err) => {
        if (err) {
          this.logger.error('webrtc-troubleshooter: Audio Local media start failed');
          reject(err);
        } else {
          this.logger.log('webrtc-troubleshooter: Audio Local media started');
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
            this.logger.log('webrtc-troubleshooter: Audio stream passed');
          } else {
            this.logger.error('webrtc-troubleshooter: Audio stream failed');
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
