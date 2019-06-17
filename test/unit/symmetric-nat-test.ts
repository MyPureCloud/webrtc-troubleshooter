// import test from 'ava';
// import sinon from 'sinon';

// import SymmetricNatTest from '../../src/diagnostics/SymmetricNatTest';

// let audioTest;
// test.beforeEach(() => {
//   audioTest = new SymmetricNatTest();
// });

// test.serial('should result in asymmetric if it gets a single srflx candidate', t => {
//   sinon.stub(window.RTCPeerConnection.prototype, 'setLocalDescription').callsFake(function () {
//     window.setTimeout(() => {
//       this.onicecandidate({
//         candidate: {
//           candidate: 'candidate:842163049 1 udp 1677729535 168.215.121.226 58600 typ srflx raddr 172.18.177.27 rport 58600 generation 0 ufrag iksf network-cost 50'
//         }
//       });
//     }, 100);
//     window.setTimeout(() => {
//       this.onicecandidate({
//         candidate: {
//           candidate: 'candidate:1960250409 1 udp 2113937151 172.18.177.27 58600 typ host generation 0 ufrag iksf network-cost 50'
//         }
//       });
//     }, 50);
//     window.setTimeout(() => {
//       this.onicecandidate({});
//     }, 1000);
//   });

//   const done = audioTest.start();
//   return done.then(res => {
//     t.is(res, 'nat.asymmetric');
//   });
// });

// test.serial('should result in noSrflx if it gets no candidates', t => {
//   window.RTCPeerConnection.prototype.setLocalDescription.restore();
//   sinon.stub(window.RTCPeerConnection.prototype, 'setLocalDescription').callsFake(function () {
//     window.setTimeout(() => {
//       this.onicecandidate({});
//     }, 1000);
//   });

//   const done = audioTest.start();
//   return done.then(res => {
//     t.is(res, 'nat.noSrflx');
//   });
// });

// test.serial('should result in noSrflx if it gets only host candidates candidates', t => {
//   window.RTCPeerConnection.prototype.setLocalDescription.restore();
//   sinon.stub(window.RTCPeerConnection.prototype, 'setLocalDescription').callsFake(function () {
//     window.setTimeout(() => {
//       this.onicecandidate({
//         candidate: {
//           candidate: 'candidate:1960250409 1 udp 2113937151 172.18.177.27 58600 typ host generation 0 ufrag iksf network-cost 50'
//         }
//       });
//     }, 50);
//     window.setTimeout(() => {
//       this.onicecandidate({});
//     }, 1000);
//   });

//   const done = audioTest.start();
//   return done.then(res => {
//     t.is(res, 'nat.noSrflx');
//   });
// });

// test.serial('should result in noSrflx if it gets only host candidates candidates', t => {
//   const audioTest = new SymmetricNatTest();
//   window.RTCPeerConnection.prototype.setLocalDescription.restore();
//   sinon.stub(window.RTCPeerConnection.prototype, 'setLocalDescription').callsFake(function () {
//     window.setTimeout(() => {
//       this.onicecandidate({
//         candidate: {
//           candidate: 'candidate:1960250409 1 udp 2113937151 172.18.177.27 58600 typ host generation 0 ufrag iksf network-cost 50'
//         }
//       });
//     }, 50);
//     window.setTimeout(() => {
//       this.onicecandidate({});
//     }, 1000);
//   });

//   const done = audioTest.start();
//   return done.then(res => {
//     t.is(res, 'nat.noSrflx');
//   });
// });

// test.serial('should result in symmetric if it gets different ports for the same related port', t => {
//   const audioTest = new SymmetricNatTest();
//   window.RTCPeerConnection.prototype.setLocalDescription.restore();
//   sinon.stub(window.RTCPeerConnection.prototype, 'setLocalDescription').callsFake(function () {
//     window.setTimeout(() => {
//       this.onicecandidate({
//         candidate: {
//           candidate: 'candidate:842163049 1 udp 1677729535 168.215.121.226 58700 typ srflx raddr 172.18.177.27 rport 58600 generation 0 ufrag iksf network-cost 50'
//         }
//       });
//     }, 50);
//     window.setTimeout(() => {
//       this.onicecandidate({
//         candidate: {
//           candidate: 'candidate:842163049 1 udp 1677729535 168.215.121.226 58600 typ srflx raddr 172.18.177.27 rport 58600 generation 0 ufrag iksf network-cost 50'
//         }
//       });
//     }, 100);
//     window.setTimeout(() => {
//       this.onicecandidate({});
//     }, 1000);
//   });

//   const done = audioTest.start();
//   return done.then(res => {
//     t.is(res, 'nat.symmetric');
//   });
// });
