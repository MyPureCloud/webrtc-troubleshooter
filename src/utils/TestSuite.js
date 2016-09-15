export default class TestSuite {
  constructor (options) {
    options = options || {};
    this.allTestsComplete = false;
    this.stopOnFailure = false;
    this.running = false;
    this.queue = [];
    this.logger = options.logger || console;

    this.hasError = false;
    this.results = [];
  }

  addTest (test) {
    this.queue.push(test);
  }

  start () {
    return new Promise((resolve, reject) => {
      return this.runNextTest().then(() => {
        if (this.hasError) {
          const error = new Error('A test failure occurred');
          error.details = this.results;
          return reject(error);
        }
        return resolve(this.results);
      }, (err) => {
        err.details = this.results;
        return reject(err);
      });
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

    const next = (err) => {
      test.running = false;
      test.destroy();
      if (err) {
        this.hasError = true;
        if (this.stopOnFailure) {
          return Promise.reject(err);
        }
      }
      return this.runNextTest();
    };

    return test.start().then((results) => {
      this.results.push({
        status: 'passed',
        name: test.name,
        results
      });
      return next();
    }, (err) => {
      this.hasError = true;
      const errInfo = {
        status: 'failed',
        name: test.name,
        message: err.message,
        details: err.details
      };
      this.results.push(errInfo);
      this.logger.error('Test failure', errInfo, test);
      return next(err);
    });
  }

  stopAllTests () {
    this.activeTest.destroy();
    this.queue = [];
  }
}
