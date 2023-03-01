import { BackgroundEntity } from "../entities/background/BackgroundEntity.js";
import { bindAll, oscillator } from "../helpers/index.js";
import { GameError } from "../errors/GameError.js";
import { GameStateMachine } from "../state-machine/GameStateMachine.js";
import { GridEntity } from "../entities/grid/GridEntity.js";
import { System } from "./System.js";

import { AppleDeathPillCanvasAnimation } from "../entities/apple/animations/AppleDeathPillCanvasAnimation.js";
import { AppleDeceleratePillCanvasAnimation } from "../entities/apple/animations/AppleDeceleratePillCanvasAnimation.js";
import { AppleFoodCanvasAnimation } from "../entities/apple/animations/AppleFoodCanvasAnimation.js";
import { AppleIncorporealPillCanvasAnimation } from "../entities/apple/animations/AppleIncorporealPillCanvasAnimation.js";
import { AppleShrinkPillCanvasAnimation } from "../entities/apple/animations/AppleShrinkPillCanvasAnimation.js";
import { AppleWarpPillCanvasAnimation } from "../entities/apple/animations/AppleWarpPillCanvasAnimation.js";
import { BackgroundCanvasAnimation } from "../entities/background/animations/BackgroundCssAnimation.js";
import { GridCanvasAnimation } from "../entities/grid/animations/GridCanvasAnimation.js";
import { SnakeBodyPartCanvasAnimation } from "../entities/snake/animations/SnakeBodyPartCanvasAnimation.js";
import { SnakeEntity } from "../entities/snake/SnakeEntity.js";
import { SnakeHeadCanvasAnimation } from "../entities/snake/animations/SnakeHeadCanvasAnimation.js";

export class AnimationSystem extends System {
  static ANIMATION_CLASSES = {
    // apples
    AppleFoodCanvasAnimation: AppleFoodCanvasAnimation,
    AppleShrinkPillCanvasAnimation: AppleShrinkPillCanvasAnimation,
    AppleDeceleratePillCanvasAnimation: AppleDeceleratePillCanvasAnimation,
    AppleIncorporealPillCanvasAnimation: AppleIncorporealPillCanvasAnimation,
    AppleDeathPillCanvasAnimation: AppleDeathPillCanvasAnimation,
    AppleWarpPillCanvasAnimation: AppleWarpPillCanvasAnimation,
    // background
    BackgroundCanvasAnimation: BackgroundCanvasAnimation,
    //grid
    GridCanvasAnimation: GridCanvasAnimation,
    // snake
    SnakeHeadCanvasAnimation: SnakeHeadCanvasAnimation,
    SnakeBodyPartCanvasAnimation: SnakeBodyPartCanvasAnimation,
  };

  constructor({ entityManager, stateMachine }) {
    super();

    this.entityManager = entityManager;
    this.stateMachine = stateMachine;

    this.canvasElement = document.querySelector(".grid");
    this.ctx = this.canvasElement.getContext("2d");

    this.animations = {};

    this.snakeIncorporealFx = {
      speed: 1,
      opacityOsc: oscillator(1, 0, 0.01),
      shadowBlurOsc: oscillator(2, 6, 0.04),
    };

    bindAll(this, [
      "start",
      "pause",
      "resume",
      "over",
      "createAnimation",
      "destroyAnimation",
    ]);
  }

