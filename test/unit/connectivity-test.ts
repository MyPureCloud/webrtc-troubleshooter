import ConnectivityTest from '../../src/diagnostics/ConnectivityTest';
import { Logger } from '../../src/types/interfaces';

describe('ConnectivityTest', () => {
  let connectivityTest: ConnectivityTest | null;
  const fakeLogger: Logger = { log () { }, error () { }, warn () { }, info () { } }; //tslint:disable-line

  afterEach(() => {
    connectivityTest = null;
  });

  describe('logIceServers()', () => {
    test('should call logger.log and log iceServer.urls if they exist', () => {
      const options = {
        iceServers: [{ urls: ['https://chucknorris.com/'] }],
        logger: fakeLogger
      };
      const loggerSpy = jest.spyOn(fakeLogger, 'log');
      connectivityTest = new ConnectivityTest(options);
      connectivityTest['logIceServers']();
      expect(loggerSpy).toHaveBeenCalledWith(`Using ICE Server: ${options.iceServers[0].urls[0]}`);
    });

    test('should call logger.error if there is are no iceServers', () => {
      const options = {
        iceServers: [],
        logger: fakeLogger
      };
      const loggerSpy = jest.spyOn(fakeLogger, 'error');
      connectivityTest = new ConnectivityTest(options);
      connectivityTest['logIceServers']();
      expect(loggerSpy).toHaveBeenCalledWith('no ice servers provided');
    });
  });

  describe('destroy()', () => {
    test('should close peer connection', () => {
      connectivityTest = new ConnectivityTest({});
      connectivityTest['pc1'] = {
        close: jest.fn()
      } as any;
      connectivityTest['pc2'] = {
        close: jest.fn()
      } as any;

      connectivityTest.destroy();
      expect(connectivityTest['pc1'].close).toHaveBeenCalled();
      expect(connectivityTest['pc2'].close).toHaveBeenCalled();
    });
  });
});
