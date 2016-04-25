/* global PeerConnection, _ */

import { Test } from '../TestSuite';
// const Promise = RSVP.Promise;

class ConnectivityTest extends Test {
  constructor () {
    super(...arguments);
    name = 'Connectivity Test';
  }

  logIceServers () {
    if (options.iceServers) {
      options.iceServers.forEach((iceServer) => {
        log.push(`Info: Using ICE Server: ${iceServer.url}`);
      });
    } else {
      log.push('Info: Using default ICE Servers');
    }
  }

  start () {
    super.start();
    pc1 = new PeerConnection(options);
    pc2 = new PeerConnection(options);

    return new Promise((resolve, reject) => {
      reject = reject;
      var connectivityCheckFailure = window.setTimeout(() => {
        log.push('Error: Connectivity timeout error');
        reject('connectivity timeout');
      }, 10000);
      pc2.on('ice', (candidate) => {
        log.push('Success: pc2 ICE candidate');
        pc1.processIce(candidate);
      });
      pc1.on('ice', (candidate) => {
        log.push('Success: pc1 ICE candidate');
        pc2.processIce(candidate);
      });
      pc2.on('answer', (answer) => {
        log.push('Success: pc2 handle answer');
        pc1.handleAnswer(answer);
      });

      // when pc1 gets the offer, instantly handle the offer by pc2
      pc1.on('offer', (offer) => {
        log.push('Success: pc1 offer');
        pc2.handleOffer(offer, (err) => {
          if (err) {
            log.push('Error: pc2 failed to handle offer');
            reject(err);
          }
          log.push('Success: pc2 handle offer');
          log.push(offer);
          pc2.answer((err, answer) => {
            if (err) {
              log.push('Error: pc2 failed answer');
              reject(err);
            }
            log.push(`Success: pc2 successful ${answer.type}`);
            log.push(answer);
          });
        });
      });
      dataChannel = pc1.createDataChannel('testChannel');

      // generate list of messages to send over data channel
      var messageQueue = _.map(new Array(100), (n, i) => {
        return `message ${i}`;
      });

      var messagesReceived = 0;
      // when the data channel receives a message, remove it from the queue
      dataChannel.onmessage = (msgEvent) => {
        _.remove(messageQueue, (message) => {
          return message === msgEvent.data;
        });
        messagesReceived++;
        // when all messages have been received, we're clear
        if (messageQueue.length === 0) {
          window.clearTimeout(connectivityCheckFailure);
          log.push(`Success: Received ${messagesReceived} messages`);
          resolve();
        }
      };
      // when pc2 gets a data channel, send all messageQueue items on it
      pc2.on('addChannel', (channel) => {
        channel.onopen = () => {
          log.push(`Sending ${messageQueue.length} messages`);
          _.each(_.clone(messageQueue), (message) => {
            channel.send(message);
          });
        };
      });

      // kick it off
      pc1.offer();
    });
  }

  destroy () {
    super.destroy();
    pc1.close();
    pc2.close();
  }
}

export default ConnectivityTest;
