var troubleshootingLog = null;

var video = true;
var audio = true;

var iceServers = [];
var testSuite = new WebRTCTroubleshooter.TestSuite();

document.getElementById('run-button').onclick = function startTroubleshooter () {
    troubleshootingLog = [];

    if (!navigator.mediaDevices) {
      video = false;
      audio = false;
    }

    var servers = document.getElementById('ice-servers').value;
    if (servers) {
      var serverList = servers.split('\n');
      for (var index in serverList) {
        iceServers.push(JSON.parse(serverList[index]));
      }
    }
    var iceConfig = {
      iceServers: iceServers,
      iceTransports: 'relay'
    };
    var mediaOptions = mediaOptions || { audio: true, video: true };

    if (audio) {
      var audioTest = new WebRTCTroubleshooter.AudioTest(mediaOptions);

      testSuite.addTest(audioTest);
    }

    if (video) {
      var videoTest = new WebRTCTroubleshooter.VideoTest(mediaOptions);
      var advancedCameraTest = new WebRTCTroubleshooter.AdvancedCameraTest(mediaOptions);
      var bandwidthTest = new WebRTCTroubleshooter.VideoBandwidthTest({ iceConfig: iceConfig, mediaOptions: mediaOptions});

      testSuite.addTest(videoTest);
      testSuite.addTest(advancedCameraTest);
      testSuite.addTest(bandwidthTest);
    }

    if (window.RTCPeerConnection) {
      var connectivityTest = new WebRTCTroubleshooter.ConnectivityTest(iceConfig);
      var throughputTest = new WebRTCTroubleshooter.ThroughputTest(iceConfig);

      testSuite.addTest(connectivityTest);
      testSuite.addTest(throughputTest);
    }

    testSuite.runNextTest(troubleshootingLog);
};

function willDestroyElement () {
  try {
    if (testSuite && testSuite.running) {
      testSuite.stopAllTests();
    }
  } catch (e) { /* don't care - just want to destroy */ }
}