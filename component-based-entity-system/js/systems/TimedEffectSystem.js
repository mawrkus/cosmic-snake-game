import { GameError } from "../errors/GameError.js";
import { bindAll } from "../helpers/index.js";
import { GameStateMachine } from "../state-machine/GameStateMachine.js";
import { System } from "./System.js";

export class TimedEffectSystem extends System {
  constructor({ entityManager, stateMachine }) {
    super();

    this.entityManager = entityManager;
    this.stateMachine = stateMachine;

    bindAll(this, ["tick"]);
  }

  bootstrap() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.on(EVENTS.GRID_TICK, this.tick);
  }

  shutdown() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.off(EVENTS.GRID_TICK, this.tick);
  }

  tick() {
    // console.log("[time-based] ⏲️ tick.");

    this.tickLifespan();

    for (const [timedEffect, target] of this.getTimedEffectComponents()) {
      if (!timedEffect.getHasStarted()) {
        timedEffect.incStartDelayInTicks(-1);

        if (timedEffect.getStartDelayInTicks() > 0) {
          // console.log(
          //   "[timed-effect] ⏲️ %s on %s: %d tick(s) before start",
          //   target.getName(),
          //   timedEffect.getEntityId(),
          //   timedEffect.getStartDelayInTicks(),
          //   JSON.stringify(target.get())
          // );
          continue;
        }

        this.startEffect(timedEffect, target);
      }

      timedEffect.incRemainingTicks(-1);

      if (
        !timedEffect.getHasNotifiedEndSoon() &&
        timedEffect.getRemainingTicks() <= timedEffect.getDurationInTicks() / 4
      ) {
        timedEffect.setHasNotifiedEndSoon(true);

        const endSoonValues = timedEffect.getEndSoonValues();

        // TODO: DRY
        for (const methodName in endSoonValues) {
          if (typeof target[methodName] !== "function") {
            throw GameError.create(`"${methodName}" is not a method!`, {
              meta: { target, endSoonValues },
            });
          }

          target[methodName](endSoonValues[methodName]);
        }
      }

      if (timedEffect.getRemainingTicks() > 0) {
        continue;
      }

      const endValues = timedEffect.getEndValues();

      // TODO: DRY
      for (const methodName in endValues) {
        if (typeof target[methodName] !== "function") {
          throw GameError.create(`"${methodName}" is not a method!`, {
            meta: { target, endValues },
          });
        }

        target[methodName](endValues[methodName]);
      }

      // console.log(
      //   "[timed-effect] ⏲️ %s end on %s",
      //   target.getName(),
      //   timedEffect.getEntityId(),
      //   JSON.stringify(target.get())
      // );

      timedEffect.remove();
    }
  }

  startEffect(timedEffect, target) {
    timedEffect.setHasStarted(true);

    const startValues = timedEffect.getStartValues();

    // TODO: DRY
    for (const methodName in startValues) {
      if (typeof target[methodName] !== "function") {
        throw GameError.create(`"${methodName}" is not a method!`, {
          meta: { target, startValues },
        });
      }

      target[methodName](startValues[methodName]);
    }

    // console.log(
    //   "[timed-effect] ⏲️ %s start on %s",
    //   target.getName(),
    //   timedEffect.getEntityId(),
    //   JSON.stringify(target.get())
    // );
  }

  tickLifespan() {
    for (const [lifespan] of this.entityManager.getComponents(["Lifespan"])) {
      lifespan.incRemainingTicks(-1);

      if (lifespan.getRemainingTicks() > 0) {
        continue;
      }

      // console.log(
      //   "[timed-effect] ⏲️ %s ended on %s, due to %s",
      //   lifespan.getName(),
      //   lifespan.getEntityId(),
      //   lifespan.getReason()
      // );

      const isSnakeEntity = this.entityManager.hasEntityComponent(
        lifespan.getEntityId(),
        "SnakeFeatures"
      );

      if (isSnakeEntity) {
        this.stateMachine.sendEvent(GameStateMachine.EVENTS.SNAKE_DEATH, {
          cause: {
            lifespan: {
              reason: lifespan.getReason(),
            },
          },
        });

        continue;
      }

      this.entityManager.removeEntity(lifespan.getEntityId());
    }
  }

  getTimedEffectComponents() {
    const components = [];

    this.entityManager.forEachEntities((entityData) => {
      const entityComponents = entityData.get("components");

      // we need two different classes because our entities cannot currently have more than
      // one component of the same class
      for (const timedEffectComponentName of [
        "FeaturesTimedEffect",
        "MovementTimedEffect",
      ]) {
        if (entityComponents.has(timedEffectComponentName)) {
          const movementTimedEffect = entityComponents.get(
            timedEffectComponentName
          );

          components.push([
            movementTimedEffect,
            entityComponents.get(movementTimedEffect.getTargetComponentName()),
          ]);
        }
      }
    });

    return components;
  }
}
