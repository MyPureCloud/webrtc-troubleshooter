/* global WebrtcTroubleshooter */
let video = true;
let audio = true;

let iceServers = [];
const testSuite = new WebrtcTroubleshooter.TestSuite();

const iceServersEntry = document.getElementById('ice-servers');
const runButton = document.getElementById('run-button');

const testCompleted = function (test, success, res) {
  const result = `test completed: "${test.name}" — ${success ? 'success' : 'failure'} —> ${res} ${res && res.details ? res.details : 'no results'}`;
  console.log(result, res);
  const p = document.createElement('p');
  p.innerText = result;
  p.style.color = success ? '' : 'red';
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
    iceTransportPolicy: 'relay'
  };
  const mediaOptions = { audio: true, video: true };

  if (audio) {
    const microphonePermissionsTest = new WebrtcTroubleshooter.PermissionsTest(false, false, mediaOptions);
    microphonePermissionsTest.promise.then(testCompleted.bind(null, microphonePermissionsTest, true), testCompleted.bind(null, microphonePermissionsTest, false));
    testSuite.addTest(microphonePermissionsTest);

    const audioTest = new WebrtcTroubleshooter.AudioTest(mediaOptions);
    audioTest.promise.then(testCompleted.bind(null, audioTest, true), testCompleted.bind(null, audioTest, false));
    testSuite.addTest(audioTest);

    const audioBandwidthTest = new WebrtcTroubleshooter.AudioBandwidthTest({ iceConfig: iceConfig, mediaOptions: mediaOptions });
    audioBandwidthTest.promise.then(testCompleted.bind(null, audioBandwidthTest, true), testCompleted.bind(null, audioBandwidthTest, false));
    testSuite.addTest(audioBandwidthTest);
  }

  if (video) {
    const cameraPermissionsTest = new WebrtcTroubleshooter.PermissionsTest(true, false, mediaOptions);
    cameraPermissionsTest.promise.then(testCompleted.bind(null, cameraPermissionsTest, true), testCompleted.bind(null, cameraPermissionsTest, false));
    testSuite.addTest(cameraPermissionsTest);

    const videoTest = new WebrtcTroubleshooter.VideoTest(mediaOptions);
    videoTest.promise.then(testCompleted.bind(null, videoTest, true), testCompleted.bind(null, videoTest, false));
    testSuite.addTest(videoTest);

    const advancedCameraTest = new WebrtcTroubleshooter.AdvancedCameraTest(mediaOptions);
    advancedCameraTest.promise.then(testCompleted.bind(null, advancedCameraTest, true), testCompleted.bind(null, advancedCameraTest, false));
    testSuite.addTest(advancedCameraTest);

    const bandwidthTest = new WebrtcTroubleshooter.VideoBandwidthTest({ iceConfig: iceConfig, mediaOptions: mediaOptions });
    bandwidthTest.promise.then(testCompleted.bind(null, bandwidthTest, true), testCompleted.bind(null, bandwidthTest, false));
    testSuite.addTest(bandwidthTest);
  }

  if (window.RTCPeerConnection) {
    const connectivityTest = new WebrtcTroubleshooter.ConnectivityTest(iceConfig);
    connectivityTest.promise.then(testCompleted.bind(null, connectivityTest, true), testCompleted.bind(null, connectivityTest, false));
    testSuite.addTest(connectivityTest);

    const throughputTest = new WebrtcTroubleshooter.ThroughputTest(iceConfig);
    throughputTest.promise.then(testCompleted.bind(null, throughputTest, true), testCompleted.bind(null, throughputTest, false));
    testSuite.addTest(throughputTest);

    const symmetricNatTest = new WebrtcTroubleshooter.SymmetricNatTest();
    symmetricNatTest.promise.then(testCompleted.bind(null, symmetricNatTest, true), testCompleted.bind(null, symmetricNatTest, false));
    testSuite.addTest(symmetricNatTest);
  }

  const p = document.createElement('p');
  testSuite.start().then(function (results) {
    const result = 'Finished the tests';
    console.log(result, results);
    p.innerText = result;
  }, function (err) {
    const result = 'Tests finished with failures';
    console.warn(result, err, err.details);
    p.innerText = result;
    p.style.color = 'red';
  }).then(function () {
    document.body.appendChild(p);
  });
};

const savedIceServers = window.localStorage.getItem('iceServers');
if (iceServers) {
  iceServersEntry.value = savedIceServers;
}
