export default abstract class Test {

  protected options: any;
  protected logger: any;
  protected promise: Promise<any>;

  private deferred: {resolve: (data?: any) => any, reject: (err?: any) => any};
  private timeout: number;

  constructor (options?: any) {
    this.options = options || {};
    this.logger = this.options.logger || console;
    this.promise = new Promise((resolve, reject) => {
      this.deferred = { resolve, reject };
    });
  }

  protected start (): void {
    this.timeout = window.setTimeout(() => {
      return this.reject(new Error('Test Timeout'));
    }, 45000);
  }

  protected resolve (data?: any): Promise<any> {
    this.deferred.resolve(data);
    return this.promise;
  }

  protected reject (err?: any): Promise<any> {
    this.deferred.reject(err);
    return this.promise;
  }

  protected destroy (): void {
    window.clearTimeout(this.timeout);
  }
}
