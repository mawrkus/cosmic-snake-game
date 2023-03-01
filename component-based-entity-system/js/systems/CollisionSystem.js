import { bindAll } from "../helpers/index.js";
import { GameStateMachine } from "../state-machine/GameStateMachine.js";
import { GridEntity } from "../entities/grid/GridEntity.js";
import { SnakeEntity } from "../entities/snake/SnakeEntity.js";
import { System } from "./System.js";

export class CollisionSystem extends System {
  constructor({ entityManager, stateMachine }) {
    super();

    this.entityManager = entityManager;
    this.stateMachine = stateMachine;

    bindAll(this, ["check"]);
  }

  bootstrap() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.on(EVENTS.GRID_TICK, this.check);
  }

  shutdown() {
    this.stateMachine.off(EVENTS.GRID_TICK, this.check);
  }

  // TODO: define pipeline
  //  ->  when incorporeal, remove the snake body collision check
  //  ->  when warp, remove the grid collision check
  check() {
    const [snakePosition, snakeMovement, snakeFeatures] =
      this.entityManager.getSnakeHeadComponents([
        "Position",
        "Movement",
        "SnakeFeatures",
      ]);

    const snakeX = snakePosition.getX();
    const snakeY = snakePosition.getY();

    for (const [p] of this.entityManager.getComponents(["Position"])) {
      const targetEntityId = p.getEntityId();

      if (targetEntityId === SnakeEntity.ID) {
        continue;
      }

      if (snakeX !== p.getX() || snakeY !== p.getY()) {
        continue;
      }

      // console.log('[collision] 💥 entity "%s"', targetEntityId);

      const entityComponents = this.entityManager
        .getEntity(targetEntityId)
        .get("components");

      if (entityComponents.has("AppleFeatures")) {
        const willEatApple =
          snakeFeatures.getIncorporealState() ===
            SnakeEntity.INCORPOREAL_STATE.IS_NOT ||
          entityComponents.get("AppleEffect").get().setIsAlive !== false;

        if (willEatApple) {
          this.stateMachine.sendEvent(GameStateMachine.EVENTS.SNAKE_EAT, {
            appleId: targetEntityId,
            x: snakeX,
            y: snakeY,
          });
        }

        break; // after eating, check collision against walls
      }

      if (entityComponents.has("SnakeFeatures")) {
        if (
          snakeFeatures.getIncorporealState() !==
          SnakeEntity.INCORPOREAL_STATE.IS_NOT
        ) {
          return;
        }

        this.killSnake({ targetEntityId, snakeX, snakeY });

        return;
      }
    }

    this.checkGrid({
      snakeX,
      snakeY,
      snakeMovement,
    });
  }

  checkGrid({ snakeX, snakeY, snakeMovement }) {
    const targetEntityId = GridEntity.ID;

    const gridFeatures = this.entityManager.getEntityComponent(
      targetEntityId,
      "GridFeatures"
    );

    if (gridFeatures.getHasWarp()) {
      this.applyGridWarp({ gridFeatures });
      return;
    }

    const snakeDirName = snakeMovement.getDirName();

    if (snakeX === 0 && snakeDirName === "left") {
      this.killSnake({ targetEntityId, snakeX, snakeY, snakeMovement });
      return;
    }

    if (snakeY === 0 && snakeDirName === "up") {
      this.killSnake({ targetEntityId, snakeX, snakeY, snakeMovement });
      return;
    }

    if (snakeX === gridFeatures.getWidth() - 1 && snakeDirName === "right") {
      this.killSnake({ targetEntityId, snakeX, snakeY, snakeMovement });
      return;
    }

    if (snakeY === gridFeatures.getHeight() - 1 && snakeDirName === "down") {
      this.killSnake({ targetEntityId, snakeX, snakeY, snakeMovement });
      return;
    }
  }

  applyGridWarp({ gridFeatures }) {
    for (const [position] of this.entityManager.getSnakeEntitiesComponents([
      "Position",
    ])) {
      if (position.getX() < 0) {
        position.setXY(
          gridFeatures.getWidth() + position.getX(),
          position.getY()
        );
      } else if (position.getX() >= gridFeatures.getWidth()) {
        position.setXY(
          position.getX() - gridFeatures.getWidth(),
          position.getY()
        );
      }

      if (position.getY() < 0) {
        position.setXY(
          position.getX(),
          gridFeatures.getHeight() + position.getY()
        );
      } else if (position.getY() >= gridFeatures.getHeight()) {
        position.setXY(
          position.getX(),
          position.getY() - gridFeatures.getHeight()
        );
      }
    }
  }

  killSnake({ targetEntityId, snakeX, snakeY, snakeMovement }) {
    for (const [
      snakeMovement,
      snakeFeatures,
    ] of this.entityManager.getSnakeEntitiesComponents([
      "Movement",
      "SnakeFeatures",
    ])) {
      snakeMovement.setIsFrozen(true);
      snakeFeatures.setIsAlive(false);
    }

    if (targetEntityId === GridEntity.ID) {
      this.entityManager
        .getEntityComponent(GridEntity.ID, "GridFeatures")
        .setCollision({
          dirName: snakeMovement.getDirName(),
          speed: snakeMovement.getSpeed(),
        });
    }

    this.stateMachine.sendEvent(GameStateMachine.EVENTS.SNAKE_DEATH, {
      cause: {
        collision: {
          targetEntityId,
          x: snakeX,
          y: snakeY,
        },
      },
    });
  }
}
