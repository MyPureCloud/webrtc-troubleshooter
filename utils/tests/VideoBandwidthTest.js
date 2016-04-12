/* global webrtcsupport, localMedia, _ */

// adapted from https://github.com/webrtc/testrtc/blob/master/src/js/bandwidth_test.js

import WebrtcCall from '../WebrtcCall';
import { Test } from '../TestSuite';
import Ember from 'ember';

const { RSVP } = Ember;

class VideoBandwidthTest extends Test {
  constructor () {
    super(...arguments);
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
        deviceId: this.options.mediaOptions.video.deviceId,
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
    this.logs = [];
  }
  start () {
    super.start();

    this.deferred = RSVP.defer();
    this.log = this.results = {log: []};
    this.addLog('info', 'VideoBandwidthTest starting');

    if (!this.options.iceConfig.iceServers.length) {
      this.addLog('fatal', 'No ice servers were provided');
      this.fail();
    } else {
      this.call = new WebrtcCall(this.options.iceConfig);
      this.call.setIceCandidateFilter(WebrtcCall.isRelay);
      // FEC makes it hard to study bandwidth estimation since there seems to be
      // a spike when it is enabled and disabled. Disable it for now. FEC issue
      // tracked on: https://code.google.com/p/webrtc/issues/detail?id=3050
      this.call.disableVideoFec();
      this.call.constrainVideoBitrate(this.maxVideoBitrateKbps);
      this.doGetUserMedia(this.constraints, this.gotStream.bind(this));
    }

    return this.deferred.promise;
  }
  fail () {
    this.deferred.reject(_.last(this.results.log));
  }
  done () {
    this.deferred.resolve();
  }
  addLog (level, msg) {
    if (_.isObject(msg)) {
      msg = JSON.stringify(msg);
    }
    this.results.log.push(`${level} - ${msg}`);
  }
  doGetUserMedia (constraints, onSuccess, onFail) {
    var failFunc = (error) => {
      this.addLog('error', {'status': 'fail', 'error': error});
      if (onFail) {
        onFail.apply(this, arguments);
      } else {
        this.addLog('fatal', `Failed to get access to local media due to error: ${error.name}`);
        return this.fail();
      }
    };
    try {
      this.addLog('info', {'status': 'pending', 'constraints': constraints});
      var locMedia = new localMedia(); // eslint-disable-line
      locMedia.start(constraints, (err, stream) => {
        if (err) {
          return failFunc(err);
        }
        const cam = this.getDeviceName_(stream.getVideoTracks());
        this.results.camera = cam;
        this.addLog('info', {'status': 'success', 'camera': cam});
        onSuccess(stream);
      });
    } catch (e) {
      this.addLog('fatal', {'status': 'exception', 'error': e.message});
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
          this.addLog('error', 'Failed to getStats: ' + error);
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
      this.addLog('error', 'Only Firefox and Chrome getStats implementations are supported.');
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
        this.addLog('error', `Camera failure: ${this.videoStats[0]}x${this.videoStats[1]}. Cannot test bandwidth without a working camera.`);
      } else {
        stats.resolution = `${this.videoStats[0]}x${this.videoStats[1]}`;
        stats.bpsAvg = this.bweStats.getAverage();
        stats.bpsMax = this.bweStats.getMax();
        stats.rampUpTimeMs = this.bweStats.getRampUpTime();

        this.addLog('info', `Video resolution: ${stats.resolution}`);
        this.addLog('info', `Send bandwidth estimate average: ${stats.bpsAvg} bps`);
        this.addLog('info', `Send bandwidth estimate max: ${stats.bpsMax} bps`);
        this.addLog('info', `Send bandwidth ramp-up time: ${stats.rampUpTimeMs} ms`);
      }
    } else if (webrtcsupport.prefix === 'moz') {
      if (parseInt(this.framerateMean, 10) > 0) {
        this.addLog('success', `Frame rate mean: ${parseInt(this.framerateMean, 10)}`);
      } else {
        this.addLog('error', 'Frame rate mean is 0, cannot test bandwidth without a working camera.');
      }
      stats.framerateMean = this.framerateMean || null;

      stats.bitrateMean = this.bitrateMean;
      stats.bitrateStdDev = this.bitrateStdDev;
      this.addLog('info', `Send bitrate mean: ${stats.bitrateMean} bps`);
      this.addLog('info', `Send bitrate standard deviation: ${stats.bitrateStdDev} bps`);
    }
    stats.rttAverage = this.rttStats.getAverage();
    stats.rttMax = this.rttStats.getMax();
    stats.lostPackets = parseInt(this.packetsLost, 10);

    this.addLog('info', `RTT average: ${stats.rttAverage} ms`);
    this.addLog('info', `RTT max: ${stats.rttMax} ms`);
    this.addLog('info', `Lost packets: ${stats.lostPackets}`);

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
