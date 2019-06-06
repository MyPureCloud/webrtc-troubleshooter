/**
 * Call to aggregate statistics
 */
export default class StatisticsAggregate {

  private startTime: number;
  private sum: number;
  private count: number;
  private max: number;
  private rampUpThreshold: number;
  private rampUpTime: number;

  constructor (rampUpThreshold: number) {
    this.startTime = 0;
    this.sum = 0;
    this.count = 0;
    this.max = 0;
    this.rampUpThreshold = rampUpThreshold;
    this.rampUpTime = Infinity;
  }

  /**
   * Add a datapoint to the aggregate
   * @param time time
   * @param datapoint datapoint to add
   */
  public add (time: number, datapoint: number): void {
    if (this.startTime === 0) {
      this.startTime = time;
    }
    this.sum += datapoint;
    this.max = Math.max(this.max, datapoint);
    if (this.rampUpTime === Infinity &&
      datapoint > this.rampUpThreshold) {
      this.rampUpTime = time;
    }
    this.count++;
  }

  /**
   * Get the average
   */
  public getAverage (): number {
    if (this.count === 0) {
      return 0;
    }
    return this.sum / this.count;
  }

  /**
   * Get the max datapoint
   */
  public getMax (): number {
    return this.max;
  }

  /**
   * Get the ramp up time
   */
  public getRampUpTime (): number {
    return this.rampUpTime - this.startTime;
  }
}
