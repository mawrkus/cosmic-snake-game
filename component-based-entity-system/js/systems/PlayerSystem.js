import { bindAll } from "../helpers/index.js";
import { GameError } from "../errors/GameError.js";
import { GameStateMachine } from "../state-machine/GameStateMachine.js";
import { KeyboardController } from "../controllers/KeyboardController.js";
import { PlayerComponent } from "../components/PlayerComponent.js";
import { System } from "./System.js";

export class PlayerSystem extends System {
  constructor({ entityManager, stateMachine }) {
    super();

    this.entityManager = entityManager;
    this.stateMachine = stateMachine;

    this.controllers = {};

    bindAll(this, ["createController", "destroyController"]);
  }

  bootstrap() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.on(EVENTS.ENTITY_CREATED, this.createController);
    this.stateMachine.on(EVENTS.ENTITY_REMOVED, this.destroyController);
  }

  shutdown() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.off(EVENTS.ENTITY_REMOVED, this.destroyController);
    this.stateMachine.off(EVENTS.ENTITY_CREATED, this.createController);
  }

  createController(event) {
    const { entityId } = event.data;

    if (!this.entityManager.hasEntityComponent(entityId, "Player")) {
      return;
    }

    const player = this.entityManager.getEntityComponent(entityId, "Player");

    if (this.controllers[entityId]) {
      throw GameError.create(
        `Different players cannot control the same entity "${entityId}!"`,
        {
          meta: player,
        }
      );
    }

    if (
      player.getControllerType() !== PlayerComponent.CONTROLLER_TYPES.KEYBOARD
    ) {
      throw GameError.create(
        `Unsupported controller type "${player.getControllerType()}!"`,
        {
          meta: player,
        }
      );
    }

    this.controllers[entityId] = new KeyboardController({
      id: `CONTROLLER_${player.getControllerType()}_${entityId}`,
      stateMachine: this.stateMachine,
      keys: {
        ArrowLeft: {
          name: GameStateMachine.EVENTS.CONTROLLER_LEFT,
          data: {
            entityId: entityId,
          },
        },
        ArrowRight: {
          name: GameStateMachine.EVENTS.CONTROLLER_RIGHT,
          data: {
            entityId: entityId,
          },
        },
        Space: GameStateMachine.EVENTS.CONTROLLER_PLAY_PAUSE,
        Enter: GameStateMachine.EVENTS.CONTROLLER_CONFIRM,
        Escape: GameStateMachine.EVENTS.CONTROLLER_ESC,
        KeyM: GameStateMachine.EVENTS.CONTROLLER_TOGGLE_MUSIC,
        BracketRight: {
          name: GameStateMachine.EVENTS.CONTROLLER_SPEED_INC,
          data: {
            entityId: entityId,
          },
        },
        BracketLeft: {
          name: GameStateMachine.EVENTS.CONTROLLER_SPEED_DEC,
          data: {
            entityId: entityId,
          },
        },
        KeyD: GameStateMachine.EVENTS.CONTROLLER_TOGGLE_DEBUG_PANEL,
        // KeyC: GameStateMachine.EVENTS.INPUT_KEY_TOGGLE_CONTROL_PANEL,
      },
    });

    this.controllers[entityId].addEventListeners();
  }

  destroyController(event) {
    const { entityId } = event.data;

    if (this.controllers[entityId]) {
      this.controllers[entityId].removeEventListeners();

      delete this.controllers[entityId];
    }
  }
}
