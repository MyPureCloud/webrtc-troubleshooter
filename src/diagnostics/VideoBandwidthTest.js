// adapted from https://github.com/webrtc/testrtc/blob/master/src/js/bandwidth_test.js

import WebrtcCall from '../utils/WebrtcCall';
import Test from '../utils/Test';
import StatisticsAggregate from '../utils/StatisticsAggregate';

export default class VideoBandwidthTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Video Bandwidth Test';
    this.maxVideoBitrateKbps = 2000;
    this.durationMs = 40000;
    this.statStepMs = 100;
    this.bweStats = new StatisticsAggregate(0.75 * this.maxVideoBitrateKbps * 1000);
    window.bweStats = this.bweStats;
    this.rttStats = new StatisticsAggregate();
    this.packetsLost = null;
    this.videoStats = [];
    this.startTime = null;
    this.call = null;
    // Open the camera with hd resolution specs to get a correct measurement of ramp-up time.
    this.constraints = {
      audio: false,
      video: {
        width: {
          min: 640,
          ideal: 1280,
          max: 1920
        },
        height: {
          min: 480,
          ideal: 720,
          max: 1080
        }
      }

    };
    if (this.options.mediaOptions.video.deviceId) {
      this.constraints.video.deviceId = this.options.mediaOptions.video.deviceId;
    }

    this.providedStream = this.options.screenStream;

    this.log = [];
    this.stats = {};
  }

  start () {
    super.start();

    if (!this.options.iceConfig.iceServers.length) {
      const error = new Error('No ice servers were provided');
      error.details = this.log;
      return this.reject(error);
    }
    this.call = new WebrtcCall(this.options.iceConfig, this.logger);
    this.call.setIceCandidateFilter(WebrtcCall.isRelay);
    // FEC makes it hard to study bandwidth estimation since there seems to be
    // a spike when it is enabled and disabled. Disable it for now. FEC issue
    // tracked on: https://code.google.com/p/webrtc/issues/detail?id=3050
    this.call.disableVideoFec();
    this.call.constrainVideoBitrate(this.maxVideoBitrateKbps);

    let promise;
    if (this.providedStream) {
      promise = this.gotStream(this.providedStream);
    } else {
      promise = this.doGetUserMedia(this.constraints);
    }

    return promise.then(() => {
      const results = this.getResults();
      if (!this.hasError) {
        return this.resolve(results);
      } else {
        results.error = new Error('Video Bandwidth Error');
        return this.reject(results);
      }
    }, (err) => {
      const results = this.getResults();
      results.error = err;
      return this.reject(err);
    });
  }

  getResults () {
    return {
      log: this.log,
      stats: this.stats,
      constraints: this.constraints
    };
  }

  addLog (level, msg) {
    this.logger[level.toLowerCase()](msg);
    if (msg && typeof msg === 'object') {
      msg = JSON.stringify(msg);
    }
    if (level === 'error') {
      this.hasError = true;
    }
    this.log.push(`${level}: ${msg}`);
  }

  doGetUserMedia (constraints) {
    this.addLog('info', { status: 'pending', constraints });
    return navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      const camera = this.getDeviceName(stream.getVideoTracks());
      this.addLog('info', { status: 'success', camera });
      return this.gotStream(stream);
    }, (error) => {
      this.addLog('error', {'status': 'fail', 'error': error});
      this.addLog('error', `Failed to get access to local media due to error: ${error.name}`);
      return this.reject(error);
    });
  }

  getDeviceName (tracks) {
    if (tracks.length === 0) {
      return null;
    }
    return tracks[0].label;
  }

  gotStream (stream) {
    stream.getTracks().forEach(t => this.call.pc1.pc.addTrack(t, stream));
    return this.call.establishConnection().then(() => {
      this.addLog('info', { status: 'success', message: 'establishing connection' });
      this.startTime = new Date();
      this.localStream = stream.getVideoTracks()[0];

      return new Promise((resolve, reject) => {
        this.nextTimeout = setTimeout(() => {
          this.gatherStats().then(resolve, reject);
        }, this.statStepMs);
      });
    }, (error) => {
      this.addLog('warn', { status: 'error', error });
      return Promise.reject(error);
    });
  }

  gatherStats () {
    const now = new Date();
    if (now - this.startTime > this.durationMs) {
      return Promise.resolve(this.completed());
    }
    return this.call.pc1.getStats(null)
      .then(this.gotStats.bind(this), (error) => {
        this.addLog('error', 'Failed to getStats: ' + error);
      });
  }

  gotStats (response) {
    if (!response) {
      this.addLog('error', 'Got no response from stats... odd...');
    } else {
      const results = typeof response.result === 'function' ? response.result() : response;
      results.forEach((report) => {
        if (report.availableOutgoingBitrate) {
          const value = parseInt(report.availableOutgoingBitrate, 10);
          this.bweStats.add(new Date(report.timestamp), value);
        }
        if (report.totalRoundTripTime || report.roundTripTime) {
          const value = parseInt(report.totalRoundTripTime || report.roundTripTime, 10);
          this.rttStats.add(new Date(report.timestamp), value);
        }
        if (report.packetsSent) {
          this.packetsSent = report.packetsSent;
        }
        if (report.packetsLost) {
          this.packetsLost = report.packetsLost;
        }
        if (report.frameWidth) {
          this.videoStats[0] = report.frameWidth;
        }
        if (report.frameHeight) {
          this.videoStats[1] = report.frameHeight;
        }
      });
    }
    return new Promise((resolve, reject) => {
      this.nextTimeout = setTimeout(() => {
        this.gatherStats().then(resolve, reject);
      }, this.statStepMs);
    });
  }
  completed () {
    const isWebkit = 'WebkitAppearance' in document.documentElement.style;
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    const pc = this.call.pc1;
    if (pc.getSenders) {
      pc.getSenders().forEach(sender => sender.track.stop());
    }
    if (pc.getTransceivers) {
      pc.getTransceivers().forEach(t => t.stop());
    }
    this.call.close();
    this.call = null;
    const stats = this.stats;

    if (isWebkit) {
      // Checking if greater than 2 because Chrome sometimes reports 2x2 when a camera starts but fails to deliver frames.
      if (this.videoStats[0] < 2 && this.videoStats[1] < 2) {
        this.addLog('error', `Camera failure: ${this.videoStats[0]}x${this.videoStats[1]}. Cannot test bandwidth without a working camera.`);
      } else {
        stats.resolution = `${this.videoStats[0]}x${this.videoStats[1]}`;
        stats.mbpsAvg = this.bweStats.getAverage() / (1000 * 1000);
        stats.mbpsMax = this.bweStats.getMax() / (1000 * 1000);
        stats.rampUpTimeMs = this.bweStats.getRampUpTime();

        this.addLog('info', `Video resolution: ${stats.resolution}`);
        this.addLog('info', `Send bandwidth estimate average: ${stats.mbpsAvg} mpbs`);
        this.addLog('info', `Send bandwidth estimate max: ${stats.mbpsMax} mbps`);
        this.addLog('info', `Send bandwidth ramp-up time: ${stats.rampUpTimeMs} ms`);
      }
    } else if (isFirefox) {
      if (parseInt(this.framerateMean, 10) > 0) {
        this.addLog('info', `Frame rate mean: ${parseInt(this.framerateMean, 10)}`);
      } else {
        this.addLog('error', 'Frame rate mean is 0, cannot test bandwidth without a working camera.');
      }
      stats.framerateMean = this.framerateMean || null;

      stats.mbpsAvg = this.bitrateMean / (1000 * 1000);
      stats.mbpsStdDev = this.bitrateStdDev / (1000 * 1000);
      this.addLog('info', `Send bitrate mean: ${stats.mbpsAvg} mbps`);
      this.addLog('info', `Send bitrate standard deviation: ${stats.mbpsStdDev} mbps`);
    }
    stats.rttAverage = this.rttStats.getAverage();
    stats.rttMax = this.rttStats.getMax();

    if (this.packetsSent) {
      stats.packetLoss = parseInt(this.packetsLost || 0, 10) / parseFloat(this.packetsSent);
    }

    this.addLog('info', `RTT average: ${stats.rttAverage} ms`);
    this.addLog('info', `RTT max: ${stats.rttMax} ms`);
    this.addLog('info', `Lost packets: ${stats.lostPackets}`);
    return this.results;
  }

  destroy () {
    super.destroy();
    window.clearTimeout(this.nextTimeout);
    if (this.call) {
      this.call.close();
      this.call = null;
    }
  }
}
