import { ObjectLiteral } from '../types/interfaces';

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
  private deferred: { resolve: (data?: any) => any, reject: (err?: any) => any };

  /**
   * Timeout handle for the timeout function that will automatically reject the promise
   *  after the set time.
   */
  private timeoutHandle: number;

  /**
   * Default time that tests have to finish.
   */
  private defaultTimeout: number;

  /**
   *
   * @param {any} options options to store on the class
   */
  constructor (options?: { logger?: any } & ObjectLiteral) {
    this.options = options || {};
    this.logger = this.options.logger || console;
    this.running = false;
    this.defaultTimeout = 45000;
    this.promise = new Promise((resolve, reject) => {
      this.deferred = { resolve, reject };
    });
  }

  /**
   * Begin the test
   *
   * This is not a great implementation in typescript. If the subclass does not override the returned promise,
   *  this will return a promise of `undefined`.
   */
  public start (): Promise<any> {
    this.timeoutHandle = window.setTimeout(() => {
      return this.reject(new Error('Test Timeout'));
    }, this.defaultTimeout);
    // this line will return a promise of 'undefined' if it is not overridden by the subclass
    return this.promise; // TODO: make sure this return doesn't break anything
  }

  /**
   * Clean up the test
   */
  public destroy (): void {
    window.clearTimeout(this.timeoutHandle);
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
