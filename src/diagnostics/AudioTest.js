import Test from '../utils/Test';

const LocalMedia = require('localmedia');
const MIC_DETECTION_THRESHOLD = -100;

class AudioTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Audio Test';
    this.volumeTimeout = this.options.volumeTimeout || 5000;

    this.localMedia = new LocalMedia({ detectSpeakingEvents: true });
  }

  start () {
    super.start();

    const volumeCheckFailure = window.setTimeout(() => {
      this.logger.error('No change in mic volume');
      this.reject(new Error('audio timeout'));
    }, this.volumeTimeout);

    const options = Object.assign({}, this.options, { video: false });

    this.localMedia.start(options, (err) => {
      if (err) {
        this.logger.error('Audio Local media start failed');
        this.reject(err);
      } else {
        this.logger.log('Audio Local media started');
      }
    });

    this.localMedia.on('volumeChange', (volume) => {
      if (volume > MIC_DETECTION_THRESHOLD) {
        window.clearTimeout(volumeCheckFailure);
        this.resolve();
      }
    });

    this.localMedia.on('localStream', (stream) => {
      if (stream.getAudioTracks().length) {
        var audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          this.logger.log('Audio stream passed');
        } else {
          this.logger.error('Audio stream failed');
          this.reject(new Error('no audio tracks available'));
        }
      }
    });
    return this.promise;
  }

  destroy () {
    super.destroy();
    this.localMedia.stop();
  }
}

export default AudioTest;
