/**
 * Abstract class to extend to write webrtc tests
 */
export default abstract class Test {

  /**
   * Name of test
   */
  public name: string;

  /**
   * Flag whether test is running
   */
  public running: boolean;

  /**
   * Options to pass into the class
   */
  protected options: any;

  /**
   * Logger to be used
   */
  protected logger: any;

  /**
   * Deferred promise to resolve or reject the test
   */
  protected promise: Promise<any>;

  /**
   * Holds the deferred `resolve()` and `reject()` functions for the class' promise
   */
  private deferred: {resolve: (data?: any) => any, reject: (err?: any) => any};

  /**
   * Timeout handle for the timeout function that will automatically reject the promise
   *  after the set time.
   */
  private timeout: number;

  /**
   *
   * @param {any} options options to store on the class
   */
  constructor (options?: {logger?: any, any}) {
    this.options = options || {};
    this.logger = this.options.logger || console;
    this.running = false;
    this.promise = new Promise((resolve, reject) => {
      this.deferred = { resolve, reject };
    });
  }

  /**
   * Begin the test
   */
  public start (): Promise<any> {
    this.timeout = window.setTimeout(() => {
      return this.reject(new Error('Test Timeout'));
    }, 45000);
    return this.promise; //TODO: make sure this return doesn't break anything
  }

  /**
   * Clean up the test
   */
  public destroy (): void {
    window.clearTimeout(this.timeout);
  }

  /**
   * Resolve class' promise
   * @param {any} data data to resolve the promise
   */
  protected resolve (data?: any): Promise<any> {
    this.deferred.resolve(data);
    return this.promise;
  }

  /**
   * Reject class' promise
   * @param {any} err data to reject the promise
   */
  protected reject (err?: any): Promise<any> {
    this.deferred.reject(err);
    return this.promise;
  }

}
