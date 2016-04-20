
import { TestSuite } from '../../utils/TestSuite';
import { AudioTest, VideoTest, ConnectivityTest, AdvancedCameraTest, ThroughputTest, VideoBandwidthTest } from '../../utils/tests/defaultTests';
// import webrtc-troubleshooter.utils.TestSuite;

var checkingMicrophone = true;
var checkMicrophoneSuccess = false;
var checkingCamera = true;
var checkCameraSuccess = false;
var checkingCameraAdvanced = true;
var checkCameraAdvancedSuccess = false;
var checkingConnectivity = true;
var checkConnectivitySuccess = false;
var checkingThroughput = true;
var checkingThroughputSuccess = false;
var checkingBandwidth = true;
var checkingBandwidthSuccess = false;

var troubleshootingLog = null;

var video = true;
var audio = true;

var iceServers = null;

function init () {
  // this._super(...arguments);
  troubleshootingLog = [];
  this.startTroubleshooter();
}

function startTroubleshooter () {
  if (!navigator.mediaDevices) {
    this.video = false;
    this.audio = false;
    // this.set('video', false);
    // this.set('audio', false);
  }
  var iceConfig = {
    iceServers: this.iceServers || [],
    iceTransports: 'relay'
  };
  var mediaOptions = this.mediaOptions || { audio: true, video: true };

  var testSuite = new TestSuite();

  if (this.audio) {
    var audioTest = new AudioTest(mediaOptions, (err, logs) => {
      this.setProperties({
        checkingMicrophone: false,
        checkMicrophoneSuccess: !err,
        checkingVolume: false,
        checkVolumeSuccess: !err
      });
      this.troubleshootingLog.push(logs);
    });

    testSuite.addTest(audioTest);
  }

  if (this.video) {
    var videoTest = new VideoTest(mediaOptions, (err, logs) => {
      this.setProperties({
        checkingCamera: false,
        checkCameraSuccess: !err
      });
      this.troubleshootingLog.push(logs);
    });

    var advancedCameraTest = new AdvancedCameraTest(mediaOptions, (err, logs) => {
      this.setProperties({
        checkingCameraAdvanced: false,
        checkCameraAdvancedSuccess: !err
      });
      this.troubleshootingLog.push(logs);
    });

    var bandwidthTest = new VideoBandwidthTest({iceConfig, mediaOptions}, (err, logs) => {
      this.setProperties({
        checkingBandwidth: false,
        checkBandwidthSuccess: !err
      });
      this.troubleshootingLog.push(logs);
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
      this.troubleshootingLog.push(logs);
    });

    var throughputTest = new ThroughputTest(iceConfig, (err, logs) => {
      this.setProperties({
        checkingThroughput: false,
        checkThroughputSuccess: !err
      });
      this.troubleshootingLog.push(logs);
    });

    testSuite.addTest(connectivityTest);
    testSuite.addTest(throughputTest);
  }

  // testSuite.runNextTest();
  testSuite.runNextTest(troubleshootingLog);
  // testSuite.runNextTest(troubleshootingLog) => {
  //   this.sendAction('results', troubleshootingLog));
  // });

  this.testSuite = testSuite;
}

function willDestroyElement () {
  try {
    var testSuite = this.testSuite;
    if (testSuite && testSuite.running) {
      testSuite.stopAllTests();
    }
  } catch (e) { /* don't care - just want to destroy */ }
}

init();