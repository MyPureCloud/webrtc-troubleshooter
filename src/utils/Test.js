export default class Test {
  constructor (options) {
    this.options = options || {};
    this.logger = this.options.logger || console;
  }

  start () {
    this._promise = Promise.defer();
    this.timeout = window.setTimeout(() => {
      this.reject(new Error('Test Timeout'));
    }, 45000);
  }

  resolve () {
    this._promise.resolve();
    return this._promise.promise;
  }

  reject (err) {
    this._promise.reject(err);
    return this._promise.promise;
  }

  destroy () {
    window.clearTimeout(this.timeout);
  }
}
