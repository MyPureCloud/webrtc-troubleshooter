// adapted from https://github.com/webrtc/testrtc

// This test is "special"

import VideoFrameChecker from '../utils/VideoFrameChecker';
import WebrtcCall from '../utils/WebrtcCall';
import Test from '../utils/Test';
import { ObjectLiteral } from '../types/interfaces';

/**
 * Class to test camera resolution
 */
export default class CameraResolutionTest extends Test {

  private resolutions: number[][];
  private duration: number;
  private log: any[];
  private currentResolution: number;
  private isMuted: boolean;
  private isShuttingDown: boolean;
  private hasError: boolean;

  private stats: RTCStatsReport[];

  constructor (resolutions: number[][], options?: ObjectLiteral) {
    super(options);
    this.name = `Camera resolution test ${JSON.stringify(resolutions)}`;
    this.resolutions = resolutions;
    this.duration = options && options.duration ? options.duration : 0;
    this.logger = options && options.logger ? options.logger : console;
    this.log = [];
    this.currentResolution = 0;
    this.isMuted = false;
    this.isShuttingDown = false;
  }

  /**
   * Start the test
   */
  public start (): Promise<any> {
    super.start(); //tslint:disable-line
    const settings = {
      resolutions: this.resolutions,
      duration: this.duration
    };
    this.logger.log(`Advanced Camera Test with resolutions: ${JSON.stringify(settings.resolutions)} and duration ${JSON.stringify(settings.duration)}`);
    return this.startGetUserMedia(this.resolutions[this.currentResolution]).then(() => {
      if (!this.hasError) {
        return this.resolve(this.getResults());
      } else {
        const err = new Error('Camera resolution check failed');
        err['details'] = this.getResults();
        return this.reject(err);
      }
    }, (err) => {
      err.details = this.getResults();
      return this.reject(err);
    });
  }

  /**
   * Get the current results
   */
  private getResults (): { log: string[], stats: unknown, resolutions: number[][], duration: number } {
    return {
      log: this.log,
      stats: this.stats,
      resolutions: this.resolutions,
      duration: this.duration
    };
  }

  /**
   * Push a success into the log and log it as `log`
   * @param str message to log
   */
  private reportSuccess (str: string): void {
    this.log.push(str);
    this.logger.log(`SUCCESS: ${str}`);
  }

  /**
   * Push an error into the log and log it as `warn`
   * @param str message to log
   */
  private reportError (str: string): void {
    this.hasError = true;
    this.log.push(str);
    this.logger.warn(`${str}`);
  }

  /**
   * Log message as `info`
   * @param str message to log
   */
  private reportInfo (str: string): void {
    this.logger.info(`${str}`);
  }

