class World {
  constructor() {
    this.introScreenElement = document.querySelector(".intro-screen");
    this.gameBackgroundElement = document.querySelector(".game-background");
    this.worldElement = document.querySelector(".world");

    this.canvasElement = document.querySelector(".grid");
    this.ctx = this.canvasElement.getContext("2d");

    this.objects = {
      grid: new Grid({ canvasElement: this.canvasElement }),
      snake: new Snake({ id: 1 }),
      apples: null,
    };
  }

  getGrid() {
    return this.objects.grid;
  }

  getSnake() {
    return this.objects.snake;
  }

  init() {
    this.introScreenElement.classList.add("hidden");

    this.gameBackgroundElement.classList.remove(
      "flash",
      "img0",
      "img1",
      "img2"
    );

    this.gameBackgroundElement.classList.add(
      `img${Math.floor(Math.random() * 3)}`
    );

    this.worldElement.classList.remove("hidden");

    this.objects.apples = [];
  }

  initGrid(gridFeatures) {
    this.objects.grid.init(gridFeatures);
  }

  initSnake(snakeFeatures) {
    this.objects.snake.init(snakeFeatures);
  }

  draw() {
    const { grid, apples, snake } = this.objects;

    grid.draw(this.ctx);
    snake.draw(this.ctx);

    // after snake so that apples being digested are still visible in its body
    apples.forEach((apple) => apple.draw(this.ctx));
  }

  activate() {
    this.objects.grid.activate();
  }

  pause() {
    this.objects.grid.pause(this.ctx);
  }

  collide(isGrid) {
    if (isGrid) {
      this.objects.grid.collide(this.objects.snake);
    }

    this.gameBackgroundElement.classList.add("flash");
  }

  gameOver() {
    this.objects.grid.gameOver(this.ctx);
  }

  update() {
    const collision = {};
    const { snake, grid } = this.objects;

    const isGridTick = snake.update();

    if (!isGridTick) {
      return {};
    }

    const apple = this.checkForAppleCollision();

    if (apple) {
      collision.isApple = true;
      collision.apple = apple;

      // done here to allow the snake to benefit from warp & incorporeal pills
      apple.applyEffect(grid);
      apple.applyEffect(snake);

      apple.setStatus(Apple.STATUS.INCORPOREAL);

      snake.setStatus(Snake.STATUS.EATING);
    }

    if (this.checkForSnakeCollision()) {
      collision.isSnake = true;

      snake.setStatus(Snake.STATUS.COLLISION);

      return collision;
    }

    if (this.checkForGridCollision()) {
      collision.isGrid = true;

      snake.setStatus(Snake.STATUS.COLLISION);

      return collision;
    }

    snake.setStatus(Snake.STATUS.MOVING);

    return collision;
  }

  checkForAppleCollision() {
    const { snake, apples } = this.objects;
    const snakeGridPos = snake.getGridPos();

    return apples.find(
      (apple) =>
        apple.x === snakeGridPos.x &&
        apple.y === snakeGridPos.y &&
        apple.hasStatus(Apple.STATUS.ACTIVE)
    );
  }

  checkForSnakeCollision() {
    const { snake } = this.objects;
    const snakeGridPos = snake.getGridPos();

    return (
      !snake.isIncorporeal() &&
      snake
        .getBodyMovingParts()
        .some(({ x, y }) => x === snakeGridPos.x && y === snakeGridPos.y)
    );
  }

  checkForGridCollision() {
    const { snake, grid } = this.objects;
    const { width, height } = grid.getGridDimensions();

    if (grid.isWarped()) {
      for (const part of snake.getParts()) {
        if (part.x < 0) {
          snake.setGridPos(width + part.x, part.y, part);
        } else if (part.x >= width) {
          snake.setGridPos(part.x - width, part.y, part);
        }

        if (part.y < 0) {
          snake.setGridPos(part.x, height + part.y, part);
        } else if (part.y >= height) {
          snake.setGridPos(part.x, part.y - height, part);
        }
      }

      return false;
    }

    const snakeGridPos = snake.getGridPos();
    const snakeDirname = snake.getDirName();

    return (
      (snakeGridPos.x <= 0 && snakeDirname === "left") ||
      (snakeGridPos.x >= width - 1 && snakeDirname === "right") ||
      (snakeGridPos.y <= 0 && snakeDirname === "up") ||
      (snakeGridPos.y >= height - 1 && snakeDirname === "down")
    );
  }

  spawnApple(appleType) {
    const { grid, snake, apples } = this.objects;
    const { width, height } = grid.getGridDimensions();
    const objectsToCheck = [
      ...snake.getParts(),
      ...apples.filter((apple) => apple.hasStatus(Apple.STATUS.ACTIVE)),
    ];

    let collision = false;
    let newAppleX;
    let newAppleY;

    do {
      [newAppleX, newAppleY] = [
        Math.floor(Math.random() * width),
        Math.floor(Math.random() * height),
      ];

      collision = objectsToCheck.some(
        ({ x, y }) => x === newAppleX && y === newAppleY
      );
    } while (collision);

    const appleProps = {
      ...Apple.createFeatures(appleType),
      x: newAppleX,
      y: newAppleY,
    };

    const apple = new Apple({
      ...appleProps,
      eventListener: (event) => {
        if (
          event.name === Apple.EVENTS.EFFECT_APPLY &&
          event.target instanceof Snake
        ) {
          const ticksCount = event.target.getSize() - 1;

          if (ticksCount === 0) {
            this.removeApple(apple);
            return;
          }

          event.target.setGridTickTimeout(
            () => this.removeApple(apple),
            ticksCount
          );
        }
      },
    });

    apples.push(apple);

    return appleProps;
  }

  removeApple(apple) {
    this.objects.apples = this.objects.apples.filter((a) => a !== apple);
  }
}
