import { AppleEntity } from "./apple/AppleEntity.js";
import { BackgroundEntity } from "./background/BackgroundEntity.js";
import { EntityManager } from "./EntityManager.js";
import { enumeration } from "../helpers/index.js";
import { GridEntity } from "./grid/GridEntity.js";
import { PlayerComponent } from "../components/PlayerComponent.js";
import { SnakeEntity } from "./snake/SnakeEntity.js";

export class GameEntityManager extends EntityManager {
  static CATEGORIES = enumeration(["GAME", "GRID", "SNAKE", "APPLE"]);

  static appleId = 0;

  constructor({ stateMachine }) {
    super({ stateMachine });

    this.aliveSnakeProps = SnakeEntity.bodyPartPropsAlive();
    this.deadSnakeProps = SnakeEntity.bodyPartPropsDead();
  }

  createBackgroundEntity() {
    return this.createEntity(BackgroundEntity.ID, BackgroundEntity.build({}));
  }

  createGridEntity({ width, height }) {
    return this.createEntity(
      GridEntity.ID,
      GridEntity.build({ width, height })
    );
  }

  createSnakeEntity({
    points,
    x,
    y,
    dir,
    size,
    speed,
    acc = 0,
    movementTimedEffect,
  }) {
    const headComponents = SnakeEntity.buildHeadComponent({
      position: { x, y },
      movement: { dir, speed, acc },
      movementTimedEffect,
      animation: {
        className: "SnakeHeadCanvasAnimation",
        props: SnakeEntity.HEAD_ANIMATION_PROPS,
      },
      player: {
        controllerType: PlayerComponent.CONTROLLER_TYPES.KEYBOARD,
        points,
      },
    });

    const snakeHeadEntityId = this.createEntity(SnakeEntity.ID, headComponents);

    for (let i = 0; i < size - 1; i += 1) {
      this.createSnakeBodyPartEntity({
        x,
        y,
        dir,
        id: `${SnakeEntity.ID}_BODY${i}`,
        durationInTicks: i + 1,
      });
    }

    return snakeHeadEntityId;
  }

  createSnakeBodyPartEntity({ id, x, y, dir, durationInTicks }) {
    const bodyPartComponents = SnakeEntity.buildBodyPartComponents({
      position: { x, y },
      movement: { dir, speed: null, acc: null }, // use snake head's
      movementTimedEffect: {
        durationInTicks,
        startValues: {},
        endValues: {
          setIsFrozen: false,
        },
      },
      animation: {
        className: "SnakeBodyPartCanvasAnimation",
        props: {
          aliveProps: this.aliveSnakeProps.next().value,
          deadProps: this.deadSnakeProps.next().value,
        },
      },
    });

    this.createEntity(id, bodyPartComponents);
  }

  incSnakeSize(incSize) {
    const [position, movement] = this.getSnakeHeadComponents([
      "Position",
      "Movement",
    ]);

    const { x, y } = position.get();
    const dir = movement.getDir();
    const size = this.getSnakeEntities().length;

    // TODO: inherit incorporeal -> move it to head only?
    for (let i = 0; i < incSize; i += 1) {
      this.createSnakeBodyPartEntity({
        x,
        y,
        dir,
        id: `${SnakeEntity.ID}_BODY${size - 1 + i}`,
        durationInTicks: size + i,
      });
    }
  }

  decSnakeSize(decSize) {
    const size = this.getSnakeEntities().length;

    for (let i = 0; i < decSize; i += 1) {
      const id = `${SnakeEntity.ID}_BODY${size - 2 - i}`;

      // TODO: Lifespan
      this.removeEntity(id);
    }
  }

  getSnakeHeadComponents(componentNames) {
    return this.getEntityComponents(SnakeEntity.ID, componentNames);
  }

  getSnakeHeadComponent(componentName) {
    return this.getEntityComponent(SnakeEntity.ID, componentName);
  }

  getSnakeEntities() {
    return this.filterEntities((entityData) =>
      entityData.get("components").has("SnakeFeatures")
    );
  }

  getSnakeEntitiesComponents(componentNames = []) {
    const fullBodyComponents = [];

    for (const [, entityData] of this.entities) {
      const entityComponents = entityData.get("components");

      if (!entityComponents.has("SnakeFeatures")) {
        continue;
      }

      const bodyPartComponents = [];

      for (const componentName of componentNames) {
        if (!this.componentsBitLookup.has(componentName)) {
          throw GameError.create(`Unknown component "${componentName}"!`, {
            meta: this.componentsBitLookup,
          });
        }

        bodyPartComponents.push(entityComponents.get(componentName));
      }

      fullBodyComponents.push(bodyPartComponents);
    }

    return fullBodyComponents;
  }

  createAppleEntity({ type, x, y }) {
    return this.createEntity(
      `${AppleEntity.ID_PREFIX}${GameEntityManager.appleId++}`,
      AppleEntity.build({ type, x, y })
    );
  }
}
