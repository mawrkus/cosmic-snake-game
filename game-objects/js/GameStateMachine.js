class GameStateMachine extends StateMachine {
  static STATES = {
    IDLE: "idle",
    NEW_GAME: "new-game",
    RUNNING: "running",
    PAUSED: "paused",
    PROMPT_QUIT: "prompt-quit",
    GAME_OVER: "game-over",
  };

  static EVENTS = {
    // game
    GAME_START: "game-start",
    // player input
    INPUT_PLAY_PAUSE: "input-play-pause",
    INPUT_TURN_LEFT: "input-turn-left",
    INPUT_TURN_RIGHT: "input-turn-right",
    INPUT_DISCARD: "input-discard",
    INPUT_CONFIRM: "input-confirm",
    INPUT_KEY_D: "input-key-d", // debug info show/hide
    INPUT_KEY_C: "input-key-c", // control panel show/hide
    INPUT_KEY_M: "input-key-m", // music on/off
    INPUT_KEY_BRACKET_RIGHT: "input-key-bracket-right", // speed + 0.1
    INPUT_KEY_BRACKET_LEFT: "input-key-bracket-left", // speed + 0.1
    // snake
    SNAKE_EAT: "snake-eat",
    SNAKE_COLLISION: "snake-collision",
    SNAKE_ACCELERATE: "snake-accelerate",
    SNAKE_SHAKE: "snake-shake",
    // apple
    APPLE_SPAWN: "apple-spawn",
  };

  constructor({ game, onTransition }) {
    super({
      onTransition,
      initialStateId: GameStateMachine.STATES.IDLE,
      context: {
        game,
        world: game.world,
        snake: game.world.getSnake(),
      },
      states: {
        [GameStateMachine.STATES.IDLE]: {
          events: {
            [GameStateMachine.EVENTS.INPUT_PLAY_PAUSE]: {
              targetId: GameStateMachine.STATES.NEW_GAME,
            },
          },
        },
        [GameStateMachine.STATES.NEW_GAME]: {
          // transient state
          onEntry(ctx) {
            ctx.game.startNewGame();

            this.sendEvent(GameStateMachine.EVENTS.GAME_START);
          },
          events: {
            [GameStateMachine.EVENTS.APPLE_SPAWN]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx, event) {
                const appleProps = ctx.world.spawnApple(event.data);

                // hack to pass more info (e.g. the position) to the onTransition listener (see Game.js)
                // alternative: create a transient state SPAWN_APPLE & send an event from its onEntry
                event.data = appleProps;
              },
            },
            [GameStateMachine.EVENTS.GAME_START]: {
              targetId: GameStateMachine.STATES.RUNNING,
            },
          },
        },
        [GameStateMachine.STATES.RUNNING]: {
          events: {
            [GameStateMachine.EVENTS.INPUT_TURN_LEFT]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx) {
                ctx.world.getSnake().turn(Snake.TURNS.LEFT);
              },
            },
            [GameStateMachine.EVENTS.INPUT_TURN_RIGHT]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx) {
                ctx.world.getSnake().turn(Snake.TURNS.RIGHT);
              },
            },
            [GameStateMachine.EVENTS.SNAKE_EAT]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx, event) {
                ctx.game.eat(event.data);
              },
            },
            [GameStateMachine.EVENTS.SNAKE_COLLISION]: {
              targetId: GameStateMachine.STATES.GAME_OVER,
            },
            [GameStateMachine.EVENTS.SNAKE_ACCELERATE]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx, event) {
                ctx.snake.setAcc(event.data.acc, event.data.durationInTicks);

                if (event.data.speedInc) {
                  ctx.snake.incSpeed(event.data.speedInc);
                }
              },
            },
            [GameStateMachine.EVENTS.SNAKE_SHAKE]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx, event) {
                ctx.snake.shake(event.data.threshold, event.data.factor);
              },
            },
            [GameStateMachine.EVENTS.APPLE_SPAWN]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx, event) {
                const appleProps = ctx.world.spawnApple(event.data);

                // hack to pass more info (e.g. the position) to the onTransition listener (see Game.js)
                // alternative: create a transient state SPAWN_APPLE & send an event from its onEntry
                event.data = appleProps;
              },
            },
            [GameStateMachine.EVENTS.INPUT_KEY_D]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx) {
                ctx.game.toggleDebugInfo();
              },
            },
            [GameStateMachine.EVENTS.INPUT_KEY_C]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx) {
                ctx.game.toggleControlPanel();
              },
            },
            [GameStateMachine.EVENTS.INPUT_KEY_M]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx) {
                ctx.game.toggleMusic();
              },
            },
            [GameStateMachine.EVENTS.INPUT_KEY_BRACKET_RIGHT]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx) {
                ctx.snake.incSpeed(0.1);
              },
            },
            [GameStateMachine.EVENTS.INPUT_KEY_BRACKET_LEFT]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx) {
                ctx.snake.incSpeed(-0.1);
              },
            },
            [GameStateMachine.EVENTS.INPUT_PLAY_PAUSE]: {
              targetId: GameStateMachine.STATES.PAUSED,
            },
            [GameStateMachine.EVENTS.INPUT_DISCARD]: {
              targetId: GameStateMachine.STATES.PROMPT_QUIT,
            },
          },
        },
        [GameStateMachine.STATES.PAUSED]: {
          onEntry(ctx) {
            ctx.game.pause();
          },
          events: {
            [GameStateMachine.EVENTS.INPUT_KEY_D]: {
              targetId: GameStateMachine.STATES.PAUSED,
              action(ctx) {
                ctx.game.toggleDebugInfo(true);
              },
            },
            [GameStateMachine.EVENTS.INPUT_KEY_C]: {
              targetId: GameStateMachine.STATES.PAUSED,
              action(ctx) {
                ctx.game.toggleControlPanel();
              },
            },
            [GameStateMachine.EVENTS.INPUT_KEY_M]: {
              targetId: GameStateMachine.STATES.PAUSED,
              action(ctx) {
                ctx.game.toggleMusic();
              },
            },
            [GameStateMachine.EVENTS.INPUT_KEY_BRACKET_RIGHT]: {
              targetId: GameStateMachine.STATES.PAUSED,
              action(ctx) {
                ctx.snake.incSpeed(0.1);
                ctx.game.displayDebugInfo();
              },
            },
            [GameStateMachine.EVENTS.INPUT_KEY_BRACKET_LEFT]: {
              targetId: GameStateMachine.STATES.PAUSED,
              action(ctx) {
                ctx.snake.incSpeed(-0.1);
                ctx.game.displayDebugInfo();
              },
            },
            [GameStateMachine.EVENTS.INPUT_PLAY_PAUSE]: {
              targetId: GameStateMachine.STATES.RUNNING,
              action(ctx) {
                ctx.game.resume();
              },
            },
            [GameStateMachine.EVENTS.INPUT_DISCARD]: {
              targetId: GameStateMachine.STATES.PROMPT_QUIT,
            },
          },
        },
        [GameStateMachine.STATES.PROMPT_QUIT]: {
          onEntry(ctx) {
            ctx.game.promptQuit();
          },
          events: {
            [GameStateMachine.EVENTS.INPUT_DISCARD]: [
              {
                cond: (e) => e.prevStateId === GameStateMachine.STATES.PAUSED,
                targetId: GameStateMachine.STATES.PAUSED,
              },
              {
                cond: (e) => e.prevStateId === GameStateMachine.STATES.RUNNING,
                targetId: GameStateMachine.STATES.RUNNING,
                action(ctx) {
                  ctx.game.resume();
                },
              },
            ],
            [GameStateMachine.EVENTS.INPUT_CONFIRM]: {
              targetId: GameStateMachine.STATES.GAME_OVER,
            },
          },
        },
        [GameStateMachine.STATES.GAME_OVER]: {
          onEntry(ctx, event) {
            ctx.game.gameOver(event.data);
          },
          events: {
            [GameStateMachine.EVENTS.INPUT_PLAY_PAUSE]: {
              targetId: GameStateMachine.STATES.NEW_GAME,
            },
            [GameStateMachine.EVENTS.INPUT_CONFIRM]: {
              targetId: GameStateMachine.STATES.NEW_GAME,
            },
          },
        },
      },
    });
  }
}
