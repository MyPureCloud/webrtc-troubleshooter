import Test from '../utils/Test';
import localMedia from 'localMedia';

export default class AudioTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Audio Test';
    this.volumeTimeout = this.options.volumeTimeout || 5000;

    this.localMedia = new localMedia({detectSpeakingEvents: true});
  }

  start () {
    super.start();

    const volumeCheckFailure = window.setTimeout(() => {
      this.logger.error('No change in mic volume');
      this.reject(new Error('audio timeout'));
    }, this.volumeTimeout);

    this.localMedia.start(this.options, (err) => {
      if (err) {
        this.logger.error('Audio Local media start failed');
        this.reject(err);
      } else {
        this.logger.log('Audio Local media started');
      }
    });

    this.localMedia.on('volumeChange', () => {
      window.clearTimeout(volumeCheckFailure);
      this.resolve();
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
    return this.deferred.promise;
  }

  destroy () {
    super.destroy();
    this.localMedia.stop();
  }
}
