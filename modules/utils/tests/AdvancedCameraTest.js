import { Test } from '../TestSuite';
import VideoFrameChecker from '../VideoFrameChecker';
import WebrtcCall from '../WebrtcCall';

var attachMediaStream = require('attachmediastream');

class AdvancedCameraTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Advanced Video Test';
    this.tests = [];

    this.tests.push(new CameraResolutionTest([[320, 240]]));
    this.tests.push(new CameraResolutionTest([[640, 480]]));
    this.tests.push(new CameraResolutionTest([[1280, 720]]));
    this.tests.push(new CameraResolutionTest([[160, 120], [320, 180], [320, 240], [640, 360], [640, 480], [768, 576],
      [1024, 576], [1280, 720], [1280, 768], [1280, 800], [1920, 1080],
      [1920, 1200], [3840, 2160], [4096, 2160]]));
  }
  start () {
    super.start();

    return new Promise((resolve, reject) => {
      this.reject = reject;
      var testNum = 0;

      while (testNum < this.tests.length) {
        this.tests[testNum].run((results) => {
          this.log.push(results.log);
          this.log.push(results.stats);
          if (testNum == this.tests.length) {
            resolve(this.log);
          }
        });
        testNum++;
      }
    });
  }

  destroy () {
    super.destroy();
  }
}

// adapted from https://github.com/webrtc/testrtc

