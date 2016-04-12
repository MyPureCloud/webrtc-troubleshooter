/* global _ */

import Ember from 'ember';

class TestSuite {
  constructor () {
    this.allTestsComplete = false;
    this.running = false;
    this.queue = [];
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
