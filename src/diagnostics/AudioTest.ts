import Test from '../utils/Test';
import LocalMedia from 'localmedia';

const MIC_DETECTION_THRESHOLD: number = -100;

/**
 * Class to test basic audio
 */
export default class AudioTest extends Test {

  private volumeTimeout: number;
  private localMedia: LocalMedia;

  constructor () {
    super(...arguments);
    this.name = 'Audio Test';
    this.volumeTimeout = this.options.volumeTimeout || 5000;
    this.localMedia = new LocalMedia({ detectSpeakingEvents: true });
  }

  /**
   * Start the test
   */
  public start (): Promise<any> {
    super.start(); // tslint:disable-line

    const volumeCheckFailure = window.setTimeout(() => {
      this.logger.error('No change in mic volume');
      return this.reject(new Error('audio timeout'));
    }, this.volumeTimeout);

    const options = Object.assign({}, this.options, { video: false });

    this.localMedia.start(options, (err) => {
      if (err) {
        this.logger.error('Audio Local media start failed');
        return this.reject(err);
      } else {
        this.logger.log('Audio Local media started');
      }
    });

    this.localMedia.on('volumeChange', (volume: number) => {
      if (volume > MIC_DETECTION_THRESHOLD) {
        window.clearTimeout(volumeCheckFailure);
        return this.resolve();
      }
    });

    this.localMedia.on('localStream', (stream: MediaStream) => {
      if (stream.getAudioTracks().length) {
        let audioTrack: MediaStreamTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          this.logger.log('Audio stream passed');
        } else {
          this.logger.error('Audio stream failed');
          return this.reject(new Error('no audio tracks available'));
        }
      }
    });
    return this.promise;
  }

  /**
   * Tear down the test
   */
  public destroy (): void {
    super.destroy();
    this.localMedia.stop();
  }
}
