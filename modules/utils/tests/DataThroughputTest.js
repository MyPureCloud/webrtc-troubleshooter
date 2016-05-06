import WebrtcCall from '../WebrtcCall';
import { Test } from '../TestSuite';

class DataChannelThroughputTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Data Throughput Test';
    this.testDurationSeconds = 5.0;
    this.startTime = null;
    this.sentPayloadBytes = 0;
    this.receivedPayloadBytes = 0;

    this.stopSending = false;

    const makeString = () => {
      this.samplePacket = '';

      for (let i = 0; i !== 1024; ++i) {
        this.samplePacket += 'h';
      }
    };
    makeString();

    this.maxNumberOfPacketsToSend = 1;
    this.bytesToKeepBuffered = 1024 * this.maxNumberOfPacketsToSend;
    this.lastBitrateMeasureTime = null;
    this.lastReceivedPayloadBytes = 0;

    this.call = null;
    this.senderChannel = null;
    this.receiveChannel = null;
  }
  start () {
    super.start();

    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;

      if (!this.options.iceServers.length) {
        this.logger.error('webrtc-troubleshooter: No ice servers were provided');
        reject('No ice servers');
      } else {
        this.call = new WebrtcCall(this.options);
        this.call.setIceCandidateFilter(WebrtcCall.isRelay);
        this.senderChannel = this.call.pc1.createDataChannel(null);
        this.senderChannel.addEventListener('open', this.sendingStep.bind(this));
        this.call.pc2.addEventListener('datachannel', this.onReceiverChannel.bind(this));

        this.call.establishConnection();
      }
    });
  }

  done () {
    this.resolve();
  }
  
  onReceiverChannel (event) {
    this.receiveChannel = event.channel;
    this.receiveChannel.addEventListener('message', this.onMessageReceived.bind(this));
  }

  sendingStep () {
    const now = new Date();
    if (!this.startTime) {
      this.startTime = now;
      this.lastBitrateMeasureTime = now;
    }

    for (let i = 0; i !== this.maxNumberOfPacketsToSend; ++i) {
      if (this.senderChannel.bufferedAmount >= this.bytesToKeepBuffered) {
        break;
      }
      this.sentPayloadBytes += this.samplePacket.length;
      this.senderChannel.send(this.samplePacket);
    }

    if (now - this.startTime >= 1000 * this.testDurationSeconds) {
      this.stopSending = true;
    } else {
      this.throughputTimeout = setTimeout(this.sendingStep.bind(this), 1);
    }
  }

  onMessageReceived (event) {
    this.receivedPayloadBytes += event.data.length;
    const now = new Date();
    if (now - this.lastBitrateMeasureTime >= 1000) {
      let bitrate = (this.receivedPayloadBytes - this.lastReceivedPayloadBytes) / (now - this.lastBitrateMeasureTime);
      bitrate = Math.round(bitrate * 1000 * 8) / 1000;
      this.logger.log(`webrtc-troubleshooter: Transmitting at ${bitrate} kbps.`);
      this.lastReceivedPayloadBytes = this.receivedPayloadBytes;
      this.lastBitrateMeasureTime = now;
    }
    if (this.stopSending && this.sentPayloadBytes === this.receivedPayloadBytes) {
      this.call.close();
      this.call = null;
  
      const elapsedTime = Math.round((now - this.startTime) * 10) / 10000.0;
      const receivedKBits = this.receivedPayloadBytes * 8 / 1000;
      this.logger.log(`webrtc-troubleshooter: ${receivedKBits} kilo-bits in ${elapsedTime} seconds.`);
      this.done();
    }
  }

  destroy () {
    super.destroy();
    window.clearTimeout(this.throughputTimeout);
    if (this.call) {
      this.call.close();
      this.call = null;
    }
  }
}

export default DataChannelThroughputTest;

