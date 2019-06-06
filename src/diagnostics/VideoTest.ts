import Test from '../utils/Test';
const LocalMedia = require('localmedia');

export default class VideoTest extends Test {

  public name: string;
  private localMedia: any;

  constructor () {
    super(...arguments);
    this.name = 'Video Test';

    this.localMedia = new LocalMedia({ detectSpeakingEvents: true });
  }

  start () {
    super.start();

    const options = Object.assign({}, this.options, { audio: false });
    this.localMedia.start(options, (err: any) => {
      if (err) {
        this.logger.log(`Video Local media start failed ${err.name}`);
        return this.reject(err);
      } else {
        this.logger.log('Video Local media started');
      }
    });

    this.localMedia.on('localStream', (stream: any) => {
      if (stream.getVideoTracks().length) {
        this.localMedia.stop();
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          this.logger.log('Video stream passed');
          return this.resolve();
        } else {
          this.logger.error('Video stream failed');
          return this.reject(new Error('no video track available'));
        }
      }
    });
    return this.promise;
  }

  destroy () {
    super.destroy();
  }
}
