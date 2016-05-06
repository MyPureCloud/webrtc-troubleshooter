/* global webrtcsupport, localMedia, _ */

// adapted from https://github.com/webrtc/testrtc/blob/master/src/js/bandwidth_test.js

import WebrtcCall from '../WebrtcCall';
import { Test } from '../TestSuite';

const _ = require('lodash');
const localMedia = require('localMedia');

class VideoBandwidthTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Bandwidth Test';
    this.maxVideoBitrateKbps = 2000;
    this.durationMs = 40000;
    this.statStepMs = 100;
    this.bweStats = new StatisticsAggregate(0.75 * this.maxVideoBitrateKbps * 1000);
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
    this.log = [];
  }

  start () {
    super.start();
    this.log = this.results = {log: []};

    return new Promise((resolve, reject) => {
      this.reject = reject;

      this.addLog( 'INFO', 'Video Bandwidth Test');

      if (!this.options.iceConfig.iceServers.length) {
        this.addLog('FATAL', 'No ice servers were provided');
        reject(this.log);
      } else {
        this.call = new WebrtcCall(this.options.iceConfig);
        this.call.setIceCandidateFilter(WebrtcCall.isRelay);
        // FEC makes it hard to study bandwidth estimation since there seems to be
        // a spike when it is enabled and disabled. Disable it for now. FEC issue
        // tracked on: https://code.google.com/p/webrtc/issues/detail?id=3050
        this.call.disableVideoFec();
        this.call.constrainVideoBitrate(this.maxVideoBitrateKbps);

        // this.doGetUserMedia(this.constraints, this.gotStream.bind(this)); // returns fail in two cases
        var failFunc = (error) => {
          this.addLog('ERROR', {'status': 'fail', 'error': error});
          if (onFail) {
            onFail.apply(this, arguments);
          } else {
            this.addLog('FATAL', `Failed to get access to local media due to error: ${error.name}`);
            reject();
          }
        };
        try {
          this.addLog('INFO', {'status': 'pending', 'constraints': this.constraints});
          var locMedia = new localMedia(); // eslint-disable-line
          locMedia.start(constraints, (err, stream) => {
            if (err) {
              return failFunc(err);
            }
            const cam = this.getDeviceName_(stream.getVideoTracks());
            this.results.camera = cam;
            this.addLog('INFO', {'status': 'success', 'camera': cam});
            onSuccess(stream);
          });
        } catch (e) {
          this.addLog('FATAL', {'status': 'exception', 'error': e.message});
          reject();
        }

        // completed returns resolve
      }

    });
  }
  fail () {
    // this.deferred.reject(_.last(this.log));
    console.log('stuff got rejected bandwidth');
  }
  done () {
    // this.deferred.resolve();
    console.log('stuff got resolved bandwidth')
  }
  addLog (level, msg) {
    if (_.isObject(msg)) {
      msg = JSON.stringify(msg);
    }
    this.results.log.push(`${level}: ${msg}`);
  }
  doGetUserMedia (constraints, onSuccess, onFail) {
    var failFunc = (error) => {
      this.addLog('ERROR', {'status': 'fail', 'error': error});
      if (onFail) {
        onFail.apply(this, arguments);
      } else {
        this.addLog('FATAL', `Failed to get access to local media due to error: ${error.name}`);
        return this.fail();
      }
    };
    try {
      this.addLog('INFO', {'status': 'pending', 'constraints': constraints});
      var locMedia = new localMedia(); // eslint-disable-line
      locMedia.start(constraints, (err, stream) => {
        if (err) {
          return failFunc(err);
        }
        const cam = this.getDeviceName_(stream.getVideoTracks());
        // this.results.camera = cam;
        this.addLog('INFO', {'status': 'success', 'camera': cam});
        onSuccess(stream);
      });
    } catch (e) {
      this.addLog('FATAL', {'status': 'exception', 'error': e.message});
      this.fail();
    }
  }
  getDeviceName_ (tracks) {
    if (tracks.length === 0) {
      return null;
    }
    return tracks[0].label;
  }
  gotStream (stream) {
    this.call.pc1.addStream(stream);
    this.call.establishConnection();
    this.startTime = new Date();
    this.localStream = stream.getVideoTracks()[0];
    this.nextTimeout = setTimeout(this.gatherStats.bind(this), this.statStepMs);
  }
  gatherStats () {
    const now = new Date();
    if (now - this.startTime > this.durationMs) {
      this.completed();
    } else {
      this.call.pc1.getStats(this.localStream)
        .then(_.bind(this.gotStats, this))
        .catch((error) => {
          this.addLog('ERROR', 'Failed to getStats: ' + error);
        });
    }
  }
  gotStats (response) {
    if (webrtcsupport.prefix === 'webkit') {
      _.forEach(response.result(), (report) => {
        if (report.id === 'bweforvideo') {
          this.bweStats.add(Date.parse(report.timestamp), parseInt(report.stat('googAvailableSendBandwidth'), 10));
        } else if (report.type === 'ssrc') {
          this.rttStats.add(Date.parse(report.timestamp), parseInt(report.stat('googRtt'), 10));
          // Grab the last stats.
          this.videoStats[0] = report.stat('googFrameWidthSent');
          this.videoStats[1] = report.stat('googFrameHeightSent');
          this.packetsLost = report.stat('packetsLost');
        }
      });
    } else if (webrtcsupport.prefix === 'moz') {
      for (let j in response) {
        let stats = response[j];
        if (stats.id === 'outbound_rtcp_video_0') {
          this.rttStats.add(Date.parse(stats.timestamp), parseInt(stats.mozRtt, 10));
          // Grab the last stats.
          this.jitter = stats.jitter;
          this.packetsLost = stats.packetsLost;
        } else if (stats.id === 'outbound_rtp_video_0') {
          // TODO: Get dimensions from getStats when supported in FF.
          this.videoStats[0] = 'Not supported on Firefox';
          this.videoStats[1] = 'Not supported on Firefox';
          this.bitrateMean = stats.bitrateMean;
          this.bitrateStdDev = stats.bitrateStdDev;
          this.framerateMean = stats.framerateMean;
        }
      }
    } else {
      this.addLog('ERROR', 'Only Firefox and Chrome getStats implementations are supported.');
    }
    this.nextTimeout = setTimeout(this.gatherStats.bind(this), this.statStepMs);
  }
  completed () {
    this.call.pc1.getLocalStreams()[0].getTracks().forEach((track) => {
      track.stop();
    });
    this.call.close();
    this.call = null;
    const stats = this.results.stats = {};

    if (webrtcsupport.prefix === 'webkit') {
      // Checking if greater than 2 because Chrome sometimes reports 2x2 when a camera starts but fails to deliver frames.
      if (this.videoStats[0] < 2 && this.videoStats[1] < 2) {
        this.addLog('ERROR', `Camera failure: ${this.videoStats[0]}x${this.videoStats[1]}. Cannot test bandwidth without a working camera.`);
      } else {
        stats.resolution = `${this.videoStats[0]}x${this.videoStats[1]}`;
        stats.bpsAvg = this.bweStats.getAverage();
        stats.bpsMax = this.bweStats.getMax();
        stats.rampUpTimeMs = this.bweStats.getRampUpTime();

        this.addLog('INFO', `Video resolution: ${stats.resolution}`);
        this.addLog('INFO', `Send bandwidth estimate average: ${stats.bpsAvg} bps`);
        this.addLog('INFO', `Send bandwidth estimate max: ${stats.bpsMax} bps`);
        this.addLog('INFO', `Send bandwidth ramp-up time: ${stats.rampUpTimeMs} ms`);
      }
    } else if (webrtcsupport.prefix === 'moz') {
      if (parseInt(this.framerateMean, 10) > 0) {
        this.addLog('SUCCESS', `Frame rate mean: ${parseInt(this.framerateMean, 10)}`);
      } else {
        this.addLog('ERROR', 'Frame rate mean is 0, cannot test bandwidth without a working camera.');
      }
      stats.framerateMean = this.framerateMean || null;

      stats.bitrateMean = this.bitrateMean;
      stats.bitrateStdDev = this.bitrateStdDev;
      this.addLog('INFO', `Send bitrate mean: ${stats.bitrateMean} bps`);
      this.addLog('INFO', `Send bitrate standard deviation: ${stats.bitrateStdDev} bps`);
    }
    stats.rttAverage = this.rttStats.getAverage();
    stats.rttMax = this.rttStats.getMax();
    stats.lostPackets = parseInt(this.packetsLost, 10);

    this.addLog('INFO', `RTT average: ${stats.rttAverage} ms`);
    this.addLog('INFO', `RTT max: ${stats.rttMax} ms`);
    this.addLog('INFO', `Lost packets: ${stats.lostPackets}`);

    this.done();
  }
  destroy () {
    window.clearTimeout(this.nextTimeout);
    if (this.call) {
      this.call.close();
      this.call = null;
    }
  }
}

class StatisticsAggregate {
  constructor (rampUpThreshold) {
    this.startTime_ = 0;
    this.sum_ = 0;
    this.count_ = 0;
    this.max_ = 0;
    this.rampUpThreshold_ = rampUpThreshold;
    this.rampUpTime_ = Infinity;
  }
  add (time, datapoint) {
    if (this.startTime_ === 0) {
      this.startTime_ = time;
    }
    this.sum_ += datapoint;
    this.max_ = Math.max(this.max_, datapoint);
    if (this.rampUpTime_ === Infinity &&
      datapoint > this.rampUpThreshold_) {
      this.rampUpTime_ = time;
    }
    this.count_++;
  }
  getAverage () {
    if (this.count_ === 0) {
      return 0;
    }
    return Math.round(this.sum_ / this.count_);
  }
  getMax () {
    return this.max_;
  }
  getRampUpTime () {
    return this.rampUpTime_ - this.startTime_;
  }
}

export default VideoBandwidthTest;
