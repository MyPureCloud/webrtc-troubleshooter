import { CameraResolutionTest } from '../../src/diagnostics/CameraResolutionTest';
import { Logger } from '../../src/types/interfaces';

describe('CameraResolutionTest', () => {
  const RESOLUTION: [number, number] = [320, 640];
  const DURATION = 30;
  const fakeLogger: Logger = { log () { }, error () { }, warn () { }, info () { } }; //tslint:disable-line
  let cameraResolutionTest: CameraResolutionTest;
  beforeEach(() => {
    cameraResolutionTest = new CameraResolutionTest([RESOLUTION], {
      duration: DURATION,
      logger: fakeLogger
    });
  });

  describe('start()', () => {
    test('should call log function and startGetUserMedia and resolve with results if no error', async () => {
      const startGetUserMediaSpy = jest.spyOn(cameraResolutionTest, 'startGetUserMedia' as any).mockResolvedValueOnce(null);
      const getResultsSpy = jest.spyOn(cameraResolutionTest, 'getResults' as any).mockResolvedValueOnce(null);
      await cameraResolutionTest.start();
      expect(startGetUserMediaSpy).toHaveBeenCalledTimes(1);
      expect(startGetUserMediaSpy).toHaveBeenCalledWith(RESOLUTION);
      expect(getResultsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getResults()', () => {
    test('should return object with results', () => {
      const mockLog = ['foo', 'bar'];
      const mockStats = { foo: 'bar' };
      cameraResolutionTest['log'] = mockLog;
      cameraResolutionTest['stats'] = mockStats as any;
      const results = cameraResolutionTest['getResults']();
      expect(results).toEqual({
        log: mockLog,
        stats: mockStats,
        resolutions: [RESOLUTION],
        duration: DURATION
      });
    });
  });

  describe('reportSuccess(str)', () => {
    test('should push string onto log and log message', () => {
      const message = 'Here is a log message';
      const loggerSpy = jest.spyOn(cameraResolutionTest['logger'], 'log');
      cameraResolutionTest['reportSuccess'](message);
      expect(cameraResolutionTest['log']).toEqual([message]);
      expect(loggerSpy).toHaveBeenCalledWith(`SUCCESS: ${message}`);
    });
  });

  describe('reportInfo(str)', () => {
    test('should call logger.info()', () => {
      const message = 'Here is a log message';
      const loggerSpy = jest.spyOn(cameraResolutionTest['logger'], 'info');
      cameraResolutionTest['reportInfo'](message);
      expect(cameraResolutionTest['log']).toEqual([]);
      expect(loggerSpy).toHaveBeenCalledWith(message);
    });
  });

  describe('reportError(err)', () => {
    test('should push string onto log and log message', () => {
      const message = 'Here is a log message';
      const loggerSpy = jest.spyOn(cameraResolutionTest['logger'], 'warn');
      cameraResolutionTest['reportError'](message);
      expect(cameraResolutionTest['log']).toEqual([message]);
      expect(loggerSpy).toHaveBeenCalledWith(message);
      expect(cameraResolutionTest['hasError']).toBe(true);
    });
  });

  describe('startGetUserMedia()', () => {
    let getUserMediaSpy: jest.SpyInstance;
    let maybeContinueGetUserMediaSpy: jest.SpyInstance;
    let collectAndAnalyzeStatsSpy: jest.SpyInstance;
    beforeEach(() => {
      getUserMediaSpy = jest.spyOn(navigator.mediaDevices, 'getUserMedia');
      maybeContinueGetUserMediaSpy = jest.spyOn(cameraResolutionTest, 'maybeContinueGetUserMedia' as any);
      collectAndAnalyzeStatsSpy = jest.spyOn(cameraResolutionTest, 'collectAndAnalyzeStats' as any).mockImplementationOnce(() => null);
    });

    test('should call getUserMedia() and maybeContinueGetUserMedia() if resolution length is greater than 1', async () => {
      cameraResolutionTest['resolutions'] = [RESOLUTION, [1080, 1300]];
      await cameraResolutionTest['startGetUserMedia'](RESOLUTION);
      expect(getUserMediaSpy).toHaveBeenCalled();
      expect(maybeContinueGetUserMediaSpy).toHaveBeenCalled();
      expect(collectAndAnalyzeStatsSpy).not.toHaveBeenCalled();
    });

    test('should call getUserMedia(), collectAndAnalyzeStatsSpy(), and logger.log() if resolution length is not greater than 1', async () => {
      const loggerSpy = jest.spyOn(cameraResolutionTest['logger'], 'log');

      cameraResolutionTest['resolutions'] = [RESOLUTION];
      await cameraResolutionTest['startGetUserMedia'](RESOLUTION);
      expect(getUserMediaSpy).toHaveBeenCalled();
      expect(maybeContinueGetUserMediaSpy).not.toHaveBeenCalled();
      expect(collectAndAnalyzeStatsSpy).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('collecting');
    });
  });

  describe('arrayAverage()', () => {
    test('should compute array average', () => {
      const actual = cameraResolutionTest['arrayAverage']([1, 2, 3, 4, 5]);
      expect(actual).toBe(3);
    });
  });

  describe('collectAndAnalyzeStats()', () => {
    test.skip('should write some tests', () => {
      fail('We should test the logic in this method');
    });
  });
});
