import { EventManager } from "./EventManager.js";

export class StateMachine extends EventManager {
  static EVENT_NAME_TRANSITION = Symbol("TRANSITION");

  constructor({ initialStateId, context, states }) {
    super();

    this.context = context;
    this.states = states;

    this.currentStateId = initialStateId;
    this.previousStateId = null;

    this.actionThis = {};

    this.onEntryThis = {
      sendEvent: this.sendEvent.bind(this),
    };

    this.exitThis = {};
  }

  sendEvent(eventName, data) {
    const currentStateNode = this.states[this.currentStateId];
    let transitionDescriptor = currentStateNode.events[eventName];

    if (!transitionDescriptor) {
      return;
    }

    const event = {
      timestamp: performance.now(),
      name: eventName,
      stateId: this.currentStateId,
      prevStateId: this.previousStateId,
      data,
    };

    // console.log("[event] 🗓️", JSON.stringify(event));

    if (Array.isArray(transitionDescriptor)) {
      transitionDescriptor = transitionDescriptor.find((descriptor) =>
        descriptor.cond(event, this.context)
      );
    }

    this.previousStateId = this.currentStateId;
    this.currentStateId = transitionDescriptor.targetId;

    const transition = {
      fromStateId: this.previousStateId,
      toStateId: this.currentStateId,
      event,
    };

    // console.log("[transition] →", transition);

    transitionDescriptor.action?.call(this.actionThis, event, this.context);

    this.emit(event, this.context);

    this.emit(
      { name: StateMachine.EVENT_NAME_TRANSITION, data: transition },
      this.context
    );

    transitionDescriptor.onExit?.call(this.onExitThis, event, this.context);

    const nextStateNode = this.states[transitionDescriptor.targetId];
    // console.log("[next state]", transitionDescriptor.targetId);

    if (nextStateNode) {
      nextStateNode.onEntry?.call(this.onEntryThis, event, this.context);
    }
  }
}
