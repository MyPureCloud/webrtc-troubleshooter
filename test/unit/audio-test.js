import test from 'ava';
import sinon from 'sinon';

import AudioTest from '../../src/diagnostics/AudioTest';

let LocalMediaStub;
test.beforeEach(() => {
  LocalMediaStub = {
    localMedia: {
      start: sinon.stub(),
      on: sinon.stub(),
      stop: sinon.stub()
    }
  };
});

test('start() should start localMedia', t => {
  const mediaStream = document.createElement('video').mediaStream;
  const audioTest = new AudioTest(mediaStream);
  audioTest.start.call(LocalMediaStub);
  t.is(LocalMediaStub.localMedia.start.called, true);
});

test('destroy() should stop localMedia', t => {
  const mediaStream = document.createElement('video').mediaStream;
  const audioTest = new AudioTest(mediaStream);
  audioTest.destroy.call(LocalMediaStub);
  t.is(LocalMediaStub.localMedia.stop.called, true);
});
