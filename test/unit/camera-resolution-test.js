import test from 'ava';
import sinon from 'sinon';

import CameraResolutionTest from '../../src/diagnostics/CameraResolutionTest';

let cameraResolutionTest;
test.beforeEach(() => {
  cameraResolutionTest = new CameraResolutionTest([[320, 640]], {
    duration: 30,
    logger: { log () {}, warn () {}, info () {} }
  });
});

test.serial('start() should call log function and startGetUserMedia and resolve with results if no error', async t => {
  sinon.stub(cameraResolutionTest, 'startGetUserMedia').returns(Promise.resolve());
  sinon.stub(cameraResolutionTest, 'getResults');
  await cameraResolutionTest.start();
  sinon.assert.calledOnce(cameraResolutionTest.startGetUserMedia);
  sinon.assert.calledWith(cameraResolutionTest.startGetUserMedia, [320, 640]);
  sinon.assert.calledOnce(cameraResolutionTest.getResults);
});

test('getResults() should return object with results', t => {
  const mockLog = ['foo', 'bar'];
  const mockStats = { foo: 'bar' };
  cameraResolutionTest.log = mockLog;
  cameraResolutionTest.stats = mockStats;
  const results = cameraResolutionTest.getResults();
  t.deepEqual(results, {
    log: cameraResolutionTest.log,
    stats: cameraResolutionTest.stats,
    resolutions: cameraResolutionTest.resolutions,
    duration: cameraResolutionTest.duration
  });
});

test.serial('reportSuccess(str) should push string onto log and log message', t => {
  sinon.stub(cameraResolutionTest.logger, 'log');
  cameraResolutionTest.log = [];
  cameraResolutionTest.reportSuccess('test');
  t.deepEqual(cameraResolutionTest.log, ['test']);
  sinon.assert.calledOnce(cameraResolutionTest.logger.log);
});

test.serial('reportError(str) should push error to log call logger.warn', t => {
  sinon.stub(cameraResolutionTest.logger, 'warn');
  cameraResolutionTest.log = [];
  cameraResolutionTest.reportError('test');
  t.deepEqual(cameraResolutionTest.log, ['test']);
  sinon.assert.calledOnce(cameraResolutionTest.logger.warn);
  t.is(cameraResolutionTest.hasError, true);
});

test('reportInfo(str) should call logger.info', t => {
  sinon.stub(cameraResolutionTest.logger, 'info');
  cameraResolutionTest.log = [];
  cameraResolutionTest.reportInfo('test');
  t.deepEqual(cameraResolutionTest.log, []);
  sinon.assert.calledOnce(cameraResolutionTest.logger.info);
});

test.serial('startGetUserMedia should call getUserMedia and maybeContinueGetUserMedia if resolution length is greater than 1', async t => {
  sinon.stub(cameraResolutionTest, 'maybeContinueGetUserMedia');
  sinon.stub(cameraResolutionTest, 'collectAndAnalyzeStats');

  cameraResolutionTest.resolutions = [ [320, 640], [1080, 1300] ];
  await cameraResolutionTest.startGetUserMedia([320, 640]);
  sinon.assert.notCalled(cameraResolutionTest.collectAndAnalyzeStats);
  sinon.assert.calledOnce(cameraResolutionTest.maybeContinueGetUserMedia);
});

test.serial('startGetUserMedia should call logger.log and collectAndAnalyzeStats if resolution is one', async t => {
  sinon.stub(cameraResolutionTest, 'maybeContinueGetUserMedia');
  sinon.stub(cameraResolutionTest, 'collectAndAnalyzeStats');

  await cameraResolutionTest.startGetUserMedia([320, 640]);
  sinon.assert.calledOnce(cameraResolutionTest.collectAndAnalyzeStats);
  sinon.assert.notCalled(cameraResolutionTest.maybeContinueGetUserMedia);
});

test('arrayAverage() should compute array average', t => {
  const actual = cameraResolutionTest.arrayAverage([1, 2, 3, 4, 5]);
  t.is(actual, 3);
});
