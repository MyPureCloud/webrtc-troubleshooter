/* global _ */
class TestSuite {
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

  runNextTest (done) {
    this.running = true;
    var test = this.queue.shift();

    if (!test) {
      this.running = false;
      this.allTestsComplete = true;
      return done();
    }

    this.activeTest = test;
    this.logger.log('webrtc-troubleshooter: Starting Test ' + test.name);
    
    // TODO: There is some repeating functionality here that could be extracted.
    test.start().then(() => {
      test.callback(null);
      test.running = false;
      test.destroy();
      this.runNextTest(done);
    }).catch((err) => {
      test.callback(err, test.log);
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
    this.options = options || {};
    this.callback = callback || _.noop;
    this.logger = this.options.logger || console;
  }

  start () {
    this.timeout = window.setTimeout(() => {
      if (this.reject) {
        this.reject('timeout');
      }
    }, 30000);
  }

  destroy () {
    window.clearTimeout(this.timeout);
  }
}

export { TestSuite, Test };
