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
      return;
    }
    this.activeTest = test;



    test.start().then(() => {
      test.callback(null, test.log);
    }).catch((err) => {
      Ember.Logger.warn('WebRTC Diagnostic test failure: ', err, test.log);
      test.callback(err, test.log);
    }).finally(() => {
      test.running = false;
      test.destroy();
      this.runNextTest(done);
    });
    //
    // var testResults = new Promise((resolve, reject) => {
    //   test.start();
    // });
    //
    // testResults.then(function(result) {
    //   alert('okay');
    //   test.callback(null, test.log);
    //   logger.info('WebRTC Troubleshooting results for ' + test.name, JSON.stringify(test.log, null, " "));
    //   test.running = false;
    //   test.destroy();
    //   troubleshootingLog.push(test.log);
    //   runNextTest(troubleshootingLog);
    // });


    // try {
    //   test.start();
    //   test.callback(null, test.log);
    // }
    // catch(err) {
    //   this.logger.warn('WebRTC Diagnostic test failure: ', err, test.log);
    //   test.callback(err, test.log);
    // }
    // finally {
    //   this.logger.info('WebRTC Troubleshooting results for ' + test.name, JSON.stringify(test.log, null, " "));
    //   test.running = false;
    //   test.destroy();
    //   troubleshootingLog.push(test.log);
    //   this.runNextTest(troubleshootingLog);
    // }
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
