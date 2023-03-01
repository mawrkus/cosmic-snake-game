class Grid {
  static UNIT = 16;

  static BACKGROUND_COLOR = "rgba(21,21,21,1)"; // #181819
  static BACKGROUND_COLOR_PAUSED = "rgba(21,21,21,0.8)";

  static STATUS = {
    ACTIVE: "active",
    PAUSED: "paused",
    COLLIDED: "collided",
    GAME_OVER: "game-over",
  };

  static toGridUnits(n) {
    return Math.round(n / Grid.UNIT);
  }

  static toPixels(n) {
    return n * Grid.UNIT;
  }

  constructor({ canvasElement }) {
    this.canvasElement = canvasElement;

    this.audioClips = {
      warp: new AudioClip({ file: "./assets/audio/grid-warp.mp3" }),
    };

    this.status = null;
    this.warped = null;
  }

  isWarped() {
    return this.warped;
  }

  getGridDimensions() {
    return {
      width: Grid.toGridUnits(this.canvasElement.width),
      height: Grid.toGridUnits(this.canvasElement.height),
    };
  }

  enlarge(widthInc, heightInc) {
    this.canvasElement.width += widthInc * Grid.UNIT;
    this.canvasElement.height += heightInc * Grid.UNIT;
  }

  init({ width, height }) {
    this.canvasElement.width = width * Grid.UNIT;
    this.canvasElement.height = height * Grid.UNIT;

    this.warped = false;

    this.initDraw();
    this.activate();
  }

  draw(ctx) {
    ctx.fillStyle = Grid.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  drawDisabled(ctx) {
    ctx.fillStyle = Grid.BACKGROUND_COLOR_PAUSED;
    ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    this.canvasElement.classList.add("paused");
  }

  initDraw() {
    this.canvasElement.classList.remove(
      "paused",
      "warped",
      "collision",
      "up",
      "right",
      "down",
      "left"
    );
  }

  pause(ctx) {
    if (this.status === Grid.STATUS.PAUSED) {
      // prevents multiple opacity layers to be drawn
      return;
    }

    this.status = Grid.STATUS.PAUSED;

    this.drawDisabled(ctx);
  }

  activate() {
    this.status = Grid.STATUS.ACTIVE;

    this.canvasElement.classList.remove("paused");
  }

  warp() {
    this.warped = true;

    this.canvasElement.classList.add("warped");

    this.audioClips.warp.play();
  }

  collide(snake) {
    this.status = Grid.STATUS.COLLIDED;

    document.documentElement.style.setProperty(
      "--collision-inc",
      `${3 * Math.ceil(snake.getSpeed())}px`
    );

    this.canvasElement.classList.add("collision", snake.getDirName());
  }

  gameOver(ctx) {
    this.status = Grid.STATUS.GAME_OVER;
    this.warped = false;

    this.canvasElement.classList.remove("warped");
    this.drawDisabled(ctx);
  }
}
