// import test from 'ava';
// import sinon from 'sinon';

// import TestSuite from '../../src/utils/TestSuite';

// let testSuite;
// test.beforeEach(() => {
//   testSuite = new TestSuite({
//     // logger: {
//     //   info: () => {}
//     // }
//   });
// });

// test('addTest(test) should push test to queue', t => {
//   testSuite.addTest({
//     someTestProp: 'Add Test'
//   });
//   t.is(testSuite.queue[0].someTestProp, 'Add Test');
// });

// test('start() should resolve with results if no error', t => {
//   const context = {
//     runNextTest: () => Promise.resolve(),
//     results: [1, 2, 3]
//   };
//   return testSuite.start.call(context)
//     .then(results => {
//       t.deepEqual(results, [1, 2, 3]);
//     });
// });

// test('start() should reject with error if hasError', t => {
//   const context = {
//     runNextTest: (val) => Promise.resolve(val),
//     results: '',
//     hasError: true
//   };
//   return testSuite.start.call(context)
//     .then(results => t.fail('should not get here'))
//     .catch(err => {
//       t.is(err.message, 'A test failure occurred');
//     });
// });

// test('runNextTest() should shift a test from the queue and run next tests', t => {
//   t.plan(0);
//   // const testSuite = new TestSuite({
//   //   logger: {
//   //     info: () => {},
//   //     log: () => {}
//   //   }
//   // });
//   testSuite.queue.push({
//     start: () => Promise.resolve(),
//     destroy: sinon.stub()
//   });
//   testSuite.runNextTest();
// });

// test('stopAllTests() should call destroy and empty out queue', t => {
//   testSuite.activeTest = {
//     destroy: sinon.stub()
//   };
//   testSuite.stopAllTests();
//   t.is(testSuite.activeTest.destroy.called, true);
//   t.is(testSuite.queue.length, 0);
// });
