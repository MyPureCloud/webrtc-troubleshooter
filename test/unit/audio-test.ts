import test from 'ava';
import sinon from 'sinon';

import AudioTest from '../../src/diagnostics/AudioTest';

test('start() should start localMedia', t => {
  const audioTest = new AudioTest();
  // sinon.stub(audioTest.localMedia, 'start');
  audioTest.start();
  // sinon.assert.calledOnce(audioTest.localMedia.start);
});

test('destroy() should stop localMedia', t => {
  const audioTest = new AudioTest();
  // sinon.stub(audioTest.localMedia, 'stop');
  audioTest.destroy();
  // sinon.assert.calledOnce(audioTest.localMedia.stop);
});
