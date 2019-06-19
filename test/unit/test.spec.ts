import Test from '../../src/utils/Test';

class UtilsTest extends Test {
  constructor (...args: any[]) {
    super(args);
  }
}

describe('Test', () => {
  let utilsTest: Test;
  beforeEach(() => {
    utilsTest = new UtilsTest({
      logger: {
        log: () => null
      }
    });
  });

  describe('start()', () => {
    test('should call reject with error if after timeout', async () => {
      utilsTest['defaultTimeout'] = 10;
      window.setTimeout(() => {
        utilsTest['resolve'](); // tslint:disable-line
      }, 20);
      try {
        await utilsTest.start();
        fail('should not get here');
      } catch (e) {
        expect(e.message).toBe('Test Timeout');
      }
    });
  });

  describe('resolve()', () => {
    test('should resolve promise', (done) => {
      const resolvedValues = ['Rocky', 'Rambo', 'Predator', 'Chinese Connection'];
      utilsTest['resolve'](resolvedValues); // tslint:disable-line
      utilsTest.start().then((res) => {
        expect(res).toEqual(resolvedValues);
        done();
      }).catch((e) => {
        console.error(e);
        fail('should not get here');
      });
    });
  });

  describe('reject()', () => {
    test('should reject promise with error', (done) => {
      const rejectError = new Error('Rejected promise');
      utilsTest['reject'](rejectError); // tslint:disable-line
      utilsTest.start().then(() => {
        fail('should not get here');
      }).catch((e) => {
        expect(e.message).toEqual('Rejected promise');
        done();
      });
    });
  });

  describe('destroy()', () => {
    test('should clear the timeoutHandle', () => {
      const fakeTimeoutHandle = 987654321;
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
      utilsTest['timeoutHandle'] = fakeTimeoutHandle;
      utilsTest.destroy();
      expect(clearTimeoutSpy).toHaveBeenCalledWith(fakeTimeoutHandle);
    });
  });

});