  /**
   * Start collecting userMedia
   */
  private startGetUserMedia (resolution): Promise<any> {
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        width: { exact: resolution[0] },
        height: { exact: resolution[1] }
      }
    };

    return navigator.mediaDevices.getUserMedia(constraints).then((stream: MediaStream) => {
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

  /**
   * Check to see if current resolution is the last resolution.
   *  If yes, return results otherwise call `startGetUserMedia()`
   */
  private maybeContinueGetUserMedia (): Promise<unknown> | { log: string[], stats: unknown, resolutions: number[][], duration: number } {
    if (this.currentResolution === this.resolutions.length) {
      return this.getResults();
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.startGetUserMedia(this.resolutions[this.currentResolution++]).then(resolve, reject);
      }, 1000);
    });
  }

  /**
   * Collect and analyze stats from the passed in stream and resolution.
   * @param stream media stream
   * @param resolution current resolution
   */
  private collectAndAnalyzeStats (stream: MediaStream, resolution: number[]): Promise<unknown> | undefined | { log: string[], stats: unknown, resolutions: number[][], duration: number } {
    const tracks: MediaStreamTrack[] = stream.getVideoTracks();
    if (tracks.length < 1) {
      this.reportError('No video track in returned stream.');
      return this.maybeContinueGetUserMedia();
    }

    // Firefox does not support event handlers on mediaStreamTrack yet.
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack
    // TODO: remove if (...) when event handlers are supported by Firefox.
    const videoTrack: MediaStreamTrack = tracks[0];
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

    const videoElement: HTMLVideoElement = document.createElement('video');
    videoElement.setAttribute('autoplay', '');
    videoElement.setAttribute('muted', '');
    videoElement.width = resolution[0];
    videoElement.height = resolution[1];
    videoElement.srcObject = stream;
    const frameChecker: VideoFrameChecker = new VideoFrameChecker(videoElement);
    const call: WebrtcCall = new WebrtcCall(null, this.logger);

    stream.getTracks().forEach(t => call.pc1.pc.addTrack(t, stream));

    setTimeout(this.endCall.bind(this, call, stream), 8000);

    return call.establishConnection().then(() => {
      return call.gatherStats(call.pc1.pc, 100);
    }, (err) => {
      return Promise.reject(err);
    }).then(({ stats, statsCollectTime }) => {
      const result = this.analyzeStats({ resolution, videoElement, stream, frameChecker, stats, statsCollectTime });
      frameChecker.stop();
      return result;
    }, (err) => {
      return Promise.reject(err);
    });
  }

  /**
   * Analyze the passed in stats
   * @param {Object} param object with resolution, videoElement, media stream, frameChecker,
   *  stats, and stats connection time properties
   */
  private analyzeStats ({ resolution, videoElement, stream, frameChecker, stats, statsCollectTime }:
    { resolution: number[], videoElement: HTMLVideoElement, stream: MediaStream, frameChecker: VideoFrameChecker, stats: RTCStatsReport[], statsCollectTime: number[] }): StatsReport {
    this.stats = stats;
    const googAvgEncodeTime: number[] = [];
    const googAvgFrameRateInput: number[] = [];
    const googAvgFrameRateSent: number[] = [];
    const statsReport: StatsReport = {};
    const frameStats = frameChecker.frameStats;

    stats.forEach((stat: RTCStatsReport) => {
      if (stat.get('type') === 'ssrc') {
        // make sure to only capture stats after the encoder is setup.
        if (parseInt(stat.get('googFrameRateInput'), 10) > 0) {
          googAvgEncodeTime.push(parseInt(stat.get('googAvgEncodeMs'), 10));
          googAvgFrameRateInput.push(parseInt(stat.get('googFrameRateInput'), 10));
          googAvgFrameRateSent.push(parseInt(stat.get('googFrameRateSent'), 10));
        }
      }
    });

    statsReport.cameraName = stream.getVideoTracks()[0].label || '';
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

  /**
   * End the current web rtc call and clean up
   */
  private endCall (callObject: WebrtcCall, stream: MediaStream): void {
    this.isShuttingDown = true;
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    callObject.close();
  }

  /**
   * Extract the encoder's setup time
   * @param stats array of stats
   * @param statsCollectTime array of times for collecting the stats
   */
  private extractEncoderSetupTime (stats: RTCStatsReport[], statsCollectTime): number {
    let res: string = '';
    let index = 0;
    stats.forEach((stat) => {
      if (stat.get('type') === 'ssrc' && parseInt(stat.get('googFrameRateInput'), 10) > 0) {
        res = JSON.stringify(statsCollectTime[index] - statsCollectTime[0]);
      }
      index++;
    });
    return !res ? NaN : parseInt(res, 10);
  }

  /**
   * Compare the first resolution to see if it matches the second (or the second's minimum height or width)
   * @param aWidth first width
   * @param aHeight first height
   * @param bWidth second width
   * @param bHeight second height
   */
  private resolutionMatchesIndependentOfRotationOrCrop (aWidth: number, aHeight: number, bWidth: number, bHeight: number): boolean {
    const minRes = Math.min(bWidth, bHeight);
    return (aWidth === bWidth && aHeight === bHeight) ||
    (aWidth === bHeight && aHeight === bWidth) ||
    (aWidth === minRes && bHeight === minRes);
  }

  /**
   * Test expections on a given StatsReport
   * @param report to test
   */
  private testExpectations (report: StatsReport): void {
    const notAvailableStats: string[] = [];

    for (let key in report) {
      if (typeof report[key] === 'number' && isNaN(report[key])) {
        notAvailableStats.push(key);
      }
    }

    if (notAvailableStats.length !== 0) {
      report.notAvailableStatus = notAvailableStats;
      this.reportInfo('Not available: ' + notAvailableStats.join(', '));
    }
    if (isNaN(report.avgSentFps as number)) {
      this.reportInfo('Cannot verify sent FPS.');
    } else if (report.avgSentFps as number < 5) {
      this.reportError('Low average sent FPS: ' + report.avgSentFps);
    } else {
      this.reportSuccess('Average FPS above threshold');
    }

    if (!this.resolutionMatchesIndependentOfRotationOrCrop(
      report.actualVideoWidth as number, report.actualVideoHeight as number,
      report.mandatoryWidth as number, report.mandatoryHeight as number)) {
      this.reportError(`Incorrect captured resolution. Expected ${report.mandatoryWidth} by ${report.mandatoryHeight} but got ${report.actualVideoWidth} by ${report.actualVideoHeight}`);
    } else {
      this.reportSuccess('Captured video using expected resolution.');
    }

    if (report.testedFrames === 0) {
      this.reportError('Could not analyze any video frame.');
    } else {
      if ((report.blackFrames as number) > (report.testedFrames as number) / 3) {
        this.reportError('Camera delivering lots of black frames.');
      }
      if ((report.frozenFrames as number) > (report.testedFrames as number) / 3) {
        this.reportError('Camera delivering lots of frozen frames.');
      }
    }
  }

  /**
   * Calculate the average from the passed in array of numbers
   * @param array of numbers to average
   */
  private arrayAverage (array: number[]): number {
    const cnt = array.length;
    let tot = 0;
    for (let i = 0; i < cnt; i++) {
      tot += array[i];
    }
    return Math.floor(tot / cnt);
  }
}

interface StatsReport {
  cameraName?: string;
  actualVideoWidth?: number;
  actualVideoHeight?: number;
  mandatoryWidth?: number;
  mandatoryHeight?: number;
  encodeSetupTimeMs?: number;
  avgEncodeTimeMs?: number;
  minEncodeTimeMs?: number;
  maxEncodeTimeMs?: number;
  avgInputFps?: number;
  minInputFps?: number;
  maxInputFps?: number;
  avgSentFps?: number;
  minSentFps?: number;
  maxSentFps?: number;
  isMuted?: boolean;
  testedFrames?: number;
  blackFrames?: number;
  frozenFrames?: number;
  notAvailableStatus?: string[];
}
