class SnakeSprite {
  static HEAD_SIZE = Grid.UNIT;
  static BODY_PART_SIZES = [Grid.UNIT * 0.6, Grid.UNIT * 0.8];
  static TAIL_SIZE = Grid.UNIT * 0.45;

  // https://palettes.shecodes.io/palettes/53
  static HEAD_COLOR_ALIVE = "#ef5a5a";
  static BODY_COLORS_ALIVE = ["#ffe79a", "#ffa952"];
  static BODY_COLORS_COLLISION = ["#e5e5e5", "#b9b9b9"];

  static BODY_OPACITY_MIN = 0.1;
  static BODY_OPACITY_MAX = 1;
  static BODY_OPACITY_INC = 0.01;
  static BODY_OPACITY_INC_END_SOON = 0.15;

  constructor({ snake }) {
    this.snake = snake;

    this.properties = {
      headColor: null,
      bodyColors: SnakeSprite.BODY_COLORS_ALIVE,
      shakingThreshold: null,
      shakingFactor: null,
      bodyOpacity: null,
    };
  }

  init() {
    this.properties.headColor = SnakeSprite.HEAD_COLOR_ALIVE;
    this.properties.bodyColors = SnakeSprite.BODY_COLORS_ALIVE;

    this.properties.shakingThreshold = 0;
    this.properties.shakingFactor = 0;

    this.properties.bodyOpacity = {
      inc: 0,
      value: 1,
    };
  }

  shake(threshold, factor) {
    this.properties.shakingThreshold = threshold;
    this.properties.shakingFactor = factor;
  }

  setIncorporeal(hasNoBody, durationInTicks) {
    this.properties.bodyOpacity = hasNoBody
      ? {
          min: SnakeSprite.BODY_OPACITY_MIN,
          max: SnakeSprite.BODY_OPACITY_MAX,
          inc: SnakeSprite.BODY_OPACITY_INC,
          value: SnakeSprite.BODY_OPACITY_MAX,
        }
      : {
          inc: 0,
          value: SnakeSprite.BODY_OPACITY_MAX,
        };

    if (hasNoBody && durationInTicks) {
      this.snake.setGridTickTimeout(() => {
        this.properties.bodyOpacity.inc = SnakeSprite.BODY_OPACITY_INC_END_SOON;
      }, 6 * (durationInTicks / 10));
    }
  }

  update() {
    if (this.properties.bodyOpacity.value <= this.properties.bodyOpacity.min) {
      this.properties.bodyOpacity.value = this.properties.bodyOpacity.min;
      this.properties.bodyOpacity.inc = -this.properties.bodyOpacity.inc;
    } else if (
      this.properties.bodyOpacity.value >= this.properties.bodyOpacity.max
    ) {
      this.properties.bodyOpacity.value = this.properties.bodyOpacity.max;
      this.properties.bodyOpacity.inc = -this.properties.bodyOpacity.inc;
    }

    this.properties.bodyOpacity.value += this.properties.bodyOpacity.inc;

    if (this.snake.hasStatus(Snake.STATUS.MOVING)) {
      return;
    }

    if (this.snake.hasStatus(Snake.STATUS.EATING)) {
      return;
    }

    if (this.snake.hasStatus(Snake.STATUS.COLLISION)) {
      this.properties.headColor = "#666";
      this.properties.bodyColors = SnakeSprite.BODY_COLORS_COLLISION;
      return;
    }
  }

  draw(ctx) {
    this.update();

    ctx.globalAlpha = this.properties.bodyOpacity.value;

    const parts = this.snake.getParts();
    const { bodyColors } = this.properties;

    for (let i = 1; i < parts.length - 1; i += 1) {
      const part = parts[i];

      if (part.startupTicksInterval > 0) {
        continue;
      }

      const color = bodyColors[i % bodyColors.length];

      const size =
        SnakeSprite.BODY_PART_SIZES[i % SnakeSprite.BODY_PART_SIZES.length];

      this.drawBodyPart(ctx, part, color, size);
    }

    this.drawTail(ctx);
    this.drawHead(ctx);

    ctx.globalAlpha = 1;
  }

  drawHead(ctx) {
    const [head] = this.snake.getParts();

    ctx.fillStyle = this.properties.headColor;

    let [x, y] = [
      head.pixelsX + (Grid.UNIT - SnakeSprite.HEAD_SIZE) / 2,
      head.pixelsY + (Grid.UNIT - SnakeSprite.HEAD_SIZE) / 2,
    ];

    ctx.fillRect(x, y, SnakeSprite.HEAD_SIZE, SnakeSprite.HEAD_SIZE);
  }

  drawTail(ctx) {
    const parts = this.snake.getParts();
    let i = parts.length - 1;

    const color =
      this.properties.bodyColors[i % this.properties.bodyColors.length];

    const size = SnakeSprite.TAIL_SIZE;

    this.drawBodyPart(ctx, parts[i], color, size);
  }

  drawBodyPart(ctx, part, color, size) {
    ctx.fillStyle = color;

    const [x, y] = this.applyShake([
      part.pixelsX + (Grid.UNIT - size) / 2,
      part.pixelsY + (Grid.UNIT - size) / 2,
    ]);

    ctx.fillRect(x, y, size, size);
  }

  applyShake([x, y]) {
    if (
      this.properties.shakingThreshold &&
      this.properties.shakingFactor &&
      Math.random() < this.properties.shakingThreshold
    ) {
      if (["up", "down"].includes(this.snake.getDirName())) {
        x +=
          (Math.random() > 0.5 ? Math.random() : -Math.random()) *
          this.properties.shakingFactor;
      } else {
        y +=
          (Math.random() < 0.5 ? Math.random() : -Math.random()) *
          this.properties.shakingFactor;
      }
    }

    return [x, y];
  }
}
