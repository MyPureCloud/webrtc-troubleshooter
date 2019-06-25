import PermissionsTest from '../../src/diagnostics/PermissionsTest';
import { ObjectLiteral } from '../../src/types/interfaces';

declare var navigator: {
  permissions: {
    query: (options: ObjectLiteral) => Promise<any>
  }
} & Navigator;

function setPermissions (permissions) {
  Object.defineProperty(navigator, 'permissions', { value: permissions, writable: false });
}

describe('PermissionsTest', () => {
  describe('start()', () => {
    let enumDevicesSpy: jest.SpyInstance;
    beforeAll(() => {
      enumDevicesSpy = jest.fn();
      Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', { value: enumDevicesSpy });
    });

    test('should not use local media if permissions api is available', async () => {
      const permissionsTest = new PermissionsTest(true);
      const startSpy = jest.spyOn(permissionsTest['localMedia'], 'start');
      const savedPermissions = navigator.permissions;
      const querySpy = jest.fn().mockResolvedValueOnce({ state: 'granted' } as any);
      setPermissions({ query: querySpy });
      await permissionsTest.start();
      expect(startSpy).not.toHaveBeenCalled();
      expect(querySpy).toHaveBeenCalled();
      setPermissions(savedPermissions);
    });

    test('should fail if there are no mic devices and is mic permissions test', async () => {
      const permissionsTest = new PermissionsTest(false);
      const startSpy = jest.spyOn(permissionsTest['localMedia'], 'start');
      const savedPermissions = navigator.permissions;
      setPermissions(null);
      enumDevicesSpy.mockResolvedValueOnce([
        { kind: 'videoinput' }
      ]);

      try {
        await permissionsTest.start();
        fail('should not succeed');
      } catch (err) {
        expect(err.message).toBe('noDevice');
        expect(startSpy).not.toHaveBeenCalled();
      }
      setPermissions(savedPermissions);
    });

    test('should fail if there are no camera devices and is camera permissions test', async () => {
      const permissionsTest = new PermissionsTest(true);
      const startSpy = jest.spyOn(permissionsTest['localMedia'], 'start');
      const savedPermissions = navigator.permissions;
      setPermissions(null);
      enumDevicesSpy.mockResolvedValueOnce([
        { kind: 'audioinput' }
      ]);

      try {
        await permissionsTest.start();
        fail('should not succeed');
      } catch (err) {
        expect(err.message).toBe('noDevice');
        expect(startSpy).not.toHaveBeenCalled();
      }
      setPermissions(savedPermissions);
    });

    test('should use local media if permissions api is not available', async () => {
      const permissionsTest = new PermissionsTest(false);
      const startSpy = jest.spyOn(permissionsTest['localMedia'], 'start').mockImplementationOnce((options, cb) => cb(null, { getTracks: () => [] } as any));
      const savedPermissions = navigator.permissions;
      setPermissions(null);
      enumDevicesSpy.mockResolvedValueOnce([
        { kind: 'audioinput' }
      ]);
      await permissionsTest.start();
      expect(startSpy).toHaveBeenCalled();
      setPermissions(savedPermissions);
    });

    test('should fail if permissions denied', async () => {
      const permissionsTest = new PermissionsTest(false);
      const fakeError = new Error();
      fakeError.name = 'NotAllowedError';
      const startSpy = jest.spyOn(permissionsTest['localMedia'], 'start').mockImplementationOnce((options, cb) => cb(fakeError, null as any));
      const savedPermissions = navigator.permissions;
      setPermissions(null);
      enumDevicesSpy.mockResolvedValueOnce([
        { kind: 'audioinput' }
      ]);
      try {
        await permissionsTest.start();
        fail('should not succeed');
      } catch (err) {
        expect(err.message).toBe('noDevicePermissions');
        expect(startSpy).toHaveBeenCalled();
      }
      setPermissions(savedPermissions);
    });
  });
});
