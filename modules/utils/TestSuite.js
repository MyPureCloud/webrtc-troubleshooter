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

  runNextTest (troubleshootingLog) {
    this.running = true;
    var test = this.queue.shift();
    if (!test) {
      this.running = false;
      this.allTestsComplete = true;
      console.log(JSON.stringify(troubleshootingLog, null, " "));
      return;
    }

    this.activeTest = test;
    console.log('Starting ' + test.name);

    test.start().catch((err) => {
      test.callback(err, test.log);
    }).then(() => {
      test.callback(null, test.log);
      test.running = false;
      test.destroy();
      if (test.results) {
        troubleshootingLog.push(test.results);
      } else {
        troubleshootingLog.push(test.log);
      }
      this.runNextTest(troubleshootingLog);
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
