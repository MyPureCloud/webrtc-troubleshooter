import test from 'ava';

import AbstractTest from '../../src/utils/Test';

class Test extends AbstractTest { }

let utilsTest;
test.beforeEach(() => {
  utilsTest = new Test({
    logger: {
      log: () => {}
    }
  });
});

test('start() should call reject with error if after timeout', t => {
  t.plan(0);
  const context = {
    reject: err => err
  };
  utilsTest.start.call(context);
});

test('resolve(data) should resolve promise', async t => {
  const context = {
    deferred: {
      resolve: () => {}
    },
    promise: Promise.resolve([
      {
        movies: ['Rocky', 'Rambo', 'Predator', 'Chinese Connection']
      }
    ])
  };
  const actual = await utilsTest.resolve.call(context);
  const expected = [ { movies: [ 'Rocky', 'Rambo', 'Predator', 'Chinese Connection' ] } ];
  t.deepEqual(actual, expected);
});

test('reject(err) should reject promise with error', async t => {
  const context = {
    deferred: {
      reject: () => {}
    },
    promise: Promise.reject(new Error('Some Error Occurred'))
  };
  try {
    await utilsTest.reject.call(
      context,
      {
        err: new Error('Some Error Occurred')
      }
    );
  } catch (err) {
    t.is(err.message, 'Some Error Occurred');
  }
});

test('destroy() should clearTimeout', t => {
  t.plan(0);
  const context = {
    timeout: 5
  };
  utilsTest.destroy.call(context);
});
