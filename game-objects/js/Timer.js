class Timer {
  constructor({ intervals }) {
    this.lastStart = null;
    this.lastStop = null;
    this.elapsedAcc = null;
    this.elapsed = null;
    this.lastChecks = null;

    this.intervalNames = intervals;
    this.intervalsData = null;
    this.intervalsApi = {
      val: (name) => this.elapsed - this.intervalsData[name].elapsed,
      gt: (name, valueMs) =>
        this.elapsed - this.intervalsData[name].elapsed > valueMs,
      gte: (name, valueMs) =>
        this.elapsed - this.intervalsData[name].elapsed >= valueMs,
      lt: (name, valueMs) =>
        this.elapsed - this.intervalsData[name].elapsed < valueMs,
      lte: (name, valueMs) =>
        this.elapsed - this.intervalsData[name].elapsed <= valueMs,
      between: (name, lowMs, highMs) => {
        const intervalMs = this.elapsed - this.intervalsData[name].elapsed;
        return intervalMs >= lowMs && intervalMs < highMs;
      },
    };

    this.elapsedApi = {
      val: () => this.elapsed,
      gt: (valueMs) => this.elapsed > valueMs,
      gte: (valueMs) => this.elapsed >= valueMs,
      lt: (valueMs) => this.elapsed < valueMs,
      lte: (valueMs) => this.elapsed <= valueMs,
      between: (lowMs, highMs) =>
        this.elapsed >= lowMs && this.elapsed < highMs,
    };
  }

  init() {
    this.lastStart = null;
    this.lastStop = null;
    this.elapsedAcc = 0;
    this.elapsed = 0;
    this.lastChecks = {};

    this.intervalsData = this.intervalNames.reduce(
      (acc, name) => ({ ...acc, [name]: { elapsed: 0 } }),
      {}
    );
  }

  pause() {
    if (this.lastStart === null) {
      return; // already paused
    }

    this.lastStop = performance.now();
    this.elapsedAcc += this.lastStop - this.lastStart;
    this.lastStart = null;
  }

  // we don't use the timestamp passed to the requestAnimationFrame callback
  // to ensure a proper restart because when restarting after a pause:
  // the 1st timestamp will be 0, then only,
  // the 2nd will be the correct number
  tick() {
    const now = performance.now();

    if (this.lastStart === null) {
      this.lastStart = now;

      for (const ms in this.lastChecks) {
        this.lastChecks[ms] += this.lastStart - this.lastStop;
      }

      this.lastStop = null;
    }

    this.elapsed = now - this.lastStart + this.elapsedAcc;
  }

  hasPassed(ms) {
    const now = performance.now();

    if (!this.lastChecks[ms]) {
      this.lastChecks[ms] = now;
    }

    if (now - this.lastChecks[ms] >= ms) {
      this.lastChecks[ms] = now;
      return true;
    }

    return false;
  }

  markInterval(name) {
    this.intervalsData[name].elapsed = this.elapsed;
  }

  getMeasurements() {
    return { elapsed: this.elapsedApi, intervals: this.intervalsApi };
  }
}
