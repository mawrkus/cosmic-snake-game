import { bindAll, enumeration } from "../helpers/index.js";
import { StateMachine } from "./StateMachine.js";

export class GameStateMachine extends StateMachine {
  static STATES = enumeration([
    "IDLE",
    "START",
    "RUNNING",
    "PAUSE_TRANSIENT",
    "PAUSE",
    "PROMPT_QUIT_TRANSIENT",
    "PROMPT_QUIT",
    "RESUME",
    "OVER_TRANSIENT",
    "OVER",
  ]);

  static EVENTS = enumeration([
    // controller
    "CONTROLLER_LEFT",
    "CONTROLLER_RIGHT",
    "CONTROLLER_PLAY_PAUSE",
    "CONTROLLER_CONFIRM",
    "CONTROLLER_ESC",
    "CONTROLLER_TOGGLE_MUSIC",
    "CONTROLLER_SPEED_INC",
    "CONTROLLER_SPEED_DEC",
    "CONTROLLER_TOGGLE_DEBUG_PANEL",
    // game
    "GAME_BOOTSTRAPPED",
    "GAME_START",
    "GAME_PAUSED",
    "GAME_RESUME",
    "GAME_OVER",
    // entities
    "ENTITY_CREATE",
    "ENTITY_CREATED",
    "ENTITY_REMOVED",
    // snake
    "SNAKE_EAT",
    "SNAKE_ACCELERATE_STRESS",
    "SNAKE_DEATH",
    // player
    "PLAYER_SCORE",
    // grid
    "GRID_TICK",
    // timer
    "TIMER_SECOND",
  ]);

