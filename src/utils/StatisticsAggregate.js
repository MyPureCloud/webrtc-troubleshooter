export default class StatisticsAggregate {
  constructor(rampUpThreshold) {
    this.startTime = 0;
    this.sum = 0;
    this.count = 0;
    this.max = 0;
    this.rampUpThreshold = rampUpThreshold;
    this.rampUpTime = Infinity;
  }
  add(time, datapoint) {
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
  getAverage() {
    if (this.count === 0) {
      return 0;
    }
    return Math.round(this.sum / this.count);
  }
  getMax() {
    return this.max;
  }
  getRampUpTime() {
    return this.rampUpTime - this.startTime;
  }
}
