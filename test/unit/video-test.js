import test from 'ava';
import sinon from 'sinon';

import VideoTest from '../../src/diagnostics/VideoTest';

let videoTest;
test.beforeEach(() => {
  videoTest = new VideoTest();
});

test('start() should call localMedia.start & localMedia.stop', t => {
  const fakeStream = {
    getVideoTracks: () => [{id: 'hash1234'}]
  };
  const context = {
    logger: {
      log: () => {}
    },
    resolve: sinon.stub(),
    localMedia: {
      start: sinon.stub(),
      stop: sinon.stub(),
      on: (event, callback) => {
        callback(fakeStream);
      }
    }
  };
  videoTest.start.call(context);
  t.is(context.resolve.called, true);
  t.is(context.localMedia.start.called, true);
  t.is(context.localMedia.stop.called, true);
});
