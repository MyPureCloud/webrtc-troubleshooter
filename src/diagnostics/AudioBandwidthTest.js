// adapted from https://github.com/webrtc/testrtc/blob/master/src/js/bandwidth_test.js

import WebrtcCall from '../utils/WebrtcCall';
import Test from '../utils/Test';
import StatisticsAggregate from '../utils/StatisticsAggregate';

export default class AudioBandwidthTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Audio Bandwidth Test';
    this.maxAudioBitrateKbps = 510;
    this.durationMs = 40000;
    this.statStepMs = 100;
    this.bweStats = new StatisticsAggregate(0.75 * this.maxAudioBitrateKbps * 1000);
    this.rttStats = new StatisticsAggregate();
    this.packetsLost = null;
    this.startTime = null;
    this.call = null;
    // No Camera for audio only test
    this.constraints = {
      video: false
    };

    if (this.options.mediaOptions.audio.deviceId) {
      this.constraints.audio = {deviceId: this.options.mediaOptions.audio.deviceId};
    } else {
      this.constraints.audio = true;
    }

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
    this.call = new WebrtcCall(this.options.iceConfig);
    this.call.setIceCandidateFilter(WebrtcCall.isRelay);

    return this.doGetUserMedia(this.constraints)
      .then(stream => this.setupCall(stream))
      .then(this.runTest.bind(this))
      .then(this.completed.bind(this))
      .then(() => {
        if (this.hasError) {
          return Promise.reject(new Error('Audio Bandwidth Error'));
        }

        return this.resolve(this.getResults());
      })
      .catch(err => {
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
    return navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        const audioTrack = this.getDeviceName(stream.getAudioTracks());
        this.addLog('info', {status: 'success', audioTrack});
        return stream;
      })
      .catch(error => {
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

  setupCall (stream) {
    stream.getTracks().forEach(t => this.call.pc1.addTrack(t, stream));

    return this.call.establishConnection().then(() => {
      this.addLog('info', { status: 'success', message: 'establishing connection' });
      this.startTime = new Date();
      this.localTrack = stream.getAudioTracks()[0];
    }, (error) => {
      this.addLog('warn', { status: 'error', error });
      return Promise.reject(error);
    });
  }

  runTest () {
    return new Promise((resolve, reject) => {
      this.nextTimeout = setTimeout(() => {
        this.gatherStats().then(resolve, reject);
      }, this.statStepMs);
    });
  }

  gatherStats () {
    const now = new Date();
    if (now - this.startTime > this.durationMs) {
      return Promise.resolve();
    }
    return this.call.pc1.getStats(this.localTrack)
      .then(this.gotStats.bind(this))
      .catch((error) => this.addLog('error', 'Failed to getStats: ' + error));
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

    return this.runTest();
  }

  completed () {
    const stats = this.stats;

    stats.mbpsAvg = this.bweStats.getAverage() / (1000 * 1000);
    stats.mbpsMax = this.bweStats.getMax() / (1000 * 1000);

    this.addLog('info', `Send bandwidth estimate average: ${stats.mbpsAvg} mpbs`);
    this.addLog('info', `Send bandwidth estimate max: ${stats.mbpsMax} mbps`);

    stats.rttAverage = this.rttStats.getAverage();
    stats.rttMax = this.rttStats.getMax();
    stats.packetsSent = parseInt(this.packetsSent);

    if (this.packetsSent) {
      stats.packetLoss = parseInt(this.packetsLost || 0, 10) / parseFloat(this.packetsSent);
    }

    this.addLog('info', `RTT average: ${stats.rttAverage} ms`);
    this.addLog('info', `RTT max: ${stats.rttMax} ms`);
    this.addLog('info', `Packets sent: ${stats.rttMax} ms`);
    this.addLog('info', `Packet loss %: ${stats.packetLoss}`);
    return this.results;
  }

  destroy () {
    super.destroy();
    window.clearTimeout(this.nextTimeout);
    if (this.call) {
      const pc = this.call.pc1;
      if (pc.getSenders) {
        pc.getSenders().forEach(sender => sender.track.stop());
      }
      if (pc.getTransceivers) {
        pc.getTransceivers().forEach(t => t.stop());
      }

      this.call.close();
      this.call = null;
    }
  }
}
