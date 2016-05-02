import { TestSuite } from './utils/TestSuite';
import { AudioTest, VideoTest, ConnectivityTest, AdvancedCameraTest, ThroughputTest, VideoBandwidthTest } from './utils/tests/defaultTests';

var troubleshootingLog = null;

var video = true;
var audio = true;

var iceServers = null;
var testSuite = new TestSuite();

function startTroubleshooter () {
  troubleshootingLog = [];

  if (!navigator.mediaDevices) {
    video = false;
    audio = false;
  }
  var iceConfig = {
    iceServers: iceServers || [],
    iceTransports: 'relay'
  };
  var mediaOptions = mediaOptions || { audio: true, video: true };

  if (audio) {
    var audioTest = new AudioTest(mediaOptions);

    testSuite.addTest(audioTest);
  }

  if (video) {
    var videoTest = new VideoTest(mediaOptions);
    var advancedCameraTest = new AdvancedCameraTest(mediaOptions);
    var bandwidthTest = new VideoBandwidthTest({iceConfig, mediaOptions});

    testSuite.addTest(videoTest);
    testSuite.addTest(advancedCameraTest);
    testSuite.addTest(bandwidthTest);
  }

  if (window.RTCPeerConnection) {
    var connectivityTest = new ConnectivityTest(iceConfig);
    var throughputTest = new ThroughputTest(iceConfig);

    testSuite.addTest(connectivityTest);
    testSuite.addTest(throughputTest);
  }

  testSuite.runNextTest(troubleshootingLog);
}

function willDestroyElement () {
  try {
    if (testSuite && testSuite.running) {
      testSuite.stopAllTests();
    }
  } catch (e) { /* don't care - just want to destroy */ }
}

startTroubleshooter();