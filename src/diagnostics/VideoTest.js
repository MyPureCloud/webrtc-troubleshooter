import Test from '../utils/Test';
const LocalMedia = require('localmedia');

export default class VideoTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Video Test';

    this.localMedia = new LocalMedia({detectSpeakingEvents: true});
  }

  start () {
    super.start();

    this.localMedia.start(this.options, (err) => {
      if (err) {
        this.logger.log(`Video Local media start failed ${err.name}`);
        this.reject(err);
      } else {
        this.logger.log('Video Local media started');
      }
    });

    this.localMedia.on('localStream', (stream) => {
      if (stream.getVideoTracks().length) {
        var videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          this.logger.log('Video stream passed');
          this.resolve();
        } else {
          this.logger.error('Video stream failed');
          this.reject(new Error('no video track available'));
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
