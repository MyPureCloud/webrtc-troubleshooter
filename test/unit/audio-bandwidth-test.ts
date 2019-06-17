import AudioBandwidthTest from '../../src/diagnostics/AudioBandwidthTest';
import WebrtcCall from '../../src/utils/WebrtcCall';
import ERROR_CODES from '../../src/utils/testErrorCodes';
import { Logger } from '../../src/types/interfaces';

declare var global: {
  navigator: Navigator,
  MediaStream: { new(...args: any[]) } & MediaStream
} & NodeJS.Global;

describe('AudioBandwidthTest', () => {

  describe('start()', () => {
    test('should return error if iceConfig has no iceServers', async () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [] },
        mediaOptions: { audio: true }
      });
      try {
        await audioBandwidthTest.start();
      } catch (err) {
        expect(err.message).toBe('No ice servers were provided');
      }
    });
    test('should call doGetUserMedia if there are iceServers and return error with results', async () => {
      let error = new Error('Oops, there was a getUserMedia() error');
      const mediaSpy = jest.spyOn(window.navigator.mediaDevices, 'getUserMedia').mockRejectedValueOnce(error);
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      error['pcCode'] = ERROR_CODES.MEDIA;
      try {
        await audioBandwidthTest.start();
        fail('Shouldn\'t get here');
      } catch (e) {
        expect(mediaSpy).toHaveBeenCalledTimes(1);
        expect(e).toEqual(error);
      }
    });
  });

  describe('getResults()', () => {
    test('should return object with log, constraints, and stats', () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: { deviceId: 'someAudioId' } }
      });
      const actual = audioBandwidthTest['getResults']();
      const expected = {
        log: [],
        stats: {},
        constraints: { video: false, audio: { deviceId: 'someAudioId' } }
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('addLog()', () => {
    test('should push message to the log', () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      audioBandwidthTest['addLog']('info', { val: 'Test add log' });
      audioBandwidthTest['addLog']('error', 'my error');
      expect(audioBandwidthTest['log'].length).toBe(2);
    });
  });

  describe('doGetUserMedia()', () => {
    test('should add logs with the track label and return the stream', async () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      const stream = {
        id: '1234-asdf',
        getAudioTracks: () => []
      };
      jest.spyOn(global.navigator.mediaDevices, 'getUserMedia').mockResolvedValueOnce((stream as unknown) as Promise<MediaStream>);

      // .mockReturnValue(Promise.resolve(stream as unknown) as Promise<MediaStream>);
      jest.spyOn(audioBandwidthTest, 'getDeviceName' as any).mockImplementation(() => 'trackName');
      const addLogSpy = jest.spyOn(audioBandwidthTest, 'addLog' as any);
      const resultStream = await audioBandwidthTest['doGetUserMedia']({});

      expect(resultStream).toEqual(stream);
      expect(addLogSpy).toHaveBeenCalledTimes(2);
    });
    test('should add logs with a media error', (done) => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      const constraints = { audio: true, video: false };
      const errorMsg = 'Error on getUserMedia()';
      jest.spyOn(global.navigator.mediaDevices, 'getUserMedia').mockRejectedValueOnce((new Error(errorMsg) as unknown) as Promise<MediaStream>);
      const addLogSpy = jest.spyOn(audioBandwidthTest, 'addLog' as any).mockImplementation((...args) => null);

      let expected = new Error(errorMsg);
      expected['pcCode'] = ERROR_CODES.MEDIA;

      audioBandwidthTest['doGetUserMedia'](constraints)
        .then(() => done.fail('Should not get here'))
        .catch(err => {
          console.log('err', err);
          expect(err).toEqual(expected);
          expect(addLogSpy).toHaveBeenCalledTimes(3);
          done();
        });
    });
  });

  describe('getDeviceName()', () => {
    test('should return null if tracks are empty', () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      expect(audioBandwidthTest['getDeviceName']([])).toBeNull();
    });
    test('should return label of first track if not empty', () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      const actual = audioBandwidthTest['getDeviceName']([
        {
          label: 'Plantronics'
        }
      ] as MediaStreamTrack[]);
      const expected = 'Plantronics';
      expect(actual).toBe(expected);
    });
  });

  describe('setupCall()', () => {
    test('should call establishConnection function and addLog function', async () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      audioBandwidthTest['call'] = new WebrtcCall(audioBandwidthTest['options'].iceConfig, audioBandwidthTest['logger']);

      const callConnectionSpy = jest.spyOn(audioBandwidthTest['call'], 'establishConnection').mockResolvedValueOnce();
      const addTrackSpy = spyOn(audioBandwidthTest['call'].pc1['pc'], 'addTrack');
      const mockTrack = new global.MediaStream({ audio: true });

      await audioBandwidthTest['setupCall'](mockTrack);
      expect(callConnectionSpy).toHaveBeenCalledTimes(1);
      expect(addTrackSpy).toHaveBeenCalledTimes(1);
      expect(audioBandwidthTest['localTrack']).toEqual(mockTrack.getTracks()[0]);
    });
  });

  describe('runTest()', () => {
    test('should run gatherStats function', async () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      audioBandwidthTest['durationMs'] = 4;
      const gatherStatsSpy = jest.spyOn(audioBandwidthTest, 'gatherStats' as any).mockResolvedValueOnce({ prop: 'some Properties' });
      const actual = await audioBandwidthTest['runTest']();
      const expected = { prop: 'some Properties' };
      expect(gatherStatsSpy).toHaveBeenCalled();
      expect(actual).toEqual(expected);
    });
  });

  describe('gatherStats()', () => {
    test('should resolve if starttime difference is large enough between durationMs', async () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      const past = new Date().getTime() - 3000;
      audioBandwidthTest['startTime'] = new Date(past);
      audioBandwidthTest['durationMs'] = 3;
      const spy = jest.fn();
      audioBandwidthTest['call'] = { pc1: { getStats: spy } as unknown } as WebrtcCall;
      await audioBandwidthTest['gatherStats']();
      expect(spy).not.toHaveBeenCalled();
    });
    test('should call gotStats', async () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      const mockStats = {};
      audioBandwidthTest['durationMs'] = 10000;
      audioBandwidthTest['startTime'] = new Date();
      audioBandwidthTest['call'] = new WebrtcCall(audioBandwidthTest['options'].iceConfig, audioBandwidthTest['logger']);
      const getStatsSpy = jest.spyOn(audioBandwidthTest['call'].pc1.pc, 'getStats').mockResolvedValueOnce(Promise.resolve(mockStats as any));
      const gotStatsSpy = jest.spyOn(audioBandwidthTest, 'gotStats' as any).mockResolvedValueOnce({ stats: 'some stats' });
      await audioBandwidthTest['gatherStats']();

      expect(getStatsSpy).toHaveBeenCalledTimes(1);
      expect(gotStatsSpy).toHaveBeenCalledWith(mockStats);
    });
  });

  describe('getStats()', () => {
    const fakeRTCStatsReport = {
      forEach: function (callback) {
        callback(fakeRTCStatsReport.values);
      },
      values: {
        id: 'RTCfake_id_103',
        availableOutgoingBitrate: 300000,
        roundTripTime: 34423343,
        currentRoundTripTime: '30',
        timestamp: 1560778204847,
        type: 'fake'
      },
      get: function (key) {
        return fakeRTCStatsReport.values[key];
      }
    } as unknown as RTCStatsReport;

    test('should call rttStats if currentRoundTripTime', async () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      const rttStatsSpy = jest.spyOn(audioBandwidthTest['rttStats'], 'add');
      jest.spyOn(audioBandwidthTest, 'runTest' as any).mockResolvedValueOnce({});

      await audioBandwidthTest['gotStats'](fakeRTCStatsReport);
      const rttValue = parseFloat(fakeRTCStatsReport.get('currentRoundTripTime')) * 1000;
      expect(rttStatsSpy).nthCalledWith(1, fakeRTCStatsReport.get('timestamp'), rttValue);
    });

    test('should call rttStats and bweStats if availableOutgoingBitrate and roundTripTime', async () => {
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      const rttStatsSpy = jest.spyOn(audioBandwidthTest['rttStats'], 'add');
      const bweStatsSpy = jest.spyOn(audioBandwidthTest['bweStats'], 'add');
      jest.spyOn(audioBandwidthTest, 'runTest' as any).mockResolvedValueOnce({});

      await audioBandwidthTest['gotStats'](fakeRTCStatsReport);
      const bweValue = parseInt(fakeRTCStatsReport.get('availableOutgoingBitrate'), 10);
      const rttValue = parseFloat(fakeRTCStatsReport.get('roundTripTime'));
      expect(rttStatsSpy).nthCalledWith(2, fakeRTCStatsReport.get('timestamp'), rttValue);
      expect(bweStatsSpy).nthCalledWith(1, fakeRTCStatsReport.get('timestamp'), bweValue);
    });
  });

  describe('completed()', () => {
    test.skip('should call addLog multiple times and return results', () => {
      fail('This test does not make sense. `this.results` is never set in AudioBandwidthTest.');

      // const audioBandwidthTest = new AudioBandwidthTest({
      //   iceConfig: { iceServers: [{ urls: [] }] },
      //   mediaOptions: { audio: true }
      // });

      // sinon.stub(audioBandwidthTest, 'addLog');
      // const mockResults = {};
      // audioBandwidthTest.results = mockResults;

      // const results = audioBandwidthTest.completed();
      // t.is(results, mockResults);
      // sinon.assert.callCount(audioBandwidthTest.addLog, 6);
    });
  });
  describe('destroy()', () => {
    test('should call close, delete the call, and stop localTrack', () => {
      const logger: Logger = { log () { }, error () { }, warn () { }, info () { } }; //tslint:disable-line
      const audioBandwidthTest = new AudioBandwidthTest({
        iceConfig: { iceServers: [{ urls: [] }] },
        mediaOptions: { audio: true }
      });
      const stopTrackSpy = jest.fn();
      audioBandwidthTest['call'] = new WebrtcCall(audioBandwidthTest['options'].iceConfig, logger);
      audioBandwidthTest['localTrack'] = { stop: stopTrackSpy } as any;

      const callSpy = jest.spyOn(audioBandwidthTest['call'], 'close').mockImplementation(() => null);

      audioBandwidthTest.destroy();
      expect(callSpy).toHaveBeenCalled();
      expect(stopTrackSpy).toHaveBeenCalled();
      expect(audioBandwidthTest['call']).toBeFalsy();
    });
  });
});
