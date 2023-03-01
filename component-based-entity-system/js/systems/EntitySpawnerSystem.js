import { bindAll } from "../helpers/index.js";
import { GameStateMachine } from "../state-machine/GameStateMachine.js";
import { GameEntityManager } from "../entities/GameEntityManager.js";
import { GridEntity } from "../entities/grid/GridEntity.js";
import { System } from "./System.js";

export class EntitySpawnerSystem extends System {
  constructor({ entityManager, stateMachine }) {
    super();

    this.entityManager = entityManager;
    this.stateMachine = stateMachine;

    bindAll(this, ["spawnEntity"]);
  }

  bootstrap() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.on(EVENTS.ENTITY_CREATE, this.spawnEntity);
  }

  shutdown() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.off(EVENTS.ENTITY_CREATE, this.spawnEntity);
  }

  spawnEntity({ data }) {
    if (data.category !== GameEntityManager.CATEGORIES.APPLE) {
      return; // maybe one day?
    }

    // console.log(
    //   '[entity-spawner] ✨ Creating "%s" of type "%s"...',
    //   data.category,
    //   data.type
    // );

    const { x, y } = this.computeRandomApplePos();

    this.entityManager.createAppleEntity({ type: data.type, x, y });
  }

  computeRandomApplePos() {
    const { width, height } = this.entityManager
      .getEntityComponent(GridEntity.ID, "GridFeatures")
      .get();

    const positions = this.entityManager.getComponents(["Position"]);

    do {
      let x = Math.floor(Math.random() * width);
      let y = Math.floor(Math.random() * height);

      // well...
      if (positions.every(([p]) => x !== p.getX() || y !== p.getY())) {
        return { x, y };
      }
    } while (true);
  }
}
