class Snake {
  // clockwise order is important
  static DIRS = [
    [0, -1], // up
    [+1, 0], // right
    [0, +1], // down
    [-1, 0], // left
  ];

  static DIR_NAMES = ["up", "right", "down", "left"];

  static DIRS_COUNT = Snake.DIRS.length;

  static TURNS = {
    LEFT: "left",
    RIGHT: "right",
  };

  static STATUS = {
    IDLE: "idle",
    MOVING: "moving",
    EATING: "eating",
    COLLISION: "collision",
  };

  static EVENTS = {
    POINTS_ADD: "points-add",
  };

  // TODO: keep?
  static toFixed(number, digits = 3) {
    return Number(number.toFixed(digits));
  }

  constructor({ id }) {
    this.id = id;
    this.status = null;
    this.incorporeal = null;
    this.points = null;

    this.parts = null;
    this.speed = null;
    this.acc = null;

    this.inputController = null;
    this.eventListener = null;
    this.gridTickObservers = null;

    this.sprite = new SnakeSprite({ snake: this });
  }

  init({
    x,
    y,
    dir,
    bodySize,
    speed,
    acc,
    points,
    eventListener,
    inputController,
  }) {
    this.status = Snake.STATUS.IDLE;
    this.incorporeal = false;
    this.points = points;

    this.parts = [
      {
        x,
        y,
        dir,
        nextDir: null,
        pixelsX: Grid.toPixels(x),
        pixelsY: Grid.toPixels(y),
        lastPixelsOnGridX: Grid.toPixels(x),
        lastPixelsOnGridY: Grid.toPixels(y),
        startupTicksInterval: 0,
      },
    ];

    this.grow(bodySize);

    this.speed = speed;
    this.acc = acc;

    this.inputController = inputController;

    this.inputController.bindEvents();

    this.eventListener = eventListener;

    this.gridTickObservers = [];

    // tweaked for initial snake speed/acc
    this.setGridTickTimeout(() => (this.acc = -0.15), 1);

    this.setGridTickTimeout(() => {
      this.speed = 1;
      this.acc = 0;
    }, 4);

    this.sprite.init();
  }

  getGridPos() {
    const [head] = this.parts;

    return {
      x: head.x,
      y: head.y,
    };
  }

  setGridPos(x, y, part = this.parts[0]) {
    part.x = x;
    part.y = y;

    part.pixelsX = Grid.toPixels(x);
    part.pixelsY = Grid.toPixels(y);

    part.lastPixelsOnGridX = part.pixelsX;
    part.lastPixelsOnGridY = part.pixelsY;
  }

  getPixelsPos() {
    const [head] = this.parts;

    return {
      x: head.pixelsX,
      y: head.pixelsY,
    };
  }

  getNextGridPos() {
    const { x, y } = this.getGridPos();
    const [incX, incY] = Snake.DIRS[this.parts[0].dir];

    return { x: x + incX, y: y + incY };
  }

  getDirName() {
    return Snake.DIR_NAMES[this.parts[0].dir];
  }

  setStatus(status) {
    this.status = status;
  }

  getStatus() {
    return this.status;
  }

  hasStatus(status) {
    return this.status === status;
  }

  setIncorporeal(hasNoBody, durationInTicks = 0) {
    this.incorporeal = hasNoBody;

    this.sprite.setIncorporeal(hasNoBody, durationInTicks);
  }

  isIncorporeal() {
    return this.incorporeal;
  }

  addPoints(pointsInc) {
    const multiplier = 2 ** Math.floor(this.speed - 1);

    this.points += pointsInc * multiplier;

    this.eventListener({
      name: Snake.EVENTS.POINTS_ADD,
      target: this,
      data: pointsInc,
    });
  }

  getPoints() {
    return this.points;
  }

  getSize() {
    return this.parts.length;
  }

  getAcc() {
    return this.acc;
  }

  getSpeed() {
    return this.speed;
  }

  setSpeed(value) {
    this.speed = Snake.toFixed(value);
  }

  incSpeed(inc) {
    this.speed = Snake.toFixed(this.speed + inc);
  }

