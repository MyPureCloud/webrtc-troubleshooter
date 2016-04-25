import { TestSuite } from './utils/TestSuite';
import { AudioTest, VideoTest, ConnectivityTest, AdvancedCameraTest, ThroughputTest, VideoBandwidthTest } from './utils/tests/defaultTests';

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
  troubleshootingLog = [];
  startTroubleshooter();
}

function startTroubleshooter () {
  if (!navigator.mediaDevices) {
    video = false;
    audio = false;
  }
  var iceConfig = {
    iceServers: iceServers || [],
    iceTransports: 'relay'
  };
  var mediaOptions = mediaOptions || { audio: true, video: true };

  var testSuite = new TestSuite();
  //
  // if (audio) {
  //   var audioTest = new AudioTest(mediaOptions, (err, logs) => {
  //     setProperties({
  //       checkingMicrophone: false,
  //       checkMicrophoneSuccess: !err,
  //       checkingVolume: false,
  //       checkVolumeSuccess: !err
  //     });
  //     troubleshootingLog.push(logs);
  //   });
  //
  //   testSuite.addTest(audioTest);
  // }

  if (video) {
    // var videoTest = new VideoTest(mediaOptions, (err, logs) => {
    //   setProperties({
    //     checkingCamera: false,
    //     checkCameraSuccess: !err
    //   });
    //   troubleshootingLog.push(logs);
    // });
    //
    // var advancedCameraTest = new AdvancedCameraTest(mediaOptions, (err, logs) => {
    //   setProperties({
    //     checkingCameraAdvanced: false,
    //     checkCameraAdvancedSuccess: !err
    //   });
    //   troubleshootingLog.push(logs);
    // });

    var bandwidthTest = new VideoBandwidthTest({iceConfig, mediaOptions}, (err, logs) => {
      setProperties({
        checkingBandwidth: false,
        checkBandwidthSuccess: !err
      });
      troubleshootingLog.push(logs);
    });
    //
    // testSuite.addTest(videoTest);
    // testSuite.addTest(advancedCameraTest);
    testSuite.addTest(bandwidthTest);
  }
  //
  // if (window.RTCPeerConnection) {
  //   var connectivityTest = new ConnectivityTest(iceConfig, (err, logs) => {
  //     setProperties({
  //       checkingConnectivity: false,
  //       checkConnectivitySuccess: !err
  //     });
  //     troubleshootingLog.push(logs);
  //   });
  //
  //   var throughputTest = new ThroughputTest(iceConfig, (err, logs) => {
  //     setProperties({
  //       checkingThroughput: false,
  //       checkThroughputSuccess: !err
  //     });
  //     troubleshootingLog.push(logs);
  //   });
  //
  //   testSuite.addTest(connectivityTest);
  //   testSuite.addTest(throughputTest);
  // }
  //
  testSuite.runNextTest(troubleshootingLog);
  //
  // testSuite = testSuite;
}

function willDestroyElement () {
  try {
    var testSuite = testSuite;
    if (testSuite && testSuite.running) {
      testSuite.stopAllTests();
    }
  } catch (e) { /* don't care - just want to destroy */ }
}

init();