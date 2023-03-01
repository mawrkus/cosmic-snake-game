import { SnakeEntity } from "../entities/snake/SnakeEntity.js";
import { bindAll } from "../helpers/index.js";
import { GameStateMachine } from "../state-machine/GameStateMachine.js";
import { System } from "./System.js";

export class MetricsDisplaySystem extends System {
  constructor({ entityManager, stateMachine, metricsPanel, debugPanel }) {
    super();

    this.entityManager = entityManager;
    this.stateMachine = stateMachine;

    this.metricsPanel = metricsPanel;
    this.debugPanel = debugPanel;

    this.isDebugInfoVisible = null;

    bindAll(this, [
      "displayStartPoints",
      "displayScore",
      "showAsPaused",
      "showAsNormal",
      "showAsOver",
      "toggleDebugInfo",
    ]);
  }

  bootstrap() {
    const { EVENTS } = GameStateMachine;

    this.isDebugInfoVisible = false;

    this.stateMachine.on(EVENTS.GAME_START, this.displayStartPoints);
    this.stateMachine.on(EVENTS.PLAYER_SCORE, this.displayScore);
    this.stateMachine.on(EVENTS.GAME_PAUSED, this.showAsPaused);
    this.stateMachine.on(EVENTS.GAME_RESUME, this.showAsNormal);
    this.stateMachine.on(EVENTS.GAME_OVER, this.showAsOver);
    this.stateMachine.on(
      EVENTS.CONTROLLER_TOGGLE_DEBUG_PANEL,
      this.toggleDebugInfo
    );
  }

  shutdown() {
    this.stateMachine.off(
      EVENTS.CONTROLLER_TOGGLE_DEBUG_PANEL,
      this.toggleDebugInfo
    );
    this.stateMachine.off(EVENTS.GAME_OVER, this.showAsOver);
    this.stateMachine.off(EVENTS.GAME_RESUME, this.showAsNormal);
    this.stateMachine.off(EVENTS.GAME_PAUSED, this.showAsPaused);
    this.stateMachine.off(EVENTS.PLAYER_SCORE, this.displayScore);
    this.stateMachine.off(EVENTS.GAME_START, this.displayStartPoints);
  }

  display(time) {
    this.metricsPanel.displayTimer(time);

    if (this.isDebugInfoVisible) {
      this.displayDebugInfo();
    }
  }

  displayStartPoints() {
    const [[player]] = this.entityManager.getComponents(["Player"]);

    this.metricsPanel.cleanup();

    this.metricsPanel.displayPoints(player.getPoints());
  }

  displayScore(event) {
    const { points } = event.data;

    this.metricsPanel.increasePoints(points);
  }

  showAsPaused() {
    this.metricsPanel.showAsPaused();
  }

  showAsNormal() {
    this.metricsPanel.cleanup();
  }

  showAsOver() {
    this.metricsPanel.showAsOver();
  }

  toggleDebugInfo() {
    this.isDebugInfoVisible = this.metricsPanel.toggleDebugInfo();

    if (this.isDebugInfoVisible) {
      this.displayDebugInfo();
    }
  }

  displayDebugInfo() {
    const [snakePosition, snakeMovement] =
      this.entityManager.getSnakeHeadComponents(["Position", "Movement"]);

    const [strX, strY] = [
      String(snakePosition.getX()).padStart(2, "0"),
      String(snakePosition.getY()).padStart(2, "0"),
    ];

    const info = `position=[${strX},${strY}] | acc=${snakeMovement.getAcc()} | speed=${snakeMovement.getSpeed()}`;

    this.metricsPanel.displayDebugInfo(info);
  }
}
