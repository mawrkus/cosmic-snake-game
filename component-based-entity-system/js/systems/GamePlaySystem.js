import { AppleEntity } from "../entities/apple/AppleEntity.js";
import { bindAll } from "../helpers/index.js";
import { FeaturesTimedEffectComponent } from "../components/FeaturesTimedEffectComponent.js";
import { GameEntityManager } from "../entities/GameEntityManager.js";
import { GameError } from "../errors/GameError.js";
import { GameStateMachine } from "../state-machine/GameStateMachine.js";
import { GridEntity } from "../entities/grid/GridEntity.js";
import { LifespanComponent } from "../components/LifespanComponent.js";
import { MovementComponent } from "../components/MovementComponent.js";
import { MovementTimedEffectComponent } from "../components/MovementTimedEffectComponent.js";
import { SnakeEntity } from "../entities/snake/SnakeEntity.js";
import { System } from "./System.js";

export class GamePlaySystem extends System {
  constructor({ entityManager, stateMachine }) {
    super();

    this.entityManager = entityManager;
    this.stateMachine = stateMachine;

    this.secondsToSpawnFirstApple = null;
    this.secondsSinceLastFood = null;
    this.secondsSinceLastStressAcceleration = null;
    this.secondsSinceStart = null;

    bindAll(this, [
      "start",
      "spawnFirstApple",
      "snakeEatApple",
      "shakeIfNotEating",
      "accelerateIfNotEating",
      "spawnDeceleratePill",
      "spawnShrinkPill",
      "spawnIncorporealPill",
      "spawnWarpPill",
    ]);
  }

