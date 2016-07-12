export default class TestSuite {
  constructor (options) {
    options = options || {};
    this.allTestsComplete = false;
    this.running = false;
    this.queue = [];
    this.logger = options.logger || console;
  }

  addTest (test) {
    this.queue.push(test);
  }

  start () {
    return new Promise((resolve, reject) => {
      return this.runNextTest().then(resolve, reject);
    });
  }

  runNextTest () {
    this.running = true;
    const test = this.queue.shift();

    if (!test) {
      this.running = false;
      return Promise.resolve();
    }

    this.activeTest = test;
    this.logger.log('Starting ' + test.name);

    const next = () => {
      test.running = false;
      test.destroy();
      return this.runNextTest();
    };

    return test.start().then(() => {
      return next();
    }, (err) => {
      this.logger.error('Test failure', err, test);
      return next();
    });
  }

  stopAllTests () {
    this.activeTest.destroy();
    this.queue = [];
  }
}
