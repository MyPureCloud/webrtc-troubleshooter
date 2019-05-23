import test from 'ava';
import sinon from 'sinon';

import PermissionsTest from '../../src/diagnostics/PermissionsTest';

test('start() should not use local media if permissions api is available', t => {
  const permissionsTest = new PermissionsTest();
  sinon.stub(permissionsTest.localMedia, 'start');

  const savedPermissions = navigator.permissions;
  navigator.permissions = {
    query: sinon.stub().returns(Promise.resolve({ state: 'granted' }))
  };

  permissionsTest.start();
  sinon.assert.notCalled(permissionsTest.localMedia.start);
  sinon.assert.called(navigator.permissions.query);
  navigator.permissions = savedPermissions;
});

test('start() should fail if there are no mic devices and is mic permissions test', async t => {
  const permissionsTest = new PermissionsTest();
  sinon.stub(permissionsTest.localMedia, 'start');

  const savedPermissions = navigator.permissions;
  navigator.permissions = null;

  navigator.mediaDevices.enumerateDevices = sinon.stub().returns(Promise.resolve([
    { kind: 'videoinput' }
  ]));

  try {
    await permissionsTest.start();
    t.fail('should not succeed');
  } catch (err) {
    t.is(err.message, 'noDevice');
    sinon.assert.notCalled(permissionsTest.localMedia.start);
  }
  navigator.permissions = savedPermissions;
});

test('start() should fail if there are no camera devices and is camera permissions test', async t => {
  const permissionsTest = new PermissionsTest(true);
  sinon.stub(permissionsTest.localMedia, 'start');

  const savedPermissions = navigator.permissions;
  navigator.permissions = null;

  navigator.mediaDevices.enumerateDevices = sinon.stub().returns(Promise.resolve([
    { kind: 'audioinput' }
  ]));

  try {
    await permissionsTest.start();
    t.fail('should not succeed');
  } catch (err) {
    t.is(err.message, 'noDevice');
    sinon.assert.notCalled(permissionsTest.localMedia.start);
  }
  navigator.permissions = savedPermissions;
});

test('start() should use local media if permissions api is not available', async t => {
  const permissionsTest = new PermissionsTest();
  sinon.stub(permissionsTest.localMedia, 'start').callsFake((options, cb) => cb(null, { getTracks: () => [] }));

  const savedPermissions = navigator.permissions;
  navigator.permissions = null;

  navigator.mediaDevices.enumerateDevices = sinon.stub().returns(Promise.resolve([
    { kind: 'audioinput' }
  ]));

  await permissionsTest.start();
  sinon.assert.called(permissionsTest.localMedia.start);

  navigator.permissions = savedPermissions;
});

test('start() should fail if permissions denied', async t => {
  const permissionsTest = new PermissionsTest();
  const fakeError = new Error();
  fakeError.name = 'NotAllowedError';
  sinon.stub(permissionsTest.localMedia, 'start').callsFake((options, cb) => cb(fakeError));

  const savedPermissions = navigator.permissions;
  navigator.permissions = null;

  navigator.mediaDevices.enumerateDevices = sinon.stub().returns(Promise.resolve([
    { kind: 'audioinput' }
  ]));

  try {
    await permissionsTest.start();
    t.fail('should not succeed');
  } catch (err) {
    sinon.assert.called(permissionsTest.localMedia.start);
    t.is(err.message, 'noDevicePermissions');
  }

  navigator.permissions = savedPermissions;
});