class CameraResolutionTest {
  constructor (resolutions, duration = 8000) {
    this.resolutions = resolutions;
    this.duration = duration;
    this.log = [];
    this.currentResolution = 0;
    this.isMuted = false;
    this.isShuttingDown = false;
  }
  run (cb) {
    this.cb = cb || function () {};
    const settings = {
      resolutions: this.resolutions,
      duration: this.duration
    };
    this.log.push(`Advanced Camera Test with resolutions: ${JSON.stringify(settings.resolutions)} and duration ${JSON.stringify(settings.duration)}`);
    this.startGetUserMedia(this.resolutions[this.currentResolution]);
  }
  done () {
    const results = {
      log: this.log,
      stats: this.stats,
      resolutions: this.resolutions,
      duration: this.duration
    };
    this.cb(results);
  }
  reportSuccess (str) {
    this.log.push(`SUCCESS: ${str}`);
  }
  reportError (str) {
    this.log.push(`ERROR: ${str}`);
  }
  reportInfo (str) {
    this.log.push(`INFO: ${str}`);
  }
  startGetUserMedia (resolution) {
    const constraints = {
      audio: false,
      video: {
        width: {exact: resolution[0]},
        height: {exact: resolution[1]}
      }
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      // Do not check actual video frames when more than one resolution is provided.
      if (this.resolutions.length > 1) {
        this.reportSuccess('Supported: ' + resolution[0] + 'x' + resolution[1]);
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        this.maybeContinueGetUserMedia();
      } else {
        this.collectAndAnalyzeStats_(stream, resolution);
      }
    }).catch((error) => {
      if (this.resolutions.length > 1) {
        this.reportInfo(resolution[0] + 'x' + resolution[1] + ' not supported');
      } else {
        this.reportError('getUserMedia failed with error: ' + error);
      }
      this.maybeContinueGetUserMedia();
    });
  }
  maybeContinueGetUserMedia () {
    if (this.currentResolution === this.resolutions.length) {
      return this.done();
    }
    this.startGetUserMedia(this.resolutions[this.currentResolution++]);
  }
  collectAndAnalyzeStats_ (stream, resolution) {
    const tracks = stream.getVideoTracks();
    if (tracks.length < 1) {
      this.reportError('No video track in returned stream.');
      this.maybeContinueGetUserMedia();
      return;
    }

    // Firefox does not support event handlers on mediaStreamTrack yet.
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack
    // TODO: remove if (...) when event handlers are supported by Firefox.
    const videoTrack = tracks[0];
    if (typeof videoTrack.addEventListener === 'function') {
      // Register events.
      videoTrack.addEventListener('ended', () => {
        // Ignore events when shutting down the
        if (this.isShuttingDown) {
          return;
        }
        this.reportError('Video track ended, camera stopped working');
      });
      videoTrack.addEventListener('mute', () => {
        // Ignore events when shutting down the test.
        if (this.isShuttingDown) {
          return;
        }
        this.reportError('Your camera reported itself as muted.');
        // MediaStreamTrack.muted property is not wired up in Chrome yet,
        // checking isMuted local state.
        this.isMuted = true;
      });
      videoTrack.addEventListener('unmute', () => {
        // Ignore events when shutting down the test.
        if (this.isShuttingDown) {
          return;
        }
        this.reportInfo('Your camera reported itself as unmuted.');
        this.isMuted = false;
      });
    }

    const video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.width = resolution[0];
    video.height = resolution[1];
    attachMediaStream(stream, video);
    const frameChecker = new VideoFrameChecker(video);
    const call = new WebrtcCall();
    call.pc1.addStream(stream);
    call.establishConnection();
    call.gatherStats(call.pc1, this.onCallEnded_.bind(this, resolution, video, stream, frameChecker), 100);
    setTimeout(this.endCall_(call, stream), 8000);
  }
  onCallEnded_ (resolution, videoElement, stream, frameChecker, stats, statsTime) {
    this.analyzeStats_(resolution, videoElement, stream, frameChecker, stats, statsTime);

    frameChecker.stop();

    this.done();
  }
  analyzeStats_ (resolution, videoElement, stream, frameChecker, stats, statsTime) {
    const googAvgEncodeTime = [];
    const googAvgFrameRateInput = [];
    const googAvgFrameRateSent = [];
    const statsReport = {};
    const frameStats = frameChecker.frameStats;

    for (let index = 0; index < stats.length - 1; index++) {
      if (stats[index].type === 'ssrc') {
        // Make sure to only capture stats after the encoder is setup.
        if (stats[index].stat('googFrameRateInput') > 0) {
          googAvgEncodeTime.push(
            parseInt(stats[index].stat('googAvgEncodeMs'), 10));
          googAvgFrameRateInput.push(
            parseInt(stats[index].stat('googFrameRateInput'), 10));
          googAvgFrameRateSent.push(
            parseInt(stats[index].stat('googFrameRateSent'), 10));
        }
      }
    }

    statsReport.cameraName = stream.getVideoTracks()[0].label || NaN;
    statsReport.actualVideoWidth = videoElement.videoWidth;
    statsReport.actualVideoHeight = videoElement.videoHeight;
    statsReport.mandatoryWidth = resolution[0];
    statsReport.mandatoryHeight = resolution[1];
    statsReport.encodeSetupTimeMs = this.extractEncoderSetupTime_(stats, statsTime);
    statsReport.avgEncodeTimeMs = this.arrayAverage(googAvgEncodeTime);
    statsReport.minEncodeTimeMs = _.min(googAvgEncodeTime);
    statsReport.maxEncodeTimeMs = _.max(googAvgEncodeTime);
    statsReport.avgInputFps = this.arrayAverage(googAvgFrameRateInput);
    statsReport.minInputFps = _.min(googAvgFrameRateInput);
    statsReport.maxInputFps = _.max(googAvgFrameRateInput);
    statsReport.avgSentFps = this.arrayAverage(googAvgFrameRateSent);
    statsReport.minSentFps = _.min(googAvgFrameRateSent);
    statsReport.maxSentFps = _.max(googAvgFrameRateSent);
    statsReport.isMuted = this.isMuted;
    statsReport.testedFrames = frameStats.numFrames;
    statsReport.blackFrames = frameStats.numBlackFrames;
    statsReport.frozenFrames = frameStats.numFrozenFrames;

    this.testExpectations_(statsReport);
    this.stats = statsReport;
  }
  endCall_ (callObject, stream) {
    this.isShuttingDown = true;
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    callObject.close();
  }
  extractEncoderSetupTime_ (stats, statsTime) {
    for (let index = 0; index !== stats.length; index++) {
      if (stats[index].type === 'ssrc') {
        if (stats[index].stat('googFrameRateInput') > 0) {
          return JSON.stringify(statsTime[index] - statsTime[0]);
        }
      }
    }
    return NaN;
  }
  resolutionMatchesIndependentOfRotationOrCrop_ (aWidth, aHeight, bWidth, bHeight) {
    const minRes = Math.min(bWidth, bHeight);
    return (aWidth === bWidth && aHeight === bHeight) ||
    (aWidth === bHeight && aHeight === bWidth) ||
    (aWidth === minRes && bHeight === minRes);
  }
  testExpectations_ (report) {
    const notAvailableStats = [];

    _.forEach(report, (value, key) => {
      if (typeof value === 'number' && isNaN(value)) {
        notAvailableStats.push(key);
      }
    });

    if (notAvailableStats.length !== 0) {
      report.notAvailableStatus = notAvailableStats;
      this.reportInfo('Not available: ' + notAvailableStats.join(', '));
    }
    if (isNaN(report.avgSentFps)) {
      this.reportInfo('Cannot verify sent FPS.');
    } else if (report.avgSentFps < 5) {
      this.reportError('Low average sent FPS: ' + report.avgSentFps);
    } else {
      this.reportSuccess('Average FPS above threshold');
    }

    if (!this.resolutionMatchesIndependentOfRotationOrCrop_(
        report.actualVideoWidth, report.actualVideoHeight, report.mandatoryWidth,
        report.mandatoryHeight)) {
      this.reportError('Incorrect captured resolution.');
    } else {
      this.reportSuccess('Captured video using expected resolution.');
    }

    if (report.testedFrames === 0) {
      this.reportError('Could not analyze any video frame.');
    } else {
      if (report.blackFrames > report.testedFrames / 3) {
        this.reportError('Camera delivering lots of black frames.');
      }
      if (report.frozenFrames > report.testedFrames / 3) {
        this.reportError('Camera delivering lots of frozen frames.');
      }
    }
  }
  arrayAverage (array) {
    const cnt = array.length;
    let tot = 0;
    for (let i = 0; i < cnt; i++) {
      tot += array[i];
    }
    return Math.floor(tot / cnt);
  }
}

export default AdvancedCameraTest;
