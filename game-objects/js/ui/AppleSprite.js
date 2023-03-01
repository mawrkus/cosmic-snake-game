class AppleSprite {
  static SHAPES = {
    [Apple.TYPES.FOOD]: "circle-filled",
    [Apple.TYPES.SHRINK_PILL]: "circle-filled",
    [Apple.TYPES.DECELERATE_PILL]: "diamond",
    [Apple.TYPES.INCORPOREAL_PILL]: "rectangle",
    [Apple.TYPES.WARP_PILL]: "rectangle",
    [Apple.TYPES.DEATH_PILL]: "circle-filled",
  };

  static INCORPOREAL_OPACITIES = {
    [Apple.TYPES.FOOD]: 0.3,
    [Apple.TYPES.SHRINK_PILL]: 0.5,
    [Apple.TYPES.DECELERATE_PILL]: 0.5,
    [Apple.TYPES.INCORPOREAL_PILL]: 0.5,
    [Apple.TYPES.WARP_PILL]: 0.5,
    [Apple.TYPES.DEATH_PILL]: 0.7,
  };

  static OPACITY_MIN = 0.6;
  static OPACITY_MAX = 1;
  static OPACITY_INC = 0.015;
  static RADIUS_MIN = Grid.UNIT * 0.3;
  static RADIUS_MAX = Grid.UNIT * 0.35;
  static RADIUS_INC = 0.033;

  constructor({ apple }) {
    this.apple = apple;

    this.properties = {
      opacity: {
        min: AppleSprite.OPACITY_MIN,
        max: AppleSprite.OPACITY_MAX,
        inc: AppleSprite.OPACITY_INC,
        value: AppleSprite.OPACITY_MIN,
      },
      radius: {
        min: AppleSprite.RADIUS_MIN,
        max: AppleSprite.RADIUS_MAX,
        inc: AppleSprite.RADIUS_INC,
        value: AppleSprite.RADIUS_MIN,
      },
    };
  }

  update() {
    if (this.apple.hasStatus(Apple.STATUS.INCORPOREAL)) {
      this.properties.opacity.value =
        AppleSprite.INCORPOREAL_OPACITIES[this.apple.type];
      return;
    }

    Object.values(this.properties).forEach((propertyData) => {
      if (propertyData.value <= propertyData.min) {
        propertyData.value = propertyData.min;
        propertyData.inc = -propertyData.inc;
      } else if (propertyData.value > propertyData.max) {
        propertyData.value = propertyData.max;
        propertyData.inc = -propertyData.inc;
      }

      propertyData.value += propertyData.inc;
    });
  }

  draw(ctx) {
    this.update();

    const { opacity, radius } = this.properties;

    let color;

    switch (this.apple.type) {
      case Apple.TYPES.FOOD:
        color = `rgb(51,255,0,${opacity.value})`;
        break;

      case Apple.TYPES.SHRINK_PILL:
        color = `rgb(239,90,90,${opacity.value})`;
        break;

      case Apple.TYPES.DECELERATE_PILL:
        color = `rgb(0,187,240,${opacity.value})`;
        break;

      case Apple.TYPES.INCORPOREAL_PILL:
        color = `rgb(239,90,90,${opacity.value})`;
        break;

      case Apple.TYPES.WARP_PILL:
        color = `rgb(255,255,255,${opacity.value})`;
        break;

      case Apple.TYPES.DEATH_PILL:
        color = `rgb(39,39,39,${opacity.value})`;
        break;

      default:
        // color = `rgb(255,231,154,${opacity.value})`;
        throw GameError.create(`Unknown apple type "${this.apple.type}"!`);
    }

    ctx.fillStyle = color;

    if (AppleSprite.SHAPES[this.apple.type] === "circle-filled") {
      ctx.beginPath();

      ctx.arc(
        Grid.toPixels(this.apple.x + 0.5),
        Grid.toPixels(this.apple.y + 0.5),
        radius.value,
        0,
        2 * Math.PI
      );

      ctx.fill();
    } else if (AppleSprite.SHAPES[this.apple.type] === "rectangle") {
      ctx.fillRect(
        Grid.toPixels(this.apple.x + 0.23),
        Grid.toPixels(this.apple.y + 0.23),
        Grid.UNIT * 0.54,
        Grid.UNIT * 0.54
      );
    } else if (AppleSprite.SHAPES[this.apple.type] === "diamond") {
      ctx.beginPath();

      ctx.moveTo(
        Grid.toPixels(this.apple.x + 0.5),
        Grid.toPixels(this.apple.y + 0.15)
      );
      ctx.lineTo(
        Grid.toPixels(this.apple.x + 0.85),
        Grid.toPixels(this.apple.y + 0.5)
      );
      ctx.lineTo(
        Grid.toPixels(this.apple.x + 0.5),
        Grid.toPixels(this.apple.y + 0.85)
      );
      ctx.lineTo(
        Grid.toPixels(this.apple.x + 0.15),
        Grid.toPixels(this.apple.y + 0.5)
      );

      ctx.closePath();

      ctx.fill();
    }
  }
}
