import { AnimationComponent } from "../../components/AnimationComponent.js";
import { AppleEffectComponent } from "../../components/AppleEffectComponent.js";
import { AppleFeaturesComponent } from "../../components/AppleFeaturesComponent.js";
import { AudioComponent } from "../../components/AudioComponent.js";
import { enumeration } from "../../helpers/index.js";
import { GameError } from "../../errors/GameError.js";
import { LifespanComponent } from "../../components/LifespanComponent.js";
import { PositionComponent } from "../../components/PositionComponent.js";

// https://pixabay.com/sound-effects
// https://twistedwave.com/online

export class AppleEntity {
  static ID_PREFIX = "APPLE";

  static TYPES = enumeration([
    // snake effects
    "FOOD",
    "SHRINK_PILL",
    "DECELERATE_PILL",
    "INCORPOREAL_PILL",
    "DEATH_PILL",
    // grid effects
    "WARP_PILL",
  ]);

  static BLUEPRINTS = {
    // snake effects
    [AppleEntity.TYPES.FOOD]: {
      effects: {
        incPoints: 1,
        incSpeed: 0.12,
        incSize: 2,
      },
      lifespan: {
        durationInTicks: Number.POSITIVE_INFINITY,
        reason: "aging",
      },
      animation: {
        className: "AppleFoodCanvasAnimation",
      },
      audio: {
        eat: {
          file: "./assets/audio/eat-food.mp3",
        },
      },
    },
    [AppleEntity.TYPES.SHRINK_PILL]: {
      effects: {
        decSize: 2,
      },
      lifespan: {
        durationInTicks: Number.POSITIVE_INFINITY,
        reason: "aging",
      },
      animation: {
        className: "AppleShrinkPillCanvasAnimation",
      },
      audio: {
        eat: {
          file: "./assets/audio/eat-shrink-pill.mp3",
        },
      },
    },
    [AppleEntity.TYPES.DECELERATE_PILL]: {
      effects: {
        incAcc: {
          // opposite values of GamePlaySystem.accelerateIfNoFood()
          value: -0.01,
          durationInTicks: 10,
        },
      },
      lifespan: {
        durationInTicks: 64,
        reason: "aging",
      },
      animation: {
        className: "AppleDeceleratePillCanvasAnimation",
      },
      audio: {
        eat: {
          file: "./assets/audio/eat-decelerate-pill.mp3",
        },
      },
    },
    [AppleEntity.TYPES.INCORPOREAL_PILL]: {
      effects: {
        incorporealState: {
          durationInTicks: 192,
        },
      },
      lifespan: {
        durationInTicks: Number.POSITIVE_INFINITY,
        reason: "aging",
      },
      animation: {
        className: "AppleIncorporealPillCanvasAnimation",
      },
      audio: {
        eat: {
          file: "./assets/audio/eat-incorporeal-pill.mp3",
        },
      },
    },
    [AppleEntity.TYPES.DEATH_PILL]: {
      effects: {
        incAcc: {
          value: -0.1,
          durationInTicks: 1,
        },
        setIsAlive: false,
      },
      lifespan: {
        durationInTicks: Number.POSITIVE_INFINITY,
        reason: "aging",
      },
      animation: {
        className: "AppleDeathPillCanvasAnimation",
      },
      audio: {
        eat: {
          file: "./assets/audio/eat-death-pill.mp3",
        },
      },
    },
    // grid effects
    [AppleEntity.TYPES.WARP_PILL]: {
      effects: {
        warp: {
          durationInTicks: Number.POSITIVE_INFINITY,
        },
      },
      lifespan: {
        durationInTicks: Number.POSITIVE_INFINITY,
        reason: "aging",
      },
      animation: {
        className: "AppleWarpPillCanvasAnimation",
      },
      audio: {
        eat: {
          file: "./assets/audio/eat-warp-pill.mp3",
        },
      },
    },
  };

  static build({ type, x, y }) {
    const blueprint = AppleEntity.BLUEPRINTS[type];

    if (!blueprint) {
      throw GameError.create(`Blueprint not found for apple type "${type}"!`, {
        meta: type,
      });
    }

    const positionComponent = new PositionComponent({ x, y });

    const featuresComponent = new AppleFeaturesComponent({
      type,
      isInactive: false,
    });

    const effectComponent = new AppleEffectComponent(blueprint.effects);

    const lifeSpanComponent = new LifespanComponent(blueprint.lifespan);

    const animationComponent = new AnimationComponent(blueprint.animation);

    const audioComponent = new AudioComponent(blueprint.audio);

    return [
      positionComponent,
      featuresComponent,
      effectComponent,
      lifeSpanComponent,
      animationComponent,
      audioComponent,
    ];
  }
}
