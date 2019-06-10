import { Logger, TestResult, ObjectLiteral } from '../types/interfaces';
import Test from './Test';

/**
 * Call to manager, start, stop, and report on tests
 */
export default class TestSuite {

  /**
   * Flag whether test suite is running
   */
  public running: boolean;

  /**
   * Flag whether all the tests are complete
   */
  public allTestsComplete: boolean;

  protected stopOnFailure: boolean;
  private hasError: boolean;
  private activeTest: Test;
  private queue: Test[];
  private results: TestResult[];
  private logger: Logger;

  constructor (options?: { logger?: Logger } & ObjectLiteral) {
    this.allTestsComplete = false;
    this.stopOnFailure = false;
    this.running = false;
    this.queue = [];
    this.logger = options && options.logger ? options.logger : console;
    this.hasError = false;
    this.results = [];
  }

  /**
   * Add a test class to the testing queue.
   * @param test to push onto the queue
   */
  public addTest (test: Test): void {
    this.queue.push(test);
  }

  /**
   * Start running the tests in the queue
   */
  public start (): Promise<any> {
    return new Promise((resolve, reject) => {
      return this.runNextTest().then(() => {
        if (this.hasError) {
          const error = new Error('A test failure occurred');
          error['details'] = this.results;
          return reject(error);
        }
        return resolve(this.results);
      }, (err) => {
        err.details = this.results;
        return reject(err);
      });
    });
  }

  /**
   * Run the next test. This will call itself until there are no more
   *  test OR if there is a failure and the `this.stopOnFailure` is set
   *  to `true`.
   */
  private runNextTest (): Promise<any> {
    this.running = true;
    this.allTestsComplete = !this.queue.length;
    const test = this.queue.shift();

    if (!test) {
      this.running = false;
      this.allTestsComplete = !this.queue.length;
      return Promise.resolve();
    }

    this.activeTest = test;
    this.logger.log('Starting ' + test.name);

    const next = (err?: any) => {
      test.running = false;
      test.destroy();
      if (err) {
        this.hasError = true;
        if (this.stopOnFailure) {
          return Promise.reject(err);
        }
      }
      return this.runNextTest();
    };

    return test.start().then((results) => {
      this.results.push({
        status: 'passed',
        name: test.name,
        results
      });
      return next();
    }, (err) => {
      this.hasError = true;
      const errInfo = {
        status: 'failed',
        name: test.name,
        message: err.message,
        details: err.details
      };
      this.results.push(errInfo);
      this.logger.error('Test failure', errInfo, test);
      return next(err);
    });
  }

  /**
   * Terminate running test and clear queue
   */
  public stopAllTests (): void {
    if (this.activeTest) {
      this.activeTest.destroy();
    }
    this.queue = [];
    this.running = false;
    this.allTestsComplete = !this.queue.length;
  }
}
