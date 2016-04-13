// import Ember from 'ember'; 
import layout from './template';

import { TestSuite } from '../../utils/TestSuite';
import { AudioTest, VideoTest, ConnectivityTest, AdvancedCameraTest, ThroughputTest, VideoBandwidthTest } from '../../utils/tests/defaultTests';

export default Ember.Component.extend({
  layout,

  checkingMicrophone: true,
  checkMicrophoneSuccess: false,
  checkingCamera: true,
  checkCameraSuccess: false,
  checkingCameraAdvanced: true,
  checkCameraAdvancedSuccess: false,
  checkingConnectivity: true,
  checkConnectivitySuccess: false,
  checkingThroughput: true,
  checkingThroughputSuccess: false,
  checkingBandwidth: true,
  checkingBandwidthSuccess: false,

  troubleshootingLog: null,

  video: true,
  audio: true,

  iceServers: null,

  init () {
    this._super(...arguments);
    this.set('troubleshootingLog', []);
    this.startTroubleshooter();
  },

  startTroubleshooter: function () {
    if (!navigator.mediaDevices) {
      this.set('video', false);
      this.set('audio', false);
    }
    var iceConfig = {
      iceServers: this.get('iceServers') || [],
      iceTransports: 'relay'
    };
    var mediaOptions = this.get('mediaOptions') || { audio: true, video: true };

    var testSuite = new TestSuite();

    if (this.get('audio')) {
      var audioTest = new AudioTest(mediaOptions, (err, logs) => {
        this.setProperties({
          checkingMicrophone: false,
          checkMicrophoneSuccess: !err,
          checkingVolume: false,
          checkVolumeSuccess: !err
        });
        this.get('troubleshootingLog').push(logs);
      });

      testSuite.addTest(audioTest);
    }

    if (this.get('video')) {
      var videoTest = new VideoTest(mediaOptions, (err, logs) => {
        this.setProperties({
          checkingCamera: false,
          checkCameraSuccess: !err
        });
        this.get('troubleshootingLog').push(logs);
      });

      var advancedCameraTest = new AdvancedCameraTest(mediaOptions, (err, logs) => {
        this.setProperties({
          checkingCameraAdvanced: false,
          checkCameraAdvancedSuccess: !err
        });
        this.get('troubleshootingLog').push(logs);
      });

      var bandwidthTest = new VideoBandwidthTest({iceConfig, mediaOptions}, (err, logs) => {
        this.setProperties({
          checkingBandwidth: false,
          checkBandwidthSuccess: !err
        });
        this.get('troubleshootingLog').push(logs);
      });

      testSuite.addTest(videoTest);
      testSuite.addTest(advancedCameraTest);
      testSuite.addTest(bandwidthTest);
    }

    if (window.RTCPeerConnection) {
      var connectivityTest = new ConnectivityTest(iceConfig, (err, logs) => {
        this.setProperties({
          checkingConnectivity: false,
          checkConnectivitySuccess: !err
        });
        this.get('troubleshootingLog').push(logs);
      });

      var throughputTest = new ThroughputTest(iceConfig, (err, logs) => {
        this.setProperties({
          checkingThroughput: false,
          checkThroughputSuccess: !err
        });
        this.get('troubleshootingLog').push(logs);
      });

      testSuite.addTest(connectivityTest);
      testSuite.addTest(throughputTest);
    }

    testSuite.runNextTest(() => {
      Ember.Logger.info('WebRTC Troubleshooting results', this.get('troubleshootingLog'));
      this.sendAction('results', this.get('troubleshootingLog'));
    });

    this.set('testSuite', testSuite);
  },

  willDestroyElement () {
    try {
      var testSuite = this.get('testSuite');
      if (testSuite && testSuite.running) {
        testSuite.stopAllTests();
      }
    } catch (e) { /* don't care - just want to destroy */ }
  }
});
