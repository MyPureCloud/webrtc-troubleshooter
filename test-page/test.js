/* global WebRTCTroubleshooter */
let video = true;
let audio = true;

let iceServers = [];
WebRTCTroubleshooter = WebRTCTroubleshooter.default;
const testSuite = new WebRTCTroubleshooter.TestSuite();

const iceServersEntry = document.getElementById('ice-servers');
const runButton = document.getElementById('run-button');

runButton.onclick = function startTroubleshooter () {
  if (!navigator.mediaDevices) {
    video = false
    audio = false
  }

  const servers = iceServersEntry.value;
  if (servers) {
    iceServers = JSON.parse(servers);
    window.localStorage.setItem('iceServers', servers);
  }
  const iceConfig = {
    iceServers: iceServers,
    iceTransports: 'relay'
  };
  const mediaOptions = { audio: true, video: true };

  if (audio) {
    const audioTest = new WebRTCTroubleshooter.AudioTest(mediaOptions);

    testSuite.addTest(audioTest);
  }

  if (video) {
    const videoTest = new WebRTCTroubleshooter.VideoTest(mediaOptions);
    const advancedCameraTest = new WebRTCTroubleshooter.AdvancedCameraTest(mediaOptions);
    const bandwidthTest = new WebRTCTroubleshooter.VideoBandwidthTest({ iceConfig: iceConfig, mediaOptions: mediaOptions});

    testSuite.addTest(videoTest);
    testSuite.addTest(advancedCameraTest);
    testSuite.addTest(bandwidthTest);
  }

  if (window.RTCPeerConnection) {
    const connectivityTest = new WebRTCTroubleshooter.ConnectivityTest(iceConfig);
    const throughputTest = new WebRTCTroubleshooter.ThroughputTest(iceConfig);

    testSuite.addTest(connectivityTest);
    testSuite.addTest(throughputTest);
  }

  testSuite.start().then(function () {
    console.log('Finished the tests');
  });
};

const savedIceServers = window.localStorage.getItem('iceServers');
if (iceServers) {
  iceServersEntry.value = savedIceServers;
}

function willDestroyElement () {
  try {
    if (testSuite && testSuite.running) {
      testSuite.stopAllTests();
    }
  } catch (e) { /* don't care - just want to destroy */ }
}
