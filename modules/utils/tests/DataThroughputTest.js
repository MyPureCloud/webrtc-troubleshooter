// Creates a loopback via relay candidates and tries to send as many packets
// with 1024 chars as possible while keeping dataChannel bufferedAmmount above
// zero.

// adapted from https://github.com/webrtc/testrtc/blob/master/src/js/bandwidth_test.js

/* global _ */

import WebrtcCall from '../WebrtcCall';
import { Test } from '../TestSuite';

const $ = require('jQuery');

class DataChannelThroughputTest extends Test {
  constructor () {
    super(...arguments);
    testDurationSeconds = 5.0;
    startTime = null;
    sentPayloadBytes = 0;
    receivedPayloadBytes = 0;

    stopSending = false;

    const makeString = () => {
      samplePacket = '';

      for (let i = 0; i !== 1024; ++i) {
        samplePacket += 'h';
      }
    };
    makeString();

    maxNumberOfPacketsToSend = 1;
    bytesToKeepBuffered = 1024 * maxNumberOfPacketsToSend;
    lastBitrateMeasureTime = null;
    lastReceivedPayloadBytes = 0;

    call = null;
    senderChannel = null;
    receiveChannel = null;
  }
  start () {
    super.start();
    deferred = new $.Deferred();
    log = results = {log: []};
    addLog('info', 'DataChannelThroughputTest starting');

    if (!options.iceServers.length) {
      addLog('fatal', 'No ice servers were provided');
      deferred.reject(_.last(results.log));
    } else {
      call = new WebrtcCall(options);
      call.setIceCandidateFilter(WebrtcCall.isRelay);
      senderChannel = call.pc1.createDataChannel(null);
      senderChannel.addEventListener('open', sendingStep.bind(this));

      call.pc2.addEventListener('datachannel', onReceiverChannel.bind(this));

      call.establishConnection();
    }

    return deferred.promise;
  }
  addLog (level, msg) {
    if (_.isObject(msg)) {
      msg = JSON.stringify;
    }

    results.log.push(`${level} - ${msg}`);
  }
  done () {
    deferred.resolve();
  }
  onReceiverChannel (event) {
    receiveChannel = event.channel;
    receiveChannel.addEventListener('message', onMessageReceived.bind(this));
  }
  sendingStep () {
    const now = new Date();
    if (!startTime) {
      startTime = now;
      lastBitrateMeasureTime = now;
    }

    for (let i = 0; i !== maxNumberOfPacketsToSend; ++i) {
      if (senderChannel.bufferedAmount >= bytesToKeepBuffered) {
        break;
      }
      sentPayloadBytes += samplePacket.length;
      senderChannel.send(samplePacket);
    }

    if (now - startTime >= 1000 * testDurationSeconds) {
      stopSending = true;
    } else {
      throughputTimeout = setTimeout(sendingStep.bind(this), 1);
    }
  }
  onMessageReceived (event) {
    receivedPayloadBytes += event.data.length;
    const now = new Date();
    if (now - lastBitrateMeasureTime >= 1000) {
      let bitrate = (receivedPayloadBytes - lastReceivedPayloadBytes) / (now - lastBitrateMeasureTime);
      bitrate = Math.round(bitrate * 1000 * 8) / 1000;
      addLog('info', `Transmitting at ${bitrate} kbps.`);
      lastReceivedPayloadBytes = receivedPayloadBytes;
      lastBitrateMeasureTime = now;
    }
    if (stopSending && sentPayloadBytes === receivedPayloadBytes) {
      call.close();
      call = null;

      const elapsedTime = Math.round((now - startTime) * 10) / 10000.0;
      const receivedKBits = receivedPayloadBytes * 8 / 1000;
      addLog('info', `Total transmitted: ${receivedKBits} kilo-bits in ${elapsedTime} seconds.`);
      results.stats = {
        receivedKBits,
        elapsedSeconds: elapsedTime
      };
      done();
    }
  }
  destroy () {
    super.destroy();
    window.clearTimeout(throughputTimeout);
    if (call) {
      call.close();
      call = null;
    }
  }
}

export default DataChannelThroughputTest;
