import TestSuite from '../../src/utils/TestSuite';
import Test from '../../src/utils/Test';

describe('TestSuite', () => {
  let testSuite: TestSuite;
  beforeEach(() => {
    testSuite = new TestSuite();
  });

  describe('addTest()', () => {
    test('should push test to queue', () => {
      testSuite.addTest({
        someTestProp: 'Add Test'
      } as any);
      expect(testSuite['queue'][0]['someTestProp']).toBe('Add Test');
    });
  });

  describe('start()', () => {
    test('should resolve with results if no error', async () => {
      const context = {
        runNextTest: () => Promise.resolve(),
        results: [1, 2, 3]
      };
      const results = await testSuite.start.call(context);
      expect(results).toEqual([1, 2, 3]);
    });

    test('should reject with error if hasError', async () => {
      const context = {
        runNextTest: (val) => Promise.resolve(val),
        results: '',
        hasError: true
      };
      try {
        await testSuite.start.call(context);
        fail('should not get here');
      } catch (e) {
        expect(e.message).toBe('A test failure occurred');
      }
    });
  });

  describe('runNextTest()', () => {
    test('should shift a test from the queue and run next tests', async () => {
      const test1: Test = { name: 'test1', start: jest.fn().mockResolvedValue(null), destroy: jest.fn() } as any;
      const test2: Test = { name: 'test2', start: jest.fn().mockResolvedValue(null), destroy: jest.fn() } as any;
      testSuite['queue'].push(test1);
      testSuite['queue'].push(test2);
      const runNextTestSpy = jest.spyOn(testSuite, 'runNextTest' as any);

      await testSuite.start();
      expect(runNextTestSpy).toHaveBeenCalledTimes(3);
      expect(test1.start).toHaveBeenCalled();
      expect(test2.start).toHaveBeenCalled();
      expect(testSuite['queue'].length).toBe(0);
      runNextTestSpy.mockRestore();
    });
  });

  describe('stopAllTests()', () => {
    test('should call destroy and empty out queue', () => {
      const activeTestMock: Test = {
        destroy: jest.fn()
      } as any;
      testSuite['activeTest'] = activeTestMock;
      testSuite.stopAllTests();
      expect(activeTestMock.destroy).toHaveBeenCalled();
      expect(testSuite['queue'].length).toBe(0);
    });
  });

});
