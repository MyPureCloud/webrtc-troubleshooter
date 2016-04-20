/* global _ */
class TestSuite {
  constructor (options) {
    this.allTestsComplete = false;
    this.running = false;
    this.queue = [];
    if (options) {
        this.logger = options.logger;
    } else {
        this.logger = console;
    }
  }

  addTest (test) {
    this.queue.push(test);
  }

  runNextTest (done, troubleshootingLog) {
    console.log(troubleshootingLog); 
    this.running = true;
    var test = this.queue.shift();
    if (!test) {
      this.running = false;
      this.allTestsComplete = true;
      return done();
    }
    this.activeTest = test;
    test.start().then(() => {
      test.callback(null, test.log);
    }).catch((err) => {
      logger.warn('WebRTC Diagnostic test failure: ', err, test.log);
      test.callback(err, test.log);
    }).finally(() => {
      logger.info('WebRTC Troubleshooting results', this.get('troubleshootingLog'));
      test.running = false;
      test.destroy();
      this.runNextTest(done);
    });
  }

  stopAllTests () {
    this.activeTest.destroy();
    this.queue = [];
  }
}

class Test {
  constructor (options, callback) {
    this.log = [];
    this.options = options;
    this.callback = callback || _.noop;
  }

  start () {
    this.timeout = window.setTimeout(() => {
      if (this.reject) {
        this.reject('timeout', this.log);
      }
    }, 30000);
  }

  destroy () {
    window.clearTimeout(this.timeout);
  }
}

export { TestSuite, Test };
