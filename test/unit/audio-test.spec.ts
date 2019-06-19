import AudioTest from '../../src/diagnostics/AudioTest';

describe('AudioTest', () => {
  let audioTest: AudioTest;
  beforeEach(() => {
    audioTest = new AudioTest();
  });

  test('should start() localMedia', async () => {
    const startSpy = jest.spyOn(audioTest['localMedia'], 'start').mockResolvedValue({} as never);
    audioTest['resolve']('Need this to complete the test'); // tslint:disable-line
    await audioTest.start();
    expect(startSpy).toHaveBeenCalledTimes(1);
  });
  test('should stop() localMedia', () => {
    const stopSpy = jest.spyOn(audioTest['localMedia'], 'stop').mockResolvedValue({} as never);
    audioTest.destroy();
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });
});
