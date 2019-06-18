import DataThroughPutTest from '../../src/diagnostics/DataThroughputTest';

describe('DataThroughPutTest', () => {
  let dataThroughPutTest: DataThroughPutTest;
  beforeEach(() => {
    dataThroughPutTest = new DataThroughPutTest({
      iceServers: [],
      logger: {
        error: () => { } // tslint:disable-line
      }
    });
  });

  describe('start()', () => {
    test('should reject if there is now iceServers', async () => {
      try {
        await dataThroughPutTest.start();
        fail('It should have failed');
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });

    test.skip('should setup webrtc call', async () => {
      fail('Write tests for this');
      // previous test had:
      //   sinon.stub(dataThroughPutTest, 'sendingStep');
      //   dataThroughPutTest.options.iceServers.push({});
      //   dataThroughPutTest.start();
      //   // todo: assertions about event listners n such
      //   t.plan(0);
    });
  });

  describe('onReceiverChannel()', () => {
    test('should addEventListener', () => {
      const mockChannel = {
        addEventListener: jest.fn()
      };
      dataThroughPutTest['onReceiverChannel'](mockChannel as any);
      expect(mockChannel.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(dataThroughPutTest['receiveChannel']).toEqual(mockChannel);
    });
  });

  describe('sendingStep()', () => {
    test('should send packets', () => {
      const context = {
        maxNumberOfPacketsToSend: 5,
        senderChannel: {
          bufferedAmount: 5,
          send: jest.fn()
        },
        bytesToKeepBuffered: 6,
        samplePacket: [{ prop: 'val 1' }, { prop: 'val 2' }],
        startTime: {
          getTime: () => 255
        },
        testDurationSeconds: 9
      };
      dataThroughPutTest['sendingStep'].call(context);
      expect(context.senderChannel.send).toHaveBeenCalled();
    });
  });

  describe('onMessageReceived()', () => {
    test('should compute values but not resolve if now - this.lastBitrateMeasureTime >= 1000', () => {
      const context = {
        lastBitrateMeasureTime: 0,
        receivedPayloadBytes: 1000,
        lastReceivedPayloadBytes: 80,
        stopSending: true,
        call: {
          close: jest.fn()
        },
        logger: {
          log: jest.fn()
        },
        resolve: () => { } // tslint:disable-line
      };
      dataThroughPutTest['onMessageReceived'].call(
        context,
        { data: [] }
      );
      expect(context.logger.log).toHaveBeenCalled();
    });
  });

  describe('destroy()', () => {
    test('should call close()', () => {
      const fakeCall = {
        close: jest.fn()
      } as any;
      dataThroughPutTest['call'] = fakeCall;
      dataThroughPutTest.destroy();
      expect(fakeCall.close).toHaveBeenCalled();
      expect(dataThroughPutTest['call']).toBeFalsy();
    });
  });

});
