class GamePlay {
  static TIMER_INTERVALS = {
    SNAKE_EAT: "snake-eat",
    SNAKE_CAN_ACCELERATE: "snake-can-accelerate",
  };

  constructor({ game }) {
    this.game = game;
    this.timer = game.timer;

    this.rulesPeriod = 1000;
    this.rules = GamePlay.RULES;

    this.rulesContext = {
      timer: this.timer,
      snake: this.game.world.getSnake(),
      stateMachine: this.game.stateMachine,
      audioClips: {
        accelerate: new AudioClip({
          file: "./assets/audio/gameplay-accelerate.mp3",
        }),
        decelerate: new AudioClip({
          file: "./assets/audio/gameplay-decelerate.mp3",
        }),
      },
    };

    this.disabledRules = null;
  }

  init() {
    this.disabledRules = new Set();

    this.timer.markInterval(GamePlay.TIMER_INTERVALS.SNAKE_CAN_ACCELERATE);
  }

  applyLoopRules() {
    if (!this.timer.hasPassed(this.rulesPeriod)) {
      return;
    }

    const timerMeasurements = this.timer.getMeasurements();

    for (const rule of this.rules) {
      if (this._applyRule(rule, timerMeasurements)) {
        // console.info(
        //   "[gameplay] %s",
        //   rule.name,
        //   timerMeasurements.elapsed.val()
        // );
      }
    }
  }

  _applyRule(rule, whenArgument) {
    if (
      !this.disabledRules.has(rule) &&
      rule.when(whenArgument, this.rulesContext)
    ) {
      const keepDoing = rule.action(this.rulesContext);

      if (!keepDoing) {
        this.disabledRules.add(rule);
      }

      return true;
    }

    return false;
  }
}

GamePlay.RULES = [
  /*** warp ***/
  {
    name: "warp-pill-after-long-time",
    when: ({ elapsed }) => elapsed.gte(50000),
    action: ({ stateMachine }) => {
      if (Math.random() < 0.25) {
        stateMachine.sendEvent(
          GameStateMachine.EVENTS.APPLE_SPAWN,
          Apple.TYPES.WARP_PILL
        );

        return false;
      }

      return true;
    },
  },
  /*** incorporeal ***/
  {
    name: "spawn-incorporeal-pills-when-size-too-big",
    when: ({ elapsed }, { snake }) =>
      elapsed.gte(60000) && snake.getSize() >= 33,
    action: ({ stateMachine }) => {
      if (Math.random() < 0.05) {
        stateMachine.sendEvent(
          GameStateMachine.EVENTS.APPLE_SPAWN,
          Apple.TYPES.INCORPOREAL_PILL
        );
      }

      return true;
    },
  },
  /*** size ***/
  {
    name: "spawn-shrink-pills-when-size-too-big",
    when: (_, { snake }) => snake.getSize() >= 27,
    action: ({ stateMachine }) => {
      if (Math.random() < 0.05) {
        stateMachine.sendEvent(
          GameStateMachine.EVENTS.APPLE_SPAWN,
          Apple.TYPES.SHRINK_PILL
        );
      }

      return true;
    },
  },
  /*** acceleration/deceleration ***/
  {
    name: "spawn-deceleration-pills-if-high-speed",
    when: (_, { snake }) => snake.getSpeed() > 3,
    action: ({ stateMachine }) => {
      if (Math.random() < 0.1) {
        stateMachine.sendEvent(
          GameStateMachine.EVENTS.APPLE_SPAWN,
          Apple.TYPES.DECELERATE_PILL
        );
      }

      return true;
    },
  },
  {
    name: "acceleration-if-dont-eat-enough",
    when: ({ intervals }) =>
      intervals.gte(GamePlay.TIMER_INTERVALS.SNAKE_EAT, 7000) &&
      intervals.gte(GamePlay.TIMER_INTERVALS.SNAKE_CAN_ACCELERATE, 7000),
    action: ({ timer, stateMachine, audioClips }) => {
      timer.markInterval(GamePlay.TIMER_INTERVALS.SNAKE_CAN_ACCELERATE);

      stateMachine.sendEvent(GameStateMachine.EVENTS.SNAKE_ACCELERATE, {
        acc: 0.004,
        durationInTicks: 42,
      });

      audioClips.accelerate.play();

      return true;
    },
  },
  /*** shake ***/
  {
    name: "shake-hyper-nervous",
    when: ({ intervals }) =>
      intervals.gte(GamePlay.TIMER_INTERVALS.SNAKE_EAT, 20000),
    action: ({ stateMachine }) => {
      stateMachine.sendEvent(GameStateMachine.EVENTS.SNAKE_SHAKE, {
        threshold: 0.12,
        factor: 4,
      });

      return true;
    },
  },
  {
    name: "shake-nervous",
    when: ({ intervals }) =>
      intervals.between(GamePlay.TIMER_INTERVALS.SNAKE_EAT, 12000, 20000),
    action: ({ stateMachine }) => {
      stateMachine.sendEvent(GameStateMachine.EVENTS.SNAKE_SHAKE, {
        threshold: 0.1,
        factor: 3.5,
      });

      return true;
    },
  },
  {
    name: "shake-mildly-nervous",
    when: ({ intervals }) =>
      intervals.between(GamePlay.TIMER_INTERVALS.SNAKE_EAT, 5000, 12000),
    action: ({ stateMachine }) => {
      stateMachine.sendEvent(GameStateMachine.EVENTS.SNAKE_SHAKE, {
        threshold: 0.05,
        factor: 3,
      });

      return true;
    },
  },
  {
    name: "relaxed",
    when: ({ intervals }) =>
      intervals.lt(GamePlay.TIMER_INTERVALS.SNAKE_EAT, 5000),
    action: ({ stateMachine }) => {
      stateMachine.sendEvent(GameStateMachine.EVENTS.SNAKE_SHAKE, {
        threshold: 0,
        factor: 0,
      });

      return true;
    },
  },
];