  bootstrap() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.on(EVENTS.GAME_START, this.start);
    this.stateMachine.on(EVENTS.SNAKE_EAT, this.snakeEatApple);
  }

  shutdown() {
    const { EVENTS } = GameStateMachine;

    this.disableRules();

    this.stateMachine.off(EVENTS.SNAKE_EAT, this.snakeEatApple);
    this.stateMachine.off(EVENTS.GAME_START, this.start);
  }

  start() {
    // we do this here on not on GAME_OVER because we want the player's keyboard controller active
    this.entityManager.removeAllEntities();

    // background image & music

    this.entityManager.createBackgroundEntity();

    // grid

    const gridWidth = 26;
    const gridHeight = 20;

    this.entityManager.createGridEntity({
      width: gridWidth,
      height: gridHeight,
    });

    // snake

    this.entityManager.createSnakeEntity({
      points: 0,
      x: Math.floor(gridWidth / 2),
      y: Math.floor(gridHeight / 2),
      dir: MovementComponent.randomDir(),
      size: 3,
      speed: 1,
      acc: 1,
      movementTimedEffect: {
        startDelayInTicks: 1,
        durationInTicks: 4,
        startValues: {
          setAcc: -0.15,
        },
        endValues: {
          setAcc: 0,
          setSpeed: 1,
        },
      },
    });

    // death pill

    this.stateMachine.sendEvent(GameStateMachine.EVENTS.ENTITY_CREATE, {
      category: GameEntityManager.CATEGORIES.APPLE,
      type: AppleEntity.TYPES.DEATH_PILL,
    });

    // time-based rules

    this.secondsToSpawnFirstApple = 0;
    this.secondsSinceLastFood = 0;
    this.secondsSinceLastStressAcceleration = 0;
    this.secondsSinceStart = 0;

    this.stateMachine.on(
      GameStateMachine.EVENTS.TIMER_SECOND,
      this.spawnFirstApple
    );
  }

  snakeEatApple(event) {
    this.secondsSinceLastFood = 0;

    this.applyAppleEffects(
      event.data.appleId,
      this.entityManager.getEntityComponent(event.data.appleId, "AppleEffect"),
      this.entityManager.getSnakeHeadComponents(["Movement", "Player"])
    );
  }

  applyAppleEffects(appleId, appleEffects, [snakeMovement, player]) {
    const effects = appleEffects.get();

    // console.log("[game-play] 🍏 Applying effects...", JSON.stringify(effects));

    for (const fx in effects) {
      if (fx === "incPoints") {
        const multiplier = 2 ** Math.floor(snakeMovement.getSpeed() - 1);

        // console.log(
        //   "incPoints multiplier: speed=%s, floor=%s, multiplier=%s",
        //   snakeMovement.getSpeed(),
        //   Math.floor(snakeMovement.getSpeed() - 1),
        //   multiplier
        // );
        // console.log(
        //   "________________________________________________________________"
        // );

        player.incPoints(effects[fx] * multiplier);

        this.stateMachine.sendEvent(GameStateMachine.EVENTS.PLAYER_SCORE, {
          points: player.getPoints(),
        });

        this.stateMachine.sendEvent(GameStateMachine.EVENTS.ENTITY_CREATE, {
          category: GameEntityManager.CATEGORIES.APPLE,
          type: AppleEntity.TYPES.FOOD,
        });

        continue;
      }

      if (fx === "setSpeed") {
        snakeMovement.setSpeed(effects[fx]);
        continue;
      }

      if (fx === "incSpeed") {
        snakeMovement.incSpeed(effects[fx]);
        continue;
      }

      if (fx === "incAcc") {
        this.createAccTimedEffect(effects[fx]);
        continue;
      }

      if (fx === "incSize") {
        this.entityManager.incSnakeSize(2);
        continue;
      }

      if (fx === "decSize") {
        this.entityManager.decSnakeSize(2);
        continue;
      }

      if (fx === "incorporealState") {
        this.createIncorporealTimedEffect(effects[fx]);
        continue;
      }

      if (fx === "warp") {
        this.entityManager
          .getEntityComponent(GridEntity.ID, "GridFeatures")
          .setHasWarp(true);
        continue;
      }

      if (fx === "setIsAlive") {
        this.killSnake(2);
        continue;
      }

      throw GameError.create(`Unknown apple effect "${fx}!`, {
        meta: effects,
      });
    }

    // console.log("[game-play] 🍎 Effects applied!", JSON.stringify(effects));

    this.digestApple(appleId);
  }

  digestApple(appleId) {
    this.entityManager
      .getEntityComponent(appleId, "AppleFeatures")
      .setIsInactive(true);

    this.entityManager.addComponent(
      appleId,
      new LifespanComponent({
        durationInTicks: this.entityManager.getSnakeEntities().length - 1,
        reason: "being eaten",
      })
    );
  }

  killSnake(durationInTicks) {
    for (const [snakeFeatures] of this.entityManager.getSnakeEntitiesComponents(
      ["SnakeFeatures"]
    )) {
      snakeFeatures.setIsAlive(false);

      this.entityManager.addComponent(
        snakeFeatures.getEntityId(),
        new LifespanComponent({ durationInTicks, reason: "food poisoning" })
      );
    }
  }

  createAccTimedEffect({ value, durationInTicks }) {
    this.entityManager.upsertComponent(
      SnakeEntity.ID,
      new MovementTimedEffectComponent({
        durationInTicks,
        startValues: {
          incAcc: value,
        },
        endValues: { setAcc: 0 },
      })
    );
  }

  createIncorporealTimedEffect({ durationInTicks }) {
    this.entityManager.upsertComponent(
      SnakeEntity.ID,
      new FeaturesTimedEffectComponent({
        targetComponentName: "SnakeFeatures",
        durationInTicks,
        startValues: {
          setIncorporealState: SnakeEntity.INCORPOREAL_STATE.IS,
        },
        endSoonValues: {
          setIncorporealState: SnakeEntity.INCORPOREAL_STATE.IS_END_SOON,
        },
        endValues: {
          setIncorporealState: SnakeEntity.INCORPOREAL_STATE.IS_NOT,
        },
      })
    );
  }

  spawnFirstApple() {
    this.secondsToSpawnFirstApple += 1;

    if (this.secondsToSpawnFirstApple >= 3) {
      this.stateMachine.off(
        GameStateMachine.EVENTS.TIMER_SECOND,
        this.spawnFirstApple
      );

      this.stateMachine.sendEvent(GameStateMachine.EVENTS.ENTITY_CREATE, {
        category: GameEntityManager.CATEGORIES.APPLE,
        type: AppleEntity.TYPES.FOOD,
      });

      // we do this only now to ensure that (e.g.) rules based on speed are not triggered at start
      // because we make the snake "rush" onto the grid when it's created
      this.enableRules();
    }
  }

  enableRules() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.on(EVENTS.TIMER_SECOND, this.shakeIfNotEating);
    this.stateMachine.on(EVENTS.TIMER_SECOND, this.accelerateIfNotEating);
    this.stateMachine.on(EVENTS.TIMER_SECOND, this.spawnDeceleratePill);
    this.stateMachine.on(EVENTS.TIMER_SECOND, this.spawnShrinkPill);
    this.stateMachine.on(EVENTS.TIMER_SECOND, this.spawnIncorporealPill);
    this.stateMachine.on(EVENTS.TIMER_SECOND, this.spawnWarpPill);
  }

  disableRules() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.off(EVENTS.TIMER_SECOND, this.spawnFirstApple);

    this.stateMachine.off(EVENTS.TIMER_SECOND, this.spawnWarpPill);
    this.stateMachine.off(EVENTS.TIMER_SECOND, this.shakeIfNotEating);
    this.stateMachine.off(EVENTS.TIMER_SECOND, this.accelerateIfNotEating);
    this.stateMachine.off(EVENTS.TIMER_SECOND, this.spawnDeceleratePill);
    this.stateMachine.off(EVENTS.TIMER_SECOND, this.spawnShrinkPill);
    this.stateMachine.off(EVENTS.TIMER_SECOND, this.spawnIncorporealPill);
  }

  shakeIfNotEating() {
    this.secondsSinceLastFood += 1;

    let amplitude;

    if (this.secondsSinceLastFood < 5) {
      amplitude = 0;
    } else if (this.secondsSinceLastFood < 12) {
      amplitude = 0.07;
    } else if (this.secondsSinceLastFood < 21) {
      amplitude = 0.12;
    } else {
      amplitude = 0.2;
    }

    for (const [shake] of this.entityManager.getSnakeEntitiesComponents([
      "Shake",
    ])) {
      shake.setAmplitude(amplitude);
    }
  }

  accelerateIfNotEating() {
    this.secondsSinceLastStressAcceleration += 1;

    if (this.secondsSinceLastStressAcceleration >= 7) {
      if (this.secondsSinceLastFood < 7) {
        return;
      }

      this.secondsSinceLastStressAcceleration = 0;

      const props = { value: 0.01, durationInTicks: 10 };

      this.createAccTimedEffect(props);

      this.stateMachine.sendEvent(
        GameStateMachine.EVENTS.SNAKE_ACCELERATE_STRESS,
        props
      );
    }
  }

  spawnDeceleratePill() {
    if (Math.random() < 0.1) {
      const movement = this.entityManager.getSnakeHeadComponent("Movement");

      if (movement.getSpeed() >= 3)
        this.stateMachine.sendEvent(GameStateMachine.EVENTS.ENTITY_CREATE, {
          category: GameEntityManager.CATEGORIES.APPLE,
          type: AppleEntity.TYPES.DECELERATE_PILL,
        });
    }
  }

  spawnShrinkPill() {
    if (Math.random() < 0.1) {
      const size = this.entityManager.getSnakeEntities().length;

      if (size >= 27) {
        this.stateMachine.sendEvent(GameStateMachine.EVENTS.ENTITY_CREATE, {
          category: GameEntityManager.CATEGORIES.APPLE,
          type: AppleEntity.TYPES.SHRINK_PILL,
        });
      }
    }
  }

  spawnIncorporealPill() {
    if (Math.random() < 0.1) {
      const size = this.entityManager.getSnakeEntities().length;

      if (size >= 33) {
        this.stateMachine.sendEvent(GameStateMachine.EVENTS.ENTITY_CREATE, {
          category: GameEntityManager.CATEGORIES.APPLE,
          type: AppleEntity.TYPES.INCORPOREAL_PILL,
        });
      }
    }
  }

  spawnWarpPill() {
    this.secondsSinceStart += 1;

    if (this.secondsSinceStart >= 60 && Math.random() < 0.15) {
      this.stateMachine.off(
        GameStateMachine.EVENTS.TIMER_SECOND,
        this.spawnWarpPill
      );

      this.stateMachine.sendEvent(GameStateMachine.EVENTS.ENTITY_CREATE, {
        category: GameEntityManager.CATEGORIES.APPLE,
        type: AppleEntity.TYPES.WARP_PILL,
      });
    }
  }
}
