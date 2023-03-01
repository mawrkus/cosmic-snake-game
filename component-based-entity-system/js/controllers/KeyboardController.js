import { bindAll } from "../helpers/index.js";

export class KeyboardController {
  constructor({ id, keys, stateMachine }) {
    this.id = id;
    this.keys = keys;
    this.stateMachine = stateMachine;

    bindAll(this, ["onKeyDown"]);
  }

  addEventListeners() {
    document.addEventListener("keydown", this.onKeyDown);
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown(event) {
    const eventDescriptor = this.keys[event.code];

    // console.log("[%s] %s →", this.id, event.code, eventDescriptor);

    if (typeof eventDescriptor === "undefined") {
      return;
    }

    if (typeof eventDescriptor === "string") {
      this.stateMachine.sendEvent(eventDescriptor);
    } else {
      this.stateMachine.sendEvent(eventDescriptor.name, eventDescriptor.data);
    }
  }

  emitKeyboardEvent(code) {
    this.onKeyDown({ code, synthetic: true });
  }
}
