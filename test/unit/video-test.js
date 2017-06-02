import test from 'ava';
import sinon from 'sinon';

import VideoTest from '../../src/diagnostics/VideoTest';

let videoTest;
test.beforeEach(() => {
  videoTest = new VideoTest();
});

test('start() should call localMedia.start', t => {
  const context = {
    logger: {
      log: () => {}
    },
    localMedia: {
      start: sinon.stub(),
      on: () => {}
    }
  };
  videoTest.start.call(context);
  t.is(context.localMedia.start.called, true);
});

test('destroy() should call localMedia.stop', t => {
  const context = {
    localMedia: {
      stop: sinon.stub()
    }
  };
  videoTest.destroy.call(context);
  t.is(context.localMedia.stop.called, true);
});
