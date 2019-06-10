import WebrtcCall from '../utils/WebrtcCall';
import Test from '../utils/Test';

/**
 * Class to test throughput of a RTC data channel
 */
export default class DataChannelThroughputTest extends Test {

  private testDurationSeconds: number;
  private sentPayloadBytes: number;
  private receivedPayloadBytes: number;
  private maxNumberOfPacketsToSend: number;
  private bytesToKeepBuffered: number;
  private lastBitrateMeasureTime: number;
  private lastReceivedPayloadBytes: number;
  private throughputTimeout: number;

  private samplePacket: string;
  private stopSending: boolean;
  private startTime: Date;
  private call: WebrtcCall;
  private senderChannel: RTCDataChannel;
  private receiveChannel: RTCDataChannel ;

  constructor () {
    super(...arguments);
    this.name = 'Data Throughput Test';
    this.testDurationSeconds = 5.0;
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
    this.lastReceivedPayloadBytes = 0;
  }

  /**
   * Start the test
   */
  public start (): Promise<any> {
    super.start();

    if (!this.options.iceServers.length) {
      this.logger.error('No ice servers were provided');
      this.reject(new Error('No ice servers'));
    } else {
      this.call = new WebrtcCall(this.options, this.logger);
      this.call.setIceCandidateFilter(WebrtcCall.isRelay);
      this.senderChannel = this.call.pc1.createDataChannel(null);
      this.senderChannel.addEventListener('open', this.sendingStep.bind(this));
      this.call.pc2.on('addChannel', this.onReceiverChannel.bind(this));

      this.call.establishConnection();
    }
    return this.promise;
  }

  /**
   * Tear down the test
   */
  public destroy (): void {
    super.destroy();
    window.clearTimeout(this.throughputTimeout);
    if (this.call) {
      this.call.close();
      delete this.call;
    }
  }

  /**
   * Handle a passed in data channel
   * @param channel rtc data channel
   */
  private onReceiverChannel (channel: RTCDataChannel): void {
    this.receiveChannel = channel;
    this.receiveChannel.addEventListener('message', this.onMessageReceived.bind(this));
  }

  /**
   * Step through sending a message
   */
  private sendingStep (): void {
    const now = new Date();
    if (!this.startTime) {
      this.startTime = now;
      this.lastBitrateMeasureTime = now.getTime();
    }

    for (let i = 0; i !== this.maxNumberOfPacketsToSend; ++i) {
      if (this.senderChannel.bufferedAmount >= this.bytesToKeepBuffered) {
        break;
      }
      this.sentPayloadBytes += this.samplePacket.length;
      this.senderChannel.send(this.samplePacket);
    }

    if (now.getTime() - this.startTime.getTime() >= 1000 * this.testDurationSeconds) {
      this.stopSending = true;
    } else {
      this.throughputTimeout = window.setTimeout(this.sendingStep.bind(this), 1);
    }
  }

  /**
   * Handle a new message received
   * @param event message event
   */
  private onMessageReceived (event: MessageEvent): void {
    this.receivedPayloadBytes += event.data.length;
    const now = new Date();
    if (now.getTime() - this.lastBitrateMeasureTime >= 1000) {
      let bitrate = (this.receivedPayloadBytes - this.lastReceivedPayloadBytes) / (now.getTime() - this.lastBitrateMeasureTime);
      bitrate = Math.round(bitrate * 1000 * 8) / 1000;
      this.logger.log(`Transmitting at ${bitrate} kbps.`);
      this.lastReceivedPayloadBytes = this.receivedPayloadBytes;
      this.lastBitrateMeasureTime = now.getTime();
    }
    if (this.stopSending && this.sentPayloadBytes === this.receivedPayloadBytes) {
      this.call.close();
      delete this.call;

      const elapsedTime = Math.round((now.getTime() - this.startTime.getTime()) * 10) / 10000.0;
      const receivedKBits = this.receivedPayloadBytes * 8 / 1000;
      this.logger.log(`${receivedKBits} kb in ${elapsedTime} seconds.`);
      this.resolve();
    }
  }

}
