/* global localMedia */

import Ember from 'ember';
import { Test } from '../TestSuite';

const Promise = Ember.RSVP.Promise;

class VideoTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Video Test';
  }
  start () {
    super.start();
    this.localMedia = new localMedia(); // eslint-disable-line
    return new Promise((resolve, reject) => {
      this.reject = reject;
      this.localMedia.start(this.options, (err) => {
        if (err) {
          this.log.push(`Error: Video Local media start failed ${err.name}`);
          reject(err);
        } else {
          this.log.push('Success: Video Local media started');
        }
      });
      this.localMedia.on('localStream', (stream) => {
        if (stream.getVideoTracks().length) {
          var videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            this.log.push('Success: Video stream passed');
            resolve();
          } else {
            this.log.push('Error: Video stream failed');
            reject('no video track available');
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

export default VideoTest;
