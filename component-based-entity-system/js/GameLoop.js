import { AnimationSystem } from "./systems/AnimationSystem.js";
import { AudioSystem } from "./systems/AudioSystem.js";
import { bindAll } from "./helpers/index.js";
import { CollisionSystem } from "./systems/CollisionSystem.js";
import { EntitySpawnerSystem } from "./systems/EntitySpawnerSystem.js";
import { GameEntityManager } from "./entities/GameEntityManager.js";
import { GamePlaySystem } from "./systems/GamePlaySystem.js";
import { GameStateMachine } from "./state-machine/GameStateMachine.js";
import { MessageBox } from "./ui/MessageBox.js";
import { MetricsPanel } from "./ui/MetricsPanel.js";
import { MovementSystem } from "./systems/MovementSystem.js";
import { MetricsDisplaySystem } from "./systems/MetricsDisplaySystem.js";
import { PlayerSystem } from "./systems/PlayerSystem.js";
import { TimedEffectSystem } from "./systems/TimedEffectSystem.js";

export class GameLoop {
  constructor() {
    this.stateMachine = new GameStateMachine();

    this.entityManager = new GameEntityManager({
      stateMachine: this.stateMachine,
    });

    this.messageBox = new MessageBox();

    this.requestAnimationFrameId = null;

    this.timedEffectSystem = new TimedEffectSystem({
      entityManager: this.entityManager,
      stateMachine: this.stateMachine,
    });

    this.gamePlaySystem = new GamePlaySystem({
      entityManager: this.entityManager,
      stateMachine: this.stateMachine,
    });

    this.audioSystem = new AudioSystem({
      entityManager: this.entityManager,
      stateMachine: this.stateMachine,
    });

    this.movementSystem = new MovementSystem({
      entityManager: this.entityManager,
      stateMachine: this.stateMachine,
    });

    this.animationSystem = new AnimationSystem({
      entityManager: this.entityManager,
      stateMachine: this.stateMachine,
    });

    this.collisionSystem = new CollisionSystem({
      entityManager: this.entityManager,
      stateMachine: this.stateMachine,
    });

    this.metricsDisplaySystem = new MetricsDisplaySystem({
      entityManager: this.entityManager,
      stateMachine: this.stateMachine,
      metricsPanel: new MetricsPanel(),
    });

    this.playerSystem = new PlayerSystem({
      entityManager: this.entityManager,
      stateMachine: this.stateMachine,
    });

    this.entitySpawnerSystem = new EntitySpawnerSystem({
      entityManager: this.entityManager,
      stateMachine: this.stateMachine,
    });

    this.startTime = 0;
    this.timeElapsed = 0;
    this.lastStop = 0;
    this.pauseTime = 0;
    this.lastTimeCheck = 0;

    this.keepLooping = null;

    bindAll(this, ["start", "loop", "pause", "resume", "over"]);
  }

  bootstrap() {
    // The order IS important
    this.playerSystem.bootstrap();

    this.entitySpawnerSystem.bootstrap();
    this.gamePlaySystem.bootstrap(); // creates & spawn entities

    this.timedEffectSystem.bootstrap();
    this.movementSystem.bootstrap(); // emits GRID_TICK
    this.collisionSystem.bootstrap();

    this.animationSystem.bootstrap();
    this.metricsDisplaySystem.bootstrap();
    this.audioSystem.bootstrap();
    // The order IS important

    const { EVENTS } = GameStateMachine;

    this.stateMachine.on(EVENTS.GAME_START, this.start);
    this.stateMachine.on(EVENTS.GAME_PAUSED, this.pause);
    this.stateMachine.on(EVENTS.GAME_RESUME, this.resume);
    this.stateMachine.on(EVENTS.GAME_OVER, this.over);

    this.stateMachine.sendEvent(EVENTS.GAME_BOOTSTRAPPED);
  }

  shutdown() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.off(EVENTS.GAME_OVER, this.over);
    this.stateMachine.off(EVENTS.GAME_RESUME, this.resume);
    this.stateMachine.off(EVENTS.GAME_PAUSED, this.pause);
    this.stateMachine.off(EVENTS.GAME_START, this.start);

    this.audioSystem.shutdown();
    this.metricsDisplaySystem.shutdown();
    this.animationSystem.shutdown();

    this.collisionSystem.shutdown();
    this.movementSystem.shutdown();
    this.timedEffectSystem.shutdown();

    this.gamePlaySystem.shutdown();
    this.entitySpawnerSystem.shutdown();
    this.playerSystem.shutdown();
  }

  start() {
    this.messageBox.clear();

    this.keepLooping = true;

    this.startTime = performance.now();
    this.lastTimeCheck = 0;
    this.pauseTime = 0;

    this.loop();
  }

  loop() {
    this.timeElapsed = performance.now() - this.startTime - this.pauseTime;

    if (this.timeElapsed - this.lastTimeCheck >= 1000) {
      this.stateMachine.sendEvent(GameStateMachine.EVENTS.TIMER_SECOND);

      this.lastTimeCheck = this.timeElapsed;
    }

    this.movementSystem.update();
    this.animationSystem.drawScene();
    this.metricsDisplaySystem.display(this.timeElapsed);

    if (this.keepLooping) {
      this.requestAnimationFrameId = requestAnimationFrame(this.loop);
    } else {
      this.lastStop = performance.now();
    }
  }

  pause(event) {
    this.keepLooping = false;

    if (event.data?.promptQuit) {
      this.messageBox.display({
        text: "Quit?",
        subText: "Press Enter to confirm",
      });

      return;
    }

    this.messageBox.display({ text: "Game Paused" });
  }

  resume() {
    this.messageBox.clear();

    this.keepLooping = true;
    this.pauseTime += performance.now() - this.lastStop;

    this.loop();
  }

  over(event) {
    this.keepLooping = false;

    if (event.data?.cause) {
      this.messageBox.display({
        text: "Oh no! Game Over.",
        subText: "Press Enter to play again",
        subTextDelay: true,
      });

      return;
    }

    this.messageBox.display({
      text: "Game Ended",
      subText: "Press Enter to play again",
    });
  }
}
