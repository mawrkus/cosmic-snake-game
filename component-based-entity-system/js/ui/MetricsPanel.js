export class MetricsPanel {
  constructor() {
    this.containerElement = document.querySelector(".metrics");
    this.timerElement = document.querySelector(".timer");
    this.scoreElement = document.querySelector(".score");
    this.debugInfoElement = document.querySelector(".debug-info");

    this.animate = null;
  }

  show() {
    this.containerElement.classList.remove("hidden");
  }

  showAsPaused() {
    this.containerElement.classList.remove("over");
    this.containerElement.classList.add("paused");
  }

  showAsOver() {
    this.containerElement.classList.remove("paused");
    this.containerElement.classList.add("over");
  }

  displayTimer(timestamp) {
    this.timerElement.textContent = (timestamp / 1000).toFixed(1);
  }

  displayPoints(points) {
    this.scoreElement.textContent = points;
  }

  increasePoints(points) {
    this.animate = () => {
      const n = Number(this.scoreElement.textContent);

      if (n >= points) {
        this.scoreElement.removeEventListener("animationend", this.animate);
        return;
      }

      this.scoreElement.classList.remove("increase");

      // https://css-tricks.com/restart-css-animation/
      void this.scoreElement.offsetWidth;

      this.scoreElement.textContent = n + 1;

      this.scoreElement.classList.add("increase");
    };

    this.animate.done = () => (this.scoreElement.textContent = points);

    this.scoreElement.addEventListener("animationend", this.animate);

    this.animate();
  }

  cleanup() {
    if (this.animate) {
      this.scoreElement.removeEventListener("animationend", this.animate);

      this.animate.done();
    }

    this.containerElement.classList.remove("paused", "over");
  }

  toggleDebugInfo() {
    return !this.debugInfoElement.classList.toggle("hidden");
  }

  displayDebugInfo(info) {
    this.debugInfoElement.textContent = info;
  }
}
