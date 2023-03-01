import { AnimationComponent } from "../../components/AnimationComponent.js";
import { SnakeFeaturesComponent } from "../../components/SnakeFeaturesComponent.js";
import { GridEntity } from "../grid/GridEntity.js";
import { MovementComponent } from "../../components/MovementComponent.js";
import { MovementTimedEffectComponent } from "../../components/MovementTimedEffectComponent.js";
import { PlayerComponent } from "../../components/PlayerComponent.js";
import { PositionComponent } from "../../components/PositionComponent.js";
import { ShakeComponent } from "../../components/ShakeComponent.js";
import { AudioComponent } from "../../components/AudioComponent.js";
import { enumeration } from "../../helpers/index.js";

export class SnakeEntity {
  static ID = "SNAKE";

  // https://palettes.shecodes.io/palettes/53
  static HEAD_ANIMATION_PROPS = {
    aliveProps: {
      color: "#ef5a5a",
      size: GridEntity.UNIT_IN_PIXELS,
    },
    deadProps: {
      color: "#666",
      size: GridEntity.UNIT_IN_PIXELS,
    },
  };

  // https://palettes.shecodes.io/palettes/53
  static TAIL_ANIMATION_PROPS = {
    aliveProps: {
      color: "#feffdf",
      size: GridEntity.UNIT_IN_PIXELS * 0.45,
    },
    deadProps: {
      color: "#f0f0f0",
      size: GridEntity.UNIT_IN_PIXELS * 0.45,
    },
  };

  // https://palettes.shecodes.io/palettes/53
  static *bodyPartPropsAlive() {
    while (true) {
      yield { color: "#ffa952", size: GridEntity.UNIT_IN_PIXELS * 0.8 };
      yield { color: "#ffe79a", size: GridEntity.UNIT_IN_PIXELS * 0.6 };
    }
  }

  // https://palettes.shecodes.io/palettes/53
  static *bodyPartPropsDead() {
    while (true) {
      yield { color: "#b9b9b9", size: GridEntity.UNIT_IN_PIXELS * 0.8 };
      yield { color: "#e5e5e5", size: GridEntity.UNIT_IN_PIXELS * 0.6 };
    }
  }

  static INCORPOREAL_STATE = enumeration(["IS", "IS_END_SOON", "IS_NOT"]);

  static buildHeadComponent({
    position,
    movement,
    movementTimedEffect,
    animation,
    player,
    features,
  }) {
    const positionComponent = new PositionComponent(position);

    // TODO: we only add it for the animation system to be able to select & draw all snake parts at once
    const shakeComponent = new ShakeComponent({ amplitude: 0 });

    const movementComponent = new MovementComponent({
      ...movement,
      nextDir: null,
      isFrozen: false,
    });

    const movementTimedEffectComponent = new MovementTimedEffectComponent(
      movementTimedEffect
    );

    const animationComponent = new AnimationComponent(animation);

    const audioComponent = new AudioComponent({
      accelerateStress: {
        file: "./assets/audio/snake-accelerate-stress.mp3",
      },
    });

    const playerComponent = new PlayerComponent(player);

    const featuresComponent = new SnakeFeaturesComponent({
      ...features,
      isTail: false,
      isAlive: true,
      incorporealState: SnakeEntity.INCORPOREAL_STATE.IS_NOT,
    });

    return [
      positionComponent,
      shakeComponent,
      movementComponent,
      movementTimedEffectComponent,
      animationComponent,
      audioComponent,
      playerComponent,
      featuresComponent,
    ];
  }

  static buildBodyPartComponents({
    position,
    movement,
    movementTimedEffect,
    animation,
    features,
  }) {
    const positionComponent = new PositionComponent(position);

    const shakeComponent = new ShakeComponent({ amplitude: 0 });

    const movementComponent = new MovementComponent({
      ...movement,
      nextDir: null,
      isFrozen: true,
    });

    const movementTimedEffectComponent = new MovementTimedEffectComponent(
      movementTimedEffect
    );

    const animationComponent = new AnimationComponent(animation);

    const featuresComponent = new SnakeFeaturesComponent({
      ...features,
      isAlive: true,
    });

    return [
      positionComponent,
      shakeComponent,
      movementComponent,
      movementTimedEffectComponent,
      animationComponent,
      featuresComponent,
    ];
  }
}