  setAcc(value, durationInTicks = 0) {
    this.acc = value;

    if (durationInTicks > 0) {
      this.setGridTickTimeout(() => {
        this.setAcc(0);
        this.setSpeed(this.getSpeed()); // just for the call to toFixed()
      }, durationInTicks);
    }
  }

  addAcc(inc) {
    this.acc += inc;
  }

  turn(side) {
    const [head] = this.parts;

    head.nextDir = head.dir + (side === Snake.TURNS.LEFT ? -1 : +1);

    if (head.nextDir < 0) {
      head.nextDir = Snake.DIRS_COUNT - 1;
    } else if (head.nextDir >= Snake.DIRS_COUNT) {
      head.nextDir = 0;
    }
  }

  grow(growInc = 1) {
    const [head] = this.parts;

    const partsCount = this.parts.length;

    for (let i = 0; i < growInc; i += 1) {
      this.parts.push({
        x: head.x,
        y: head.y,
        pixelsX: Grid.toPixels(head.x),
        pixelsY: Grid.toPixels(head.y),
        lastPixelsOnGridX: Grid.toPixels(head.x),
        lastPixelsOnGridY: Grid.toPixels(head.y),
        dir: head.dir,
        nextDir: null,
        startupTicksInterval: partsCount + i,
      });
    }
  }

  shrink(shrinkDec = 1) {
    if (this.parts.length >= shrinkDec) {
      this.parts.splice(this.parts.length - shrinkDec, shrinkDec);
    }
  }

  // TODO: use status?
  shake(threshold, factor) {
    this.sprite.shake(threshold, factor);
  }

  getParts() {
    return this.parts;
  }

  getBodyMovingParts() {
    return this.parts.filter(
      ({ startupTicksInterval }, i) => i && !startupTicksInterval
    );
  }

  update() {
    const changeDirOps = [];
    const isGridTick = this.isGridTick();

    this.speed += this.acc;

    for (let i = 0; i < this.parts.length; i += 1) {
      const part = this.parts[i];

      if (part.startupTicksInterval > 0) {
        continue;
      }

      const [incX, incY] = Snake.DIRS[part.dir];

      if (!isGridTick) {
        part.pixelsX = Snake.toFixed(part.pixelsX + incX * this.speed);
        part.pixelsY = Snake.toFixed(part.pixelsY + incY * this.speed);
        continue;
      }

      part.x += incX * Math.sign(this.speed);
      part.y += incY * Math.sign(this.speed);

      part.pixelsX = Grid.toPixels(part.x);
      part.pixelsY = Grid.toPixels(part.y);

      [part.lastPixelsOnGridX, part.lastPixelsOnGridY] = [
        part.pixelsX,
        part.pixelsY,
      ];

      const nextPart = this.parts[i + 1];

      if (part.nextDir !== null) {
        [part.dir, part.nextDir] = [part.nextDir, null];

        if (nextPart) {
          changeDirOps.push(() => (nextPart.nextDir = part.dir));
        }
      }
    }

    if (isGridTick) {
      for (const part of this.parts) {
        if (part.startupTicksInterval > 0) {
          part.startupTicksInterval -= 1;
        }
      }

      for (const changeDir of changeDirOps) {
        changeDir();
      }
    }

    return isGridTick;
  }

  isGridTick() {
    const [head] = this.parts;

    const isTick =
      Math.abs(head.pixelsX - head.lastPixelsOnGridX) >= Grid.UNIT ||
      Math.abs(head.pixelsY - head.lastPixelsOnGridY) >= Grid.UNIT;

    if (isTick) {
      let i = this.gridTickObservers.length;

      while (i--) {
        const observer = this.gridTickObservers[i];

        if (--observer.ticksCount <= 0) {
          observer.callback();
          this.gridTickObservers.splice(i, 1);
        }
      }
    }

    return isTick;
  }

  setGridTickTimeout(callback, ticksCount = 0) {
    this.gridTickObservers.push({
      callback,
      ticksCount,
    });
  }

  draw(ctx) {
    this.sprite.draw(ctx);
  }
}
