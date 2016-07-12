/* global WebRTCTroubleshooter */
let video = true;
let audio = true;

let iceServers = [];
const webRTCTroubleshooter = WebRTCTroubleshooter.default;
const testSuite = new webRTCTroubleshooter.TestSuite();

const iceServersEntry = document.getElementById('ice-servers');
const runButton = document.getElementById('run-button');

runButton.onclick = function startTroubleshooter () {
  if (!navigator.mediaDevices) {
    video = false;
    audio = false;
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
    const audioTest = new webRTCTroubleshooter.AudioTest(mediaOptions);

    testSuite.addTest(audioTest);
  }

  if (video) {
    const videoTest = new webRTCTroubleshooter.VideoTest(mediaOptions);
    const advancedCameraTest = new webRTCTroubleshooter.AdvancedCameraTest(mediaOptions);
    const bandwidthTest = new webRTCTroubleshooter.VideoBandwidthTest({ iceConfig: iceConfig, mediaOptions: mediaOptions });

    testSuite.addTest(videoTest);
    testSuite.addTest(advancedCameraTest);
    testSuite.addTest(bandwidthTest);
  }

  if (window.RTCPeerConnection) {
    const connectivityTest = new webRTCTroubleshooter.ConnectivityTest(iceConfig);
    const throughputTest = new webRTCTroubleshooter.ThroughputTest(iceConfig);

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
