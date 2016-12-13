export default class Test {
  constructor (options) {
    this.options = options || {};
    this.logger = this.options.logger || console;
    this.promise = new Promise((resolve, reject) => {
      this.deferred = {resolve, reject};
    });
  }

  start () {
    this.timeout = window.setTimeout(() => {
      this.reject(new Error('Test Timeout'));
    }, 45000);
  }

  resolve (data) {
    this.deferred.resolve(data);
    return this.promise;
  }

  reject (err) {
    this.deferred.reject(err);
    return this.promise;
  }

  destroy () {
    window.clearTimeout(this.timeout);
  }
}
