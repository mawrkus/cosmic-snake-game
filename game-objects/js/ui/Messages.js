class Messages {
  static SUBTEXT_DISPLAY_DELAY = 1000;

  constructor() {
    this.textElement = document.querySelector(".message .text");
    this.subTextElement = document.querySelector(".message .sub-text");

    this.metricsElement = document.querySelector(".metrics");
    this.scoreElement = document.querySelector(".score");
    this.timerElement = document.querySelector(".timer");

    this.controlPanel = {
      containerElement: document.querySelector(".control-panel"),
      musicButton: document.querySelector(".control-panel .music"),
      leftButton: document.querySelector(".control-panel .left"),
      rightButton: document.querySelector(".control-panel .right"),
    };

    this.debug = {
      containerElement: document.querySelector(".debug-info"),
      topElement: document.querySelector(".debug-info .top"),
      bottomElement: document.querySelector(".debug-info .bottom"),
    };

    this.subTextTimeoutId = null;
  }

  bindEvents({ onClickMusicButton, onClickLeftButton, onClickRightButton }) {
    this.controlPanel.musicButton.addEventListener("click", onClickMusicButton);

    this.controlPanel.leftButton.addEventListener("click", () => {
      this.activateControl("left");
      onClickLeftButton();
    });

    this.controlPanel.rightButton.addEventListener("click", () => {
      this.activateControl("right");
      onClickRightButton();
    });
  }

  activateControl(side) {
    const buttonElement = this.controlPanel[`${side}Button`];

    buttonElement.classList.remove("active");

    // https://css-tricks.com/restart-css-animation/
    void this.scoreElement.offsetWidth;

    buttonElement.classList.add("active");
  }

  showMetrics() {
    this.scoreElement.classList.remove("over");
    this.metricsElement.classList.remove("hidden");
  }

  toggleControlPanel() {
    this.controlPanel.containerElement.classList.toggle("invisible");
  }

  toggleDebugInfo() {
    this.debug.containerElement.classList.toggle("hidden");
  }

  displayPoints(snake, pointsInc = 0) {
    const points = snake.getPoints();

    if (!pointsInc) {
      this.scoreElement.textContent = points;
      return;
    }

    const animate = () => {
      const n = Number(this.scoreElement.textContent);

      if (n >= points) {
        this.scoreElement.removeEventListener("animationend", animate);
        return;
      }

      this.scoreElement.classList.remove("increase");

      // https://css-tricks.com/restart-css-animation/
      void this.scoreElement.offsetWidth;

      this.scoreElement.textContent = n + 1;

      this.scoreElement.classList.add("increase");
    };

    this.scoreElement.addEventListener("animationend", animate);

    animate();
  }

  displayTimer(timestamp) {
    this.timerElement.textContent = (timestamp / 1000).toFixed(1);
  }

  displayMessage({ text, ctaText, addCtaTextDelay }) {
    this.textElement.textContent = text;

    if (addCtaTextDelay) {
      this.subTextElement.textContent = "";

      this.subTextTimeoutId = setTimeout(() => {
        this.subTextElement.textContent = ctaText;
      }, Messages.SUBTEXT_DISPLAY_DELAY);
    } else {
      this.subTextElement.textContent = ctaText;
    }
  }

  displayPausedMessage({ text, ctaText }) {
    this.metricsElement.classList.add("paused");

    this.displayMessage({ text, ctaText });
  }

  displayGameOverMessage({ text, ctaText, addCtaTextDelay }) {
    this.metricsElement.classList.remove("paused");
    this.scoreElement.classList.add("over");

    this.displayMessage({ text, ctaText, addCtaTextDelay });
  }

  displayMusicStatus(displayAsPlaying) {
    this.controlPanel.musicButton.classList.toggle("active", displayAsPlaying);

    this.controlPanel.musicButton.textContent = displayAsPlaying
      ? "Music On"
      : "Music Off";
  }

  displayDebugInfo(topInfo, bottomInfo) {
    this.debug.topElement.textContent = topInfo;
    this.debug.bottomElement.textContent = bottomInfo;
  }

  clear() {
    clearTimeout(this.subTextTimeoutId);
    this.subTextTimeoutId = null;

    this.textElement.textContent = "";
    this.subTextElement.textContent = "";

    this.scoreElement.classList.remove("over");
    this.metricsElement.classList.remove("paused");
  }
}
