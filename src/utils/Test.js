export default class Test {
  constructor (options) {
    this.options = options || {};
    this.logger = this.options.logger || console;
    this.deferred = Promise.defer();
  }

  start () {
    this.timeout = window.setTimeout(() => {
      this.reject(new Error('Test Timeout'));
    }, 45000);
  }

  resolve () {
    this.deferred.resolve();
    return this.deferred.promise;
  }

  reject (err) {
    this.deferred.reject(err);
    return this.deferred.promise;
  }

  destroy () {
    window.clearTimeout(this.timeout);
  }
}
