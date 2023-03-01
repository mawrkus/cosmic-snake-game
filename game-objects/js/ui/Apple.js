class Apple {
  static TYPES = {
    FOOD: "food",
    SHRINK_PILL: "shrink-pill",
    DECELERATE_PILL: "decelerate-pill",
    INCORPOREAL_PILL: "incorporeal-pill",
    WARP_PILL: "warp-pill",
    DEATH_PILL: "death-pill",
  };

  static FEATURES = {
    // snake effects
    [Apple.TYPES.FOOD]: {
      type: Apple.TYPES.FOOD,
      attributes: {
        pointsInc: 1,
        snakeSizeInc: 2,
        speedInc: 0.12,
      },
    },
    [Apple.TYPES.SHRINK_PILL]: {
      type: Apple.TYPES.SHRINK_PILL,
      attributes: {
        snakeSizeDec: 2,
      },
    },
    [Apple.TYPES.DECELERATE_PILL]: {
      type: Apple.TYPES.DECELERATE_PILL,
      attributes: {
        addAcc: {
          value: -0.002,
          durationInTicks: (snake) =>
            Math.ceil((snake.getSize() * snake.getSpeed()) / 4),
        },
      },
    },
    [Apple.TYPES.INCORPOREAL_PILL]: {
      type: Apple.TYPES.INCORPOREAL_PILL,
      attributes: {
        incorporeal: {
          durationInTicks: () => 192,
        },
      },
    },
    [Apple.TYPES.DEATH_PILL]: {
      type: Apple.TYPES.DEATH_PILL,
      attributes: {
        addAcc: {
          value: -0.01,
          durationInTicks: () => Number.POSITIVE_INFINITY,
        },
      },
    },
    // grid effects
    [Apple.TYPES.WARP_PILL]: {
      type: Apple.TYPES.WARP_PILL,
      attributes: {
        gridWarp: true,
      },
    },
  };

  static AUDIO_CLIPS = {
    // snake effects
    [Apple.TYPES.FOOD]: new AudioClip({
      file: "./assets/audio/eat-food.mp3",
    }),
    [Apple.TYPES.SHRINK_PILL]: new AudioClip({
      file: "./assets/audio/eat-shrink-pill.mp3",
    }),
    [Apple.TYPES.DECELERATE_PILL]: new AudioClip({
      file: "./assets/audio/eat-decelerate-pill.mp3",
    }),
    [Apple.TYPES.INCORPOREAL_PILL]: new AudioClip({
      file: "./assets/audio/eat-incorporeal-pill.mp3",
    }),
    [Apple.TYPES.DEATH_PILL]: new AudioClip({
      file: "./assets/audio/eat-death-pill.mp3",
    }),
    // grid
    [Apple.TYPES.WARP_PILL]: new AudioClip(),
  };

  static STATUS = {
    ACTIVE: "active",
    INCORPOREAL: "incorporeal",
  };

  static EVENTS = {
    EFFECT_APPLY: "effect-apply",
  };

  static currentAppleId = 0;

  static createFeatures(type) {
    if (!Apple.FEATURES[type]) {
      throw GameError.create(`Unknown apple type "${type}"!`);
    }

    return { ...Apple.FEATURES[type], id: ++Apple.currentAppleId };
  }

  constructor({ id, type, attributes, x, y, eventListener }) {
    this.id = id;
    this.type = type;
    this.attributes = attributes;
    this.x = x;
    this.y = y;
    this.eventListener = eventListener;

    this.status = Apple.STATUS.ACTIVE;

    this.sprite = new AppleSprite({ apple: this });
  }

  getGridPos() {
    return {
      x: this.x,
      y: this.y,
    };
  }

  setStatus(status) {
    this.status = status;
  }

  hasStatus(status) {
    return this.status === status;
  }

  draw(ctx) {
    this.sprite.draw(ctx);
  }

  applyEffect(target) {
    if (target instanceof Snake) {
      this.playAudioClip();

      this.applySnakeEffects(target);

      this.eventListener({ name: Apple.EVENTS.EFFECT_APPLY, target });
      return;
    }

    if (target instanceof Grid) {
      this.playAudioClip();

      this.applyGridEffects(target);

      this.eventListener({ name: Apple.EVENTS.EFFECT_APPLY, target });
      return;
    }

    throw GameError.create(`Unknown target object "${target}"!`, {
      meta: target,
    });
  }

  applySnakeEffects(snake) {
    for (const name in this.attributes) {
      if (name === "pointsInc") {
        snake.addPoints(this.attributes.pointsInc);
      }

      if (name === "snakeSizeInc") {
        snake.grow(this.attributes.snakeSizeInc);
      }

      if (name === "speedInc") {
        snake.incSpeed(this.attributes.speedInc);
      }

      if (name === "snakeSizeDec") {
        // TODO: die if size = 1 ;)
        snake.shrink(this.attributes.snakeSizeDec);
      }

      if (name === "incorporeal") {
        const ticksCount = this.attributes.incorporeal.durationInTicks(snake);

        snake.setIncorporeal(true, ticksCount);

        if (ticksCount > 0) {
          snake.setGridTickTimeout(
            () => snake.setIncorporeal(false),
            ticksCount
          );
        }
      }

      if (name === "addAcc") {
        snake.addAcc(this.attributes.addAcc.value);

        const ticksCount = this.attributes.addAcc.durationInTicks(snake);

        if (ticksCount > 0) {
          snake.setGridTickTimeout(() => snake.setAcc(0), ticksCount);
        }
      }
    }
  }

  applyGridEffects(grid) {
    for (const name in this.attributes) {
      if (name === "gridWarp") {
        grid.warp();
      }
    }
  }

  playAudioClip() {
    Apple.AUDIO_CLIPS[this.type].play();
  }
}