  bootstrap() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.on(EVENTS.ENTITY_CREATED, this.createAnimation);
    this.stateMachine.on(EVENTS.ENTITY_REMOVED, this.destroyAnimation);
    this.stateMachine.on(EVENTS.GAME_START, this.start);
    this.stateMachine.on(EVENTS.GAME_PAUSED, this.pause);
    this.stateMachine.on(EVENTS.GAME_RESUME, this.resume);
    this.stateMachine.on(EVENTS.GAME_OVER, this.over);
  }

  shutdown() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.off(EVENTS.GAME_OVER, this.over);
    this.stateMachine.off(EVENTS.GAME_RESUME, this.resume);
    this.stateMachine.off(EVENTS.GAME_PAUSED, this.pause);
    this.stateMachine.off(EVENTS.GAME_START, this.start);
    this.stateMachine.off(EVENTS.ENTITY_REMOVED, this.destroyAnimation);
    this.stateMachine.off(EVENTS.ENTITY_CREATED, this.createAnimation);
  }

  createAnimation(event) {
    const { entityId } = event.data;

    if (!this.entityManager.hasEntityComponent(entityId, "Animation")) {
      return;
    }

    // console.log('[audio] 📽️ Creating animation for entity "%s"...', entityId);

    const entityAnimation = this.entityManager.getEntityComponent(
      entityId,
      "Animation"
    );

    const Clss =
      AnimationSystem.ANIMATION_CLASSES[entityAnimation.getClassName()];

    if (!Clss) {
      throw GameError.create(
        `Animation class "${entityAnimation.getClassName()}" does not exist!`,
        {
          meta: entityAnimation.get(),
        }
      );
    }

    this.animations[entityId] = new Clss(entityAnimation.getProps());
  }

  destroyAnimation(event) {
    if (this.animations[event.data.entityId]) {
      delete this.animations[event.data.entityId];
    }
  }

  start() {
    this.animations[BackgroundEntity.ID].draw({});
  }

  over(event) {
    this.pause();

    if (event.data?.cause) {
      this.animations[BackgroundEntity.ID].draw({
        features: { hasCollision: true }, // emulating a proper component is good enough
      });
    }
  }

  pause() {
    this.entityManager
      .getEntityComponent(GridEntity.ID, "GridFeatures")
      .setIsDisabled(true);
  }

  resume() {
    this.entityManager
      .getEntityComponent(GridEntity.ID, "GridFeatures")
      .setIsDisabled(false);
  }

  drawCanvasAnimation(entityId, components) {
    const canvas = {
      element: this.canvasElement,
      ctx: this.ctx,
    };

    this.ctx.save();

    this.animations[entityId].draw({ ...components, canvas });

    this.ctx.restore();
  }

  drawScene() {
    this.drawCanvasAnimation(GridEntity.ID, {
      features: this.entityManager
        .getEntityComponent(GridEntity.ID, "GridFeatures")
        .get(),
    });

    // snake
    const snakeComponents = this.entityManager.getComponents([
      "Position",
      "Shake",
      "Movement",
      "SnakeFeatures",
    ]);

    // we use a single one for all body parts so that new ones are drawn correctly when created
    const incorporeal = this.getSnakeIncorporealFx(
      snakeComponents[0][3].getIncorporealState()
    );

    for (let i = 0; i < snakeComponents.length; i += 1) {
      const [position, shake, movement, features] = snakeComponents[i];

      this.drawCanvasAnimation(position.getEntityId(), {
        position: position.get(),
        shake: shake.get(),
        movement: movement.get(),
        incorporeal,
        features: {
          ...features.get(),
          isTail: i == snakeComponents.length - 1, // :man_shrug:
        },
      });
    }

    // apples
    for (const [position, features] of this.entityManager.getComponents([
      "Position",
      "AppleFeatures",
    ])) {
      this.drawCanvasAnimation(position.getEntityId(), {
        position: position.get(),
        features: features.get(),
      });
    }
  }

  getSnakeIncorporealFx(incorporealState) {
    if (incorporealState === SnakeEntity.INCORPOREAL_STATE.IS_NOT) {
      return;
    }

    let shadowBlur;
    let globalAlpha;

    const speed =
      incorporealState === SnakeEntity.INCORPOREAL_STATE.IS_END_SOON ? 6 : 1;

    for (let i = 0; i < speed; i += 1) {
      shadowBlur = this.snakeIncorporealFx.shadowBlurOsc.next().value;
      globalAlpha = this.snakeIncorporealFx.opacityOsc.next().value;
    }

    return {
      shadowBlur,
      globalAlpha,
    };
  }
}
