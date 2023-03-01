class Game {
  constructor() {
    // Internals
    this.loop = this.loop.bind(this);
    this.requestAnimationFrameId = null;
    this.eventsQueue = null;
    this.debug = false;

    // Multimedia
    this.world = new World();
    this.messages = new Messages();

    this.gameLoopMusicClip = null;
    this.music = true;

    this.audioClips = {
      gameLoop0: new AudioClip({
        file: "./assets/audio/game-loop0.mp3",
        loop: true,
        volume: 0.5,
      }),
      gameLoop1: new AudioClip({
        file: "./assets/audio/game-loop1.mp3",
        loop: true,
        volume: 0.5,
      }),
      gameOver: new AudioClip({
        file: "./assets/audio/game-over.mp3",
      }),
    };

    // GamePlay
    this.timer = new Timer({
      intervals: Object.values(GamePlay.TIMER_INTERVALS),
    });

    this.stateMachine = new GameStateMachine({
      game: this,
      onTransition: ({ event }, { snake }) => {
        // console.log("[game-state-machine]", JSON.stringify(event));

        if (event.prevStateId === null) {
          return;
        }

        this.eventsQueue.push({
          ...event,
          meta: {
            snake: {
              ...snake.getGridPos(),
              dir: snake.getDirName(),
              size: snake.getSize(),
              speed: snake.getSpeed(),
              acc: snake.getAcc(),
              points: snake.getPoints(),
            },
          },
        });
      },
    });

    this.gamePlay = new GamePlay({ game: this });

    // Input controller
    this.gameInputController = new KeyboardInputController({
      id: "game-input-controller",
      keysToEventsMapping: {
        Space: GameStateMachine.EVENTS.INPUT_PLAY_PAUSE,
        Escape: GameStateMachine.EVENTS.INPUT_DISCARD,
        Enter: GameStateMachine.EVENTS.INPUT_CONFIRM,
        KeyD: GameStateMachine.EVENTS.INPUT_KEY_D,
        KeyC: GameStateMachine.EVENTS.INPUT_KEY_C,
        KeyM: GameStateMachine.EVENTS.INPUT_KEY_M,
        BracketRight: GameStateMachine.EVENTS.INPUT_KEY_BRACKET_RIGHT,
        BracketLeft: GameStateMachine.EVENTS.INPUT_KEY_BRACKET_LEFT,
      },
      stateMachine: this.stateMachine,
    });
  }

  bootstrap() {
    this.gameInputController.bindEvents();

    this.messages.bindEvents({
      onClickMusicButton: () =>
        this.gameInputController.emitKeyboardEvent("KeyM"),
      onClickLeftButton: () => {
        this.world.getSnake().inputController.emitKeyboardEvent("ArrowLeft");
      },
      onClickRightButton: () => {
        this.world.getSnake().inputController.emitKeyboardEvent("ArrowRight");
      },
    });
  }

  startNewGame() {
    // Internals
    this.eventsQueue = [];

    // Multimedia
    this.initWorld();
    this.initGrid();
    this.initSnake();
    this.initMusic();
    this.initMessages();

    // GamePlay
    this.timer.init();
    this.gamePlay.init();

    // Kick-off
    this.stateMachine.sendEvent(
      GameStateMachine.EVENTS.APPLE_SPAWN,
      Apple.TYPES.FOOD
    );

    this.loop();
  }

  initWorld() {
    this.world.init();
  }

  initGrid() {
    this.world.initGrid({
      width: 26,
      height: 20,
    });
  }

  initSnake() {
    const { width, height } = this.world.getGrid().getGridDimensions();

    this.world.initSnake({
      x: Math.floor(width / 2),
      y: Math.floor(height / 2),
      dir: Math.floor(Math.random() * Snake.DIRS_COUNT),
      bodySize: 2,
      speed: 1,
      acc: 1, // tweaked for snake.init()
      points: 0,
      eventListener: (event) => {
        if (event.name === Snake.EVENTS.POINTS_ADD) {
          this.messages.displayPoints(event.target, event.data);
        }
      },
      inputController: new KeyboardInputController({
        id: "snake-input-controller",
        keysToEventsMapping: {
          ArrowLeft: GameStateMachine.EVENTS.INPUT_TURN_LEFT,
          ArrowRight: GameStateMachine.EVENTS.INPUT_TURN_RIGHT,
        },
        stateMachine: this.stateMachine,
      }),
    });
  }

  initMusic() {
    this.audioClips.gameOver.stop(); // just in case

    if (this.music) {
      this.gameLoopMusicClip =
        this.audioClips[`gameLoop${Math.floor(Math.random() * 2)}`];

      this.gameLoopMusicClip.play();
    }
  }

  initMessages() {
    this.messages.clear();
    this.messages.showMetrics();
    this.messages.displayPoints(this.world.getSnake());
    this.messages.displayMusicStatus(this.music);
  }

  loop() {
    // Timer
    this.timer.tick();
    this.messages.displayTimer(this.timer.getMeasurements().elapsed.val());

    // GamePlay
    this.gamePlay.applyLoopRules();

    // Update
    const collision = this.world.update();

    // Draw
    this.world.draw();

    // GamePlay: collisions
    if (collision.isApple) {
      this.timer.markInterval(GamePlay.TIMER_INTERVALS.SNAKE_EAT);

      this.stateMachine.sendEvent(GameStateMachine.EVENTS.SNAKE_EAT, {
        id: collision.apple.id,
        type: collision.apple.type,
        attributes: collision.apple.attributes,
        x: collision.apple.x,
        y: collision.apple.y,
      });
    }

    if (collision.isGrid || collision.isSnake) {
      this.stateMachine.sendEvent(
        GameStateMachine.EVENTS.SNAKE_COLLISION,
        collision
      );
      return; // exit game loop
    }

    // Internals
    if (this.debug) {
      this.displayDebugInfo();
    }

    // Loop
    this.requestAnimationFrameId = requestAnimationFrame(this.loop);
  }

  stopLoop() {
    cancelAnimationFrame(this.requestAnimationFrameId);

    this.timer.pause();
  }

  eat(appleFeatures) {
    if (appleFeatures.type === Apple.TYPES.FOOD) {
      this.stateMachine.sendEvent(
        GameStateMachine.EVENTS.APPLE_SPAWN,
        Apple.TYPES.FOOD
      );
    }
  }

  pause() {
    this.stopLoop();

    this.world.pause();

    this.messages.displayPausedMessage({ text: "Game Paused" });
  }

  promptQuit() {
    this.stopLoop();

    this.world.pause();

    this.messages.displayPausedMessage({
      text: "Quit?",
      ctaText: "Press Enter to confirm",
    });
  }

  resume() {
    this.messages.clear();

    this.world.activate();

    this.loop();
  }

  gameOver(collision) {
    this.stopLoop();

    this.gameLoopMusicClip.stop();

    if (collision) {
      this.world.collide(collision.isGrid);

      this.audioClips.gameOver.play();

      this.messages.displayGameOverMessage({
        text: "Oh no! Game Over.",
        ctaText: "Press Enter to play again",
        addCtaTextDelay: true,
      });
    } else {
      this.messages.displayGameOverMessage({
        text: "Game Ended",
        ctaText: "Press Enter to play again",
      });
    }

    this.world.gameOver();

    if (this.debug) {
      this.displayDebugInfo();
    }

    console.info(
      "🕹️",
      this.eventsQueue.sort((a, b) => a.timestamp - b.timestamp)
    );
  }

  toggleMusic() {
    this.music = this.gameLoopMusicClip.toggle();

    this.messages.displayMusicStatus(this.music);
  }

  toggleControlPanel() {
    this.messages.toggleControlPanel();
  }

  toggleDebugInfo(display = false) {
    this.debug = !this.debug;

    this.messages.toggleDebugInfo();

    if (display) {
      this.displayDebugInfo();
    }
  }

  displayDebugInfo() {
    const snake = this.world.getSnake();

    let { x, y } = snake.getParts()[0];
    [x, y] = [String(x).padStart(2, "0"), String(y).padStart(2, "0")];

    const top = `${snake.getStatus()} at [${x},${y}]`;
    const bottom = `size=${snake.getSize()} | acc=${snake.getAcc()} | speed=${snake.getSpeed()}`;

    this.messages.displayDebugInfo(top, bottom);
  }
}
