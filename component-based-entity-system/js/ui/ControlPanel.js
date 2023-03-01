// TODO
export class ControlPanel {
  constructor() {
    this.containerElement = document.querySelector(".control-panel");
    this.musicButton = document.querySelector(".control-panel .music");
    this.leftButton = document.querySelector(".control-panel .left");
    this.rightButton = document.querySelector(".control-panel .right");

    this.onClickMusicButton = null;
    this.onClickLeftButton = null;
    this.onClickRightButton = null;
  }

  bindEvents({ onClickMusicButton, onClickLeftButton, onClickRightButton }) {
    this.onClickMusicButton = onClickMusicButton;
    this.musicButton.addEventListener("click", this.onClickMusicButton);

    this.onClickLeftButton = () => {
      this.displayActiveControl("left");
      onClickLeftButton();
    };
    this.leftButton.addEventListener("click", this.onClickLeftButton);

    this.onClickRightButton = () => {
      this.displayActiveControl("right");
      onClickRightButton();
    };
    this.rightButton.addEventListener("click", this.onClickRightButton);
  }

  toggle() {
    this.containerElement.classList.toggle("invisible");
  }

  displayActiveControl(side) {
    const buttonElement = this.controlPanel[`${side}Button`];

    buttonElement.classList.remove("active");

    // https://css-tricks.com/restart-css-animation/
    void this.scoreElement.offsetWidth;

    buttonElement.classList.add("active");
  }

  displayMusicStatus(displayAsPlaying) {
    this.musicButton.classList.toggle("active", displayAsPlaying);

    this.musicButton.textContent = displayAsPlaying ? "Music On" : "Music Off";
  }

  cleanup() {
    this.musicButton.removeEventListener("click", this.onClickMusicButton);
    this.leftButton.removeEventListener("click", this.onClickLeftButton);
    this.rightButton.removeEventListener("click", this.onClickRightButton);
  }
}
