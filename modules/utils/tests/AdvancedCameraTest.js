/* global attachMediaStream, _ */

import { Test } from '../TestSuite';
import VideoFrameChecker from '../VideoFrameChecker';
import WebrtcCall from '../WebrtcCall';

const $ = require('jQuery');

class AdvancedCameraTest extends Test {
  constructor () {
    super(...arguments);
    name = 'Video Test';
    tests = [];

    // default tests
    tests.push(new CameraResolutionTest([[320, 240]]));
    tests.push(new CameraResolutionTest([[640, 480]]));
    tests.push(new CameraResolutionTest([[1280, 720]]));
    tests.push(new CameraResolutionTest([[160, 120], [320, 180], [320, 240], [640, 360], [640, 480], [768, 576],
      [1024, 576], [1280, 720], [1280, 768], [1280, 800], [1920, 1080],
      [1920, 1200], [3840, 2160], [4096, 2160]]));
  }
  start () {
    super.start();

    defer = new $.Deferred();
    runNextTest();

    return defer.promise;
  }
  runNextTest (testNum = 0) {
    if (testNum >= tests.length) {
      return defer.resolve(log);
    }

    tests[testNum].run((results) => {
      log.push(results);
      runNextTest(++testNum);
    });
  }
  destroy () {
    super.destroy();
  }
}

// adapted from https://github.com/webrtc/testrtc

class CameraResolutionTest {
  constructor (resolutions, duration = 8000) {
    resolutions = resolutions;
    duration = duration;
    log = [];
    currentResolution = 0;
    isMuted = false;
    isShuttingDown = false;
  }
  run (cb) {
    cb = cb || function () {};
    const settings = {
      resolutions: resolutions,
      duration: duration
    };
    log.push(`Starting camera test with settings: ${JSON.stringify(settings)}`);
    startGetUserMedia(resolutions[currentResolution]);
  }
  done () {
    const results = {
      log: log,
      stats: stats,
      resolutions: resolutions,
      duration: duration
    };
    cb(results);
  }
  reportSuccess (str) {
    log.push(`SUCCESS: ${str}`);
  }
  reportError (str) {
    log.push(`ERROR: ${str}`);
  }
  reportInfo (str) {
    log.push(`INFO: ${str}`);
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
      if (resolutions.length > 1) {
        reportSuccess('Supported: ' + resolution[0] + 'x' + resolution[1]);
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        maybeContinueGetUserMedia();
      } else {
        collectAndAnalyzeStats_(stream, resolution);
      }
    }).catch((error) => {
      if (resolutions.length > 1) {
        reportInfo(resolution[0] + 'x' + resolution[1] + ' not supported');
      } else {
        reportError('getUserMedia failed with error: ' + error);
      }
      maybeContinueGetUserMedia();
    });
  }
  maybeContinueGetUserMedia () {
    if (currentResolution === resolutions.length) {
      return done();
    }
    startGetUserMedia(resolutions[currentResolution++]);
  }
  collectAndAnalyzeStats_ (stream, resolution) {
    const tracks = stream.getVideoTracks();
    if (tracks.length < 1) {
      reportError('No video track in returned stream.');
      maybeContinueGetUserMedia();
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
        if (isShuttingDown) {
          return;
        }
        reportError('Video track ended, camera stopped working');
      });
      videoTrack.addEventListener('mute', () => {
        // Ignore events when shutting down the test.
        if (isShuttingDown) {
          return;
        }
        reportError('Your camera reported itself as muted.');
        // MediaStreamTrack.muted property is not wired up in Chrome yet,
        // checking isMuted local state.
        isMuted = true;
      });
      videoTrack.addEventListener('unmute', () => {
        // Ignore events when shutting down the test.
        if (isShuttingDown) {
          return;
        }
        reportInfo('Your camera reported itself as unmuted.');
        isMuted = false;
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
    call.gatherStats(call.pc1, onCallEnded_.bind(this, resolution, video, stream, frameChecker), 100);
    run.later(this, endCall_, call, stream, 8000);
  }
  onCallEnded_ (resolution, videoElement, stream, frameChecker, stats, statsTime) {
    analyzeStats_(resolution, videoElement, stream, frameChecker, stats, statsTime);

    frameChecker.stop();

    done();
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
    statsReport.encodeSetupTimeMs = extractEncoderSetupTime_(stats, statsTime);
    statsReport.avgEncodeTimeMs = arrayAverage(googAvgEncodeTime);
    statsReport.minEncodeTimeMs = _.min(googAvgEncodeTime);
    statsReport.maxEncodeTimeMs = _.max(googAvgEncodeTime);
    statsReport.avgInputFps = arrayAverage(googAvgFrameRateInput);
    statsReport.minInputFps = _.min(googAvgFrameRateInput);
    statsReport.maxInputFps = _.max(googAvgFrameRateInput);
    statsReport.avgSentFps = arrayAverage(googAvgFrameRateSent);
    statsReport.minSentFps = _.min(googAvgFrameRateSent);
    statsReport.maxSentFps = _.max(googAvgFrameRateSent);
    statsReport.isMuted = isMuted;
    statsReport.testedFrames = frameStats.numFrames;
    statsReport.blackFrames = frameStats.numBlackFrames;
    statsReport.frozenFrames = frameStats.numFrozenFrames;

    testExpectations_(statsReport);
    stats = statsReport;
  }
  endCall_ (callObject, stream) {
    isShuttingDown = true;
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
      reportInfo('Not available: ' + notAvailableStats.join(', '));
    }

    if (isNaN(report.avgSentFps)) {
      reportInfo('Cannot verify sent FPS.');
    } else if (report.avgSentFps < 5) {
      reportError('Low average sent FPS: ' + report.avgSentFps);
    } else {
      reportSuccess('Average FPS above threshold');
    }

    if (!resolutionMatchesIndependentOfRotationOrCrop_(
        report.actualVideoWidth, report.actualVideoHeight, report.mandatoryWidth,
        report.mandatoryHeight)) {
      reportError('Incorrect captured resolution.');
    } else {
      reportSuccess('Captured video using expected resolution.');
    }

    if (report.testedFrames === 0) {
      reportError('Could not analyze any video frame.');
    } else {
      if (report.blackFrames > report.testedFrames / 3) {
        reportError('Camera delivering lots of black frames.');
      }
      if (report.frozenFrames > report.testedFrames / 3) {
        reportError('Camera delivering lots of frozen frames.');
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
