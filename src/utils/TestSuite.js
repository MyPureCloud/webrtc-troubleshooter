export default class TestSuite {
  constructor(options) {
    options = options || {};
    this.allTestsComplete = false;
    this.running = false;
    this.queue = [];
    this.logger = options.logger || console;
  }

  addTest(test) {
    this.queue.push(test);
  }

  start() {
    return new Promise((resolve, reject) => {
      return this.runNextTest().then(resolve, reject);
    });
  }

  runNextTest() {
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

    const testResult = test.start();

    if (!testResult) {
      debugger;
    }

    return testResult.then(() => {
      return next();
    }, (err) => {
      test.reject(err);
      return next();
    });
  }

  stopAllTests() {
    this.activeTest.destroy();
    this.queue = [];
  }
}
