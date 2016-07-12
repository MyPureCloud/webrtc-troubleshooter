// adapted from https://github.com/webrtc/testrtc

// This test is "special"

import VideoFrameChecker from './VideoFrameChecker';
import WebrtcCall from './WebrtcCall';

export default class CameraResolutionTest {
  constructor (resolutions, options) {
    this.resolutions = resolutions;
    this.duration = options.duration;
    this.logger = options && options.logger ? options.logger : console;
    this.log = [];
    this.currentResolution = 0;
    this.isMuted = false;
    this.isShuttingDown = false;
  }

  run () {
    const settings = {
      resolutions: this.resolutions,
      duration: this.duration
    };
    this.logger.log(`Advanced Camera Test with resolutions: ${JSON.stringify(settings.resolutions)} and duration ${JSON.stringify(settings.duration)}`);
    return this.startGetUserMedia(this.resolutions[this.currentResolution]);
  }

  getResults () {
    const results = {
      log: this.log,
      stats: this.stats,
      resolutions: this.resolutions,
      duration: this.duration
    };
    return results;
  }

  reportSuccess (str) {
    this.logger.log(`SUCCESS: ${str}`);
  }

  reportError (str) {
    this.logger.warn(`${str}`);
  }

  reportInfo (str) {
    this.logger.info(`${str}`);
  }

  startGetUserMedia (resolution) {
    const constraints = {
      audio: false,
      video: {
        width: { exact: resolution[0] },
        height: { exact: resolution[1] }
      }
    };

    return navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      // Do not check actual video frames when more than one resolution is provided.
      if (this.resolutions.length > 1) {
        this.reportSuccess('Supported: ' + resolution[0] + 'x' + resolution[1]);
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return this.maybeContinueGetUserMedia();
      } else {
        this.logger.log('collecting');
        return this.collectAndAnalyzeStats(stream, resolution);
      }
    }, (error) => {
      if (this.resolutions.length > 1) {
        this.reportInfo(resolution[0] + 'x' + resolution[1] + ' not supported');
      } else {
        this.reportError('getUserMedia failed with error: ' + error);
      }
      return this.maybeContinueGetUserMedia();
    });
  }

  maybeContinueGetUserMedia () {
    if (this.currentResolution === this.resolutions.length) {
      return this.getResults();
    }
    return this.startGetUserMedia(this.resolutions[this.currentResolution++]);
  }

  collectAndAnalyzeStats (stream, resolution) {
    const tracks = stream.getVideoTracks();
    if (tracks.length < 1) {
      this.reportError('No video track in returned stream.');
      return this.maybeContinueGetUserMedia();
    }

    // Firefox does not support event handlers on mediaStreamTrack yet.
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack
    // TODO: remove if (...) when event handlers are supported by Firefox.
    const videoTrack = tracks[0];
    if (typeof videoTrack.addEventListener === 'function') {
      // Register events.
      videoTrack.addEventListener('ended', () => {
        // Ignore events when shutting down the test.
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

    const videoElement = document.createElement('video');
    videoElement.setAttribute('autoplay', '');
    videoElement.setAttribute('muted', '');
    videoElement.width = resolution[0];
    videoElement.height = resolution[1];
    videoElement.srcObject = stream;
    const frameChecker = new VideoFrameChecker(videoElement);
    const call = new WebrtcCall();
    call.pc1.addStream(stream);

    setTimeout(this.endCall.bind(this, call, stream), 8000);

    return call.establishConnection().then(() => {
      return call.gatherStats(call.pc1, 100);
    }).then(({stats, statsCollectTime}) => {
      const result = this.analyzeStats({resolution, videoElement, stream, frameChecker, stats, statsCollectTime});
      frameChecker.stop();
      return result;
    });
  }

  analyzeStats ({resolution, videoElement, stream, frameChecker, stats, statsCollectTime}) {
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
    statsReport.encodeSetupTimeMs = this.extractEncoderSetupTime(stats, statsCollectTime);
    statsReport.avgEncodeTimeMs = this.arrayAverage(googAvgEncodeTime);
    statsReport.minEncodeTimeMs = Math.min(...googAvgEncodeTime);
    statsReport.maxEncodeTimeMs = Math.max(...googAvgEncodeTime);
    statsReport.avgInputFps = this.arrayAverage(googAvgFrameRateInput);
    statsReport.minInputFps = Math.min(...googAvgFrameRateInput);
    statsReport.maxInputFps = Math.max(...googAvgFrameRateInput);
    statsReport.avgSentFps = this.arrayAverage(googAvgFrameRateSent);
    statsReport.minSentFps = Math.min(...googAvgFrameRateSent);
    statsReport.maxSentFps = Math.max(...googAvgFrameRateSent);
    statsReport.isMuted = this.isMuted;
    statsReport.testedFrames = frameStats.numFrames;
    statsReport.blackFrames = frameStats.numBlackFrames;
    statsReport.frozenFrames = frameStats.numFrozenFrames;

    this.testExpectations(statsReport);
    return statsReport;
  }

  endCall (callObject, stream) {
    this.isShuttingDown = true;
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    callObject.close();
  }

  extractEncoderSetupTime (stats, statsCollectTime) {
    for (let index = 0; index !== stats.length; index++) {
      if (stats[index].type === 'ssrc') {
        if (stats[index].stat('googFrameRateInput') > 0) {
          return JSON.stringify(statsCollectTime[index] - statsCollectTime[0]);
        }
      }
    }
    return NaN;
  }

  resolutionMatchesIndependentOfRotationOrCrop (aWidth, aHeight, bWidth, bHeight) {
    const minRes = Math.min(bWidth, bHeight);
    return (aWidth === bWidth && aHeight === bHeight) ||
    (aWidth === bHeight && aHeight === bWidth) ||
    (aWidth === minRes && bHeight === minRes);
  }

  testExpectations (report) {
    const notAvailableStats = [];

    for (let key in report) {
      if (typeof report[key] === 'number' && isNaN(report[key])) {
        notAvailableStats.push(key);
      }
    }

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

    if (!this.resolutionMatchesIndependentOfRotationOrCrop(
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