  constructor() {
    const { STATES, EVENTS } = GameStateMachine;

    super({
      initialStateId: STATES.IDLE,
      context: {
        eventStore: [],
      },
      states: {
        [STATES.IDLE]: {
          events: {
            [EVENTS.GAME_BOOTSTRAPPED]: {
              targetId: STATES.START,
            },
          },
        },
        [STATES.START]: {
          onEntry(event, ctx) {
            ctx.eventStore = [];

            // notify that the game is about to start running
            this.sendEvent(EVENTS.GAME_START);
          },
          events: {
            [EVENTS.GAME_START]: {
              targetId: STATES.RUNNING,
            },
            // entities
            [EVENTS.ENTITY_CREATE]: {
              targetId: STATES.RUNNING,
            },
            [EVENTS.ENTITY_CREATED]: {
              targetId: STATES.RUNNING,
            },
            [EVENTS.ENTITY_REMOVED]: {
              targetId: STATES.RUNNING,
            },
          },
        },
        [STATES.RUNNING]: {
          events: {
            // entities
            [EVENTS.ENTITY_CREATE]: {
              targetId: STATES.RUNNING,
            },
            [EVENTS.ENTITY_CREATED]: {
              targetId: STATES.RUNNING,
            },
            [EVENTS.ENTITY_REMOVED]: {
              targetId: STATES.RUNNING,
            },
            // snake
            [EVENTS.SNAKE_EAT]: {
              targetId: STATES.RUNNING,
            },
            [EVENTS.SNAKE_ACCELERATE_STRESS]: {
              targetId: STATES.RUNNING,
            },
            [EVENTS.SNAKE_DEATH]: {
              targetId: STATES.OVER_TRANSIENT,
            },
            [EVENTS.CONTROLLER_LEFT]: {
              targetId: STATES.RUNNING,
            },
            [EVENTS.CONTROLLER_RIGHT]: {
              targetId: STATES.RUNNING,
            },
            [EVENTS.CONTROLLER_SPEED_INC]: {
              targetId: STATES.RUNNING,
            },
            [EVENTS.CONTROLLER_SPEED_DEC]: {
              targetId: STATES.RUNNING,
            },
            [EVENTS.CONTROLLER_TOGGLE_DEBUG_PANEL]: {
              targetId: STATES.RUNNING,
            },
            // player
            [EVENTS.PLAYER_SCORE]: {
              targetId: STATES.RUNNING,
            },
            // grid
            [EVENTS.GRID_TICK]: {
              targetId: STATES.RUNNING,
            },
            // timer
            [EVENTS.TIMER_SECOND]: {
              targetId: STATES.RUNNING,
            },
            // game flow
            [EVENTS.CONTROLLER_PLAY_PAUSE]: {
              targetId: STATES.PAUSE_TRANSIENT,
            },
            [EVENTS.CONTROLLER_ESC]: {
              targetId: STATES.PROMPT_QUIT_TRANSIENT,
            },
            // extras
            [EVENTS.CONTROLLER_TOGGLE_MUSIC]: {
              targetId: STATES.RUNNING,
            },
          },
        },
        [STATES.PAUSE_TRANSIENT]: {
          onEntry() {
            // notify that the game was running & has been paused
            this.sendEvent(EVENTS.GAME_PAUSED);
          },
          events: {
            [EVENTS.GAME_PAUSED]: {
              targetId: STATES.PAUSE,
            },
          },
        },
        [STATES.PAUSE]: {
          events: {
            [EVENTS.CONTROLLER_PLAY_PAUSE]: {
              targetId: STATES.RESUME,
            },
            [EVENTS.CONTROLLER_ESC]: {
              targetId: STATES.PROMPT_QUIT_TRANSIENT,
            },
            [EVENTS.CONTROLLER_TOGGLE_MUSIC]: {
              targetId: STATES.PAUSE,
            },
            [EVENTS.CONTROLLER_TOGGLE_DEBUG_PANEL]: {
              targetId: STATES.PAUSE,
            },
          },
        },
        [STATES.PROMPT_QUIT_TRANSIENT]: {
          onEntry(event, ctx) {
            // to know if we return to STATES.PAUSE when EVENTS.CONTROLLER_ESC
            ctx.wasPaused = event.stateId === STATES.PAUSE;

            // notify that the game was running & has been paused
            this.sendEvent(EVENTS.GAME_PAUSED, { promptQuit: true });
          },
          events: {
            [EVENTS.GAME_PAUSED]: {
              targetId: STATES.PROMPT_QUIT,
            },
          },
        },
        [STATES.PROMPT_QUIT]: {
          events: {
            [EVENTS.CONTROLLER_ESC]: [
              {
                cond: (event, ctx) => ctx.wasPaused,
                targetId: STATES.PAUSE_TRANSIENT,
                onExit(event, ctx) {
                  delete ctx.wasPaused;
                },
              },
              {
                cond: (event, ctx) => !ctx.wasPaused,
                targetId: STATES.RESUME,
                onExit(event, ctx) {
                  delete ctx.wasPaused;
                },
              },
            ],
            [EVENTS.CONTROLLER_CONFIRM]: {
              targetId: STATES.OVER_TRANSIENT,
            },
            [EVENTS.CONTROLLER_TOGGLE_MUSIC]: {
              targetId: STATES.PROMPT_QUIT,
            },
          },
        },
        [STATES.RESUME]: {
          onEntry() {
            // notify that the game is about to resume
            this.sendEvent(EVENTS.GAME_RESUME);
          },
          events: {
            [EVENTS.GAME_RESUME]: {
              targetId: STATES.RUNNING,
            },
          },
        },
        [STATES.OVER_TRANSIENT]: {
          onEntry(event) {
            // notify that the game is over
            this.sendEvent(EVENTS.GAME_OVER, event.data); // pass any SNAKE_DEATH data
          },
          events: {
            [EVENTS.GAME_OVER]: {
              targetId: STATES.OVER,
            },
          },
        },
        [STATES.OVER]: {
          events: {
            [EVENTS.CONTROLLER_CONFIRM]: {
              targetId: STATES.START,
            },
          },
        },
      },
    });

    bindAll(this, ["storeEvent"]);

    this.on(StateMachine.EVENT_NAME_TRANSITION, this.storeEvent);
  }

  storeEvent(transitionEvent, { eventStore }) {
    // console.log("[game-state-machine]", JSON.stringify(transitionEvent));
    const { event } = transitionEvent.data;

    if (
      [
        GameStateMachine.EVENTS.GRID_TICK,
        GameStateMachine.EVENTS.TIMER_SECOND,
      ].includes(event.name) ||
      event.prevStateId === null
    ) {
      return;
    }

    eventStore.push(event);

    if (
      [
        GameStateMachine.EVENTS.GAME_PAUSED,
        GameStateMachine.EVENTS.GAME_OVER,
      ].includes(event.name)
    ) {
      console.info(
        "🕹️ game events =",
        eventStore.sort((a, b) => a.timestamp - b.timestamp)
      );
    }
  }
}
