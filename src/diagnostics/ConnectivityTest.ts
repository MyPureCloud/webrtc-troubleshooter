import Test from '../utils/Test';
import PeerConnection from 'rtcpeerconnection';

/**
 * Class to test connectivity
 */
export default class ConnectivityTest extends Test {

  private pc1: PeerConnection;
  private pc2: PeerConnection;
  private dataChannel: RTCDataChannel;

  constructor () {
    super(...arguments);
    this.name = 'Connectivity Test';
  }

  /**
   * Start the test
   */
  public start (): Promise<any> {
    super.start(); // tslint:disable-line
    this.logIceServers();
    this.pc1 = new PeerConnection(this.options);
    this.pc2 = new PeerConnection(this.options);

    const connectivityCheckFailure = window.setTimeout(() => {
      this.logger.error('Connectivity timeout error');
      return this.reject(new Error('connectivity timeout'));
    }, 10000);
    this.pc2.on('ice', (candidate) => {
      this.logger.log('pc2 ICE candidate', candidate);
      this.pc1.processIce(candidate);
    });
    this.pc1.on('ice', (candidate) => {
      this.logger.log('pc1 ICE candidate', candidate);
      this.pc2.processIce(candidate);
    });
    this.pc2.on('answer', (answer) => {
      this.logger.log('pc2 handle answer');
      this.pc1.handleAnswer(answer);
    });

    // when pc1 gets the offer, instantly handle the offer by pc2
    this.pc1.on('offer', (offer) => {
      this.logger.log('pc1 offer');
      this.pc2.handleOffer(offer, (err) => {
        if (err) {
          this.logger.error('pc2 failed to handle offer');
          return this.reject(err);
        }
        this.logger.log('pc2 handle offer');
        this.pc2.answer((err, answer) => {
          if (err) {
            this.logger.error('pc2 failed answer');
            return this.reject(err);
          }
          this.logger.log(`pc2 successful ${answer.type}`);
        });
      });
    });
    this.dataChannel = this.pc1.createDataChannel('testChannel');

    // generate list of messages to send over data channel
    const messageQueue = Array.apply(null, { length: 100 }).map((n, i) => {
      return `message ${i}`;
    });

    // duplicating this is faster than cloning it
    const messageQueue2 = Array.apply(null, { length: 100 }).map((n, i) => {
      return `message ${i}`;
    });

    let messagesReceived = 0;
    // when the data channel receives a message, remove it from the queue
    this.dataChannel.onmessage = (msgEvent) => {
      const message = messageQueue.find((message) => {
        return message === msgEvent.data;
      });
      this.logger.debug('got a message', message);
      messageQueue.splice(messageQueue.indexOf(message), 1);
      messagesReceived++;
      // when all messages have been received, we're clear
      if (messageQueue.length === 0) {
        window.clearTimeout(connectivityCheckFailure);
        this.logger.log(`Received ${messagesReceived} messages`);
        return this.resolve();
      }
    };
    // when pc2 gets a data channel, send all messageQueue items on it
    this.pc2.on('addChannel', (channel) => {
      channel.onopen = () => {
        this.logger.log(`Sending ${messageQueue.length} messages`);
        messageQueue2.forEach(channel.send.bind(channel));
      };
    });

    // kick it off
    this.pc1.offer();
    return this.promise;
  }

  /**
   * Tear down the test
   */
  public destroy (): void {
    super.destroy();
    this.pc1.close();
    this.pc2.close();
  }

  /**
   * Log configured ice servers
   */
  private logIceServers (): void {
    if (this.options.iceServers) {
      this.options.iceServers.forEach((iceServer: RTCIceServer) => {
        this.logger.log(`Using ICE Server: ${iceServer.urls}`);
      });
      if (this.options.iceServers.length === 0) {
        this.logger.error('no ice servers provided');
      }
    } else {
      this.logger.log('Using default ICE Servers');
    }
  }
}
