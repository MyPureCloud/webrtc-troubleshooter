import VideoTest from '../../src/diagnostics/VideoTest';

describe('VideoTest', () => {
  let videoTest: VideoTest;
  beforeEach(() => {
    videoTest = new VideoTest();
  });

  describe('start()', () => {
    test('should call localMedia.start() & localMedia.stop()', async () => {
      const fakeStream = {
        getVideoTracks: () => [{ id: 'hash1234' }]
      };
      const context = {
        logger: {
          log: () => null
        },
        resolve: jest.fn(),
        localMedia: {
          start: jest.fn(),
          stop: jest.fn(),
          on: (event, callback) => {
            callback(fakeStream);
          }
        }
      };
      await videoTest.start.call(context);
      expect(context.resolve).toHaveBeenCalled();
      expect(context.localMedia.start).toHaveBeenCalled();
      expect(context.localMedia.stop).toHaveBeenCalled();
    });
  });

});
