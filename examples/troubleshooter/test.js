/* global WebRTCTroubleshooter */
let video = true;
let audio = true;

let iceServers = [];
const webRTCTroubleshooter = WebRTCTroubleshooter;
const testSuite = new webRTCTroubleshooter.TestSuite();

const iceServersEntry = document.getElementById('ice-servers');
const runButton = document.getElementById('run-button');

const testCompleted = function (test, success, res) {
  console.log('test completed', test.name, success ? 'success' : 'failure', res, res ? res.details : 'no results');
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
    audioTest.deferred.promise.then(testCompleted.bind(null, audioTest, true), testCompleted.bind(null, audioTest, false));
    testSuite.addTest(audioTest);
  }

  if (video) {
    const videoTest = new webRTCTroubleshooter.VideoTest(mediaOptions);
    videoTest.deferred.promise.then(testCompleted.bind(null, videoTest, true), testCompleted.bind(null, videoTest, false));
    const advancedCameraTest = new webRTCTroubleshooter.AdvancedCameraTest(mediaOptions);
    advancedCameraTest.deferred.promise.then(testCompleted.bind(null, advancedCameraTest, true), testCompleted.bind(null, advancedCameraTest, false));
    const bandwidthTest = new webRTCTroubleshooter.VideoBandwidthTest({ iceConfig: iceConfig, mediaOptions: mediaOptions });
    bandwidthTest.deferred.promise.then(testCompleted.bind(null, bandwidthTest, true), testCompleted.bind(null, bandwidthTest, false));

    testSuite.addTest(videoTest);
    testSuite.addTest(advancedCameraTest);
    testSuite.addTest(bandwidthTest);
  }

  if (window.RTCPeerConnection) {
    const connectivityTest = new webRTCTroubleshooter.ConnectivityTest(iceConfig);
    connectivityTest.deferred.promise.then(testCompleted.bind(null, connectivityTest, true), testCompleted.bind(null, connectivityTest, false));
    const throughputTest = new webRTCTroubleshooter.ThroughputTest(iceConfig);
    throughputTest.deferred.promise.then(testCompleted.bind(null, throughputTest, true), testCompleted.bind(null, throughputTest, false));

    testSuite.addTest(connectivityTest);
    testSuite.addTest(throughputTest);
  }

  testSuite.start().then(function (results) {
    console.log('Finished the tests', results);
  }, function (err) {
    console.warn('test failure', err, err.details);
  });
};

const savedIceServers = window.localStorage.getItem('iceServers');
if (iceServers) {
  iceServersEntry.value = savedIceServers;
}
