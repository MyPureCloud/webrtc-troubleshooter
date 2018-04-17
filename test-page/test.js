/* global WebRTCTroubleshooter */
let video = true;
let audio = true;

let iceServers = [];
const webRTCTroubleshooter = WebRTCTroubleshooter.default;
const testSuite = new webRTCTroubleshooter.TestSuite();

const iceServersEntry = document.getElementById('ice-servers');
const runButton = document.getElementById('run-button');

const testCompleted = function (test, success, res) {
  const result = `test completed ${test.name} ${success ? 'success' : 'failure'} ${res} ${res && res.details ? res.details : 'no results'}`;
  console.log(result, res);
  const p = document.createElement('p');
  p.innerText = result;
  document.body.appendChild(p);
};

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
    audioTest.promise.then(testCompleted.bind(null, audioTest, true), testCompleted.bind(null, audioTest, false));
    testSuite.addTest(audioTest);

    const audioBandwidthTest = new webRTCTroubleshooter.AudioBandwidthTest({ iceConfig: iceConfig, mediaOptions: mediaOptions });
    audioBandwidthTest.promise.then(testCompleted.bind(null, audioBandwidthTest, true), testCompleted.bind(null, audioBandwidthTest, false));
    testSuite.addTest(audioBandwidthTest);
  }

  if (video) {
    const videoTest = new webRTCTroubleshooter.VideoTest(mediaOptions);
    videoTest.promise.then(testCompleted.bind(null, videoTest, true), testCompleted.bind(null, videoTest, false));
    const advancedCameraTest = new webRTCTroubleshooter.AdvancedCameraTest(mediaOptions);
    advancedCameraTest.promise.then(testCompleted.bind(null, advancedCameraTest, true), testCompleted.bind(null, advancedCameraTest, false));
    const bandwidthTest = new webRTCTroubleshooter.VideoBandwidthTest({ iceConfig: iceConfig, mediaOptions: mediaOptions });
    bandwidthTest.promise.then(testCompleted.bind(null, bandwidthTest, true), testCompleted.bind(null, bandwidthTest, false));

    testSuite.addTest(videoTest);
    testSuite.addTest(advancedCameraTest);
    testSuite.addTest(bandwidthTest);
  }

  if (window.RTCPeerConnection) {
    const connectivityTest = new webRTCTroubleshooter.ConnectivityTest(iceConfig);
    connectivityTest.promise.then(testCompleted.bind(null, connectivityTest, true), testCompleted.bind(null, connectivityTest, false));
    const throughputTest = new webRTCTroubleshooter.ThroughputTest(iceConfig);
    throughputTest.promise.then(testCompleted.bind(null, throughputTest, true), testCompleted.bind(null, throughputTest, false));

    const symmetricNatTest = new webRTCTroubleshooter.SymmetricNatTest();
    symmetricNatTest.promise.then(testCompleted.bind(null, symmetricNatTest, true), testCompleted.bind(null, symmetricNatTest, false));

    testSuite.addTest(connectivityTest);
    testSuite.addTest(throughputTest);
    testSuite.addTest(symmetricNatTest);
  }

  const p = document.createElement('p');
  testSuite.start().then(function (results) {
    const result = 'Finished the tests';
    console.log(result, results);
    p.innerText = result;
  }, function (err) {
    const result = 'test failure';
    console.warn(result, err, err.details);
    p.innerText = result;
  }).then(function () {
    document.body.appendChild(p);
  });
};

const savedIceServers = window.localStorage.getItem('iceServers');
if (iceServers) {
  iceServersEntry.value = savedIceServers;
}
