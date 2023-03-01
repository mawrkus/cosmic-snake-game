import { bindAll } from "../helpers/index.js";
import { GameStateMachine } from "../state-machine/GameStateMachine.js";
import { GridEntity } from "../entities/grid/GridEntity.js";
import { System } from "./System.js";

export class MovementSystem extends System {
  constructor({ entityManager, stateMachine }) {
    super();

    this.entityManager = entityManager;
    this.stateMachine = stateMachine;

    bindAll(this, ["turn", "modifySpeed"]);
  }

  bootstrap() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.on(EVENTS.CONTROLLER_LEFT, this.turn);
    this.stateMachine.on(EVENTS.CONTROLLER_RIGHT, this.turn);
    this.stateMachine.on(EVENTS.CONTROLLER_SPEED_INC, this.modifySpeed);
    this.stateMachine.on(EVENTS.CONTROLLER_SPEED_DEC, this.modifySpeed);
  }

  shutdown() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.off(EVENTS.CONTROLLER_SPEED_DEC, this.modifySpeed);
    this.stateMachine.off(EVENTS.CONTROLLER_SPEED_INC, this.modifySpeed);
    this.stateMachine.off(EVENTS.CONTROLLER_RIGHT, this.turn);
    this.stateMachine.off(EVENTS.CONTROLLER_LEFT, this.turn);
  }

  turn(event) {
    const entityMovement = this.entityManager.getEntityComponent(
      event.data.entityId,
      "Movement"
    );

    if (event.name === GameStateMachine.EVENTS.CONTROLLER_LEFT) {
      entityMovement.turnLeft();
    } else if (event.name === GameStateMachine.EVENTS.CONTROLLER_RIGHT) {
      entityMovement.turnRight();
    }
  }

  modifySpeed(event) {
    const entityMovement = this.entityManager.getEntityComponent(
      event.data.entityId,
      "Movement"
    );

    if (event.name === GameStateMachine.EVENTS.CONTROLLER_SPEED_INC) {
      entityMovement.incSpeed(0.1);
    } else if (GameStateMachine.EVENTS.CONTROLLER_SPEED_DEC) {
      entityMovement.incSpeed(-0.1);
    }
  }

  update() {
    const changeDirOps = [];

    const [snakeHeadPosition, snakeHeadMovement] =
      this.entityManager.getSnakeHeadComponents(["Position", "Movement"]);

    const isGridTick = this.isGridTick(snakeHeadPosition);

    const { speed, acc } = snakeHeadMovement.get();

    const newSpeed = Number((speed + acc).toFixed(3));

    snakeHeadMovement.setSpeed(newSpeed);

    const components = this.entityManager.getComponents([
      "Position",
      "Movement",
    ]);

    for (let i = 0; i < components.length; i += 1) {
      const [position, movement] = components[i];

      if (movement.getIsFrozen()) {
        continue;
      }

      const [dirIncX, dirIncY] = movement.getDirIncs();

      if (!isGridTick) {
        position.incPixelsXY(dirIncX * newSpeed, dirIncY * newSpeed);
        continue;
      }

      const { x, y } = position.incXY(
        dirIncX * Math.sign(newSpeed),
        dirIncY * Math.sign(newSpeed)
      );

      position.setPixelsXY(
        GridEntity.toPixels(x),
        GridEntity.toPixels(y),
        true
      );

      const nextDir = movement.getNextDir();

      if (nextDir !== null) {
        movement.setDir(nextDir);
        movement.setNextDir(null);

        const nextEntityComponents = components[i + 1];

        if (nextEntityComponents) {
          changeDirOps.push(() => nextEntityComponents[1].setNextDir(nextDir));
        }
      }
    }

    for (const changeDir of changeDirOps) {
      changeDir();
    }

    if (isGridTick) {
      this.stateMachine.sendEvent(GameStateMachine.EVENTS.GRID_TICK);
    }
  }

  isGridTick(snakeHeadPosition) {
    const { diffX, diffY } = snakeHeadPosition.getLastDiffPixelsXY();

    return (
      Math.abs(diffX) >= GridEntity.UNIT_IN_PIXELS ||
      Math.abs(diffY) >= GridEntity.UNIT_IN_PIXELS
    );
  }
}
