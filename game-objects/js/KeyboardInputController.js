class KeyboardInputController {
  constructor({ id, keysToEventsMapping, stateMachine }) {
    this.id = id;
    this.keysToEventsMapping = keysToEventsMapping;
    this.stateMachine = stateMachine;

    this.onKeyDown = this.onKeyDown.bind(this);
  }

  bindEvents() {
    document.removeEventListener("keydown", this.onKeyDown);
    document.addEventListener("keydown", this.onKeyDown);
  }

  onKeyDown(event) {
    const eventDescriptor = this.keysToEventsMapping[event.code];

    // console.log("[%s] %s →", this.id, event.code, eventDescriptor);

    if (typeof eventDescriptor === "undefined") {
      return;
    }

    if (typeof eventDescriptor === "string") {
      this.stateMachine.sendEvent(eventDescriptor);
    } else {
      this.stateMachine.sendEvent(eventDescriptor.event, eventDescriptor.data);
    }
  }

  emitKeyboardEvent(code) {
    this.onKeyDown({ code, synthetic: true });
  }
}
