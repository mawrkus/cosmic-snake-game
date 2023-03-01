class StateMachine {
  constructor({ initialStateId, context, states, onTransition }) {
    this.context = context;
    this.states = states;
    this.onTransition = onTransition;

    this.currentStateId = initialStateId;
    this.previousStateId = null;

    this.onEntryThis = {
      sendEvent: this.sendEvent.bind(this),
    };

    this.actionThis = {
      sendEvent: this.sendEvent.bind(this),
    };
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
      prevStateId: this.previousStateId,
      stateId: this.currentStateId,
      data,
    };

    // console.log("[event]", event);

    if (Array.isArray(transitionDescriptor)) {
      transitionDescriptor = transitionDescriptor.find((descriptor) =>
        descriptor.cond(event)
      );
    }

    this.previousStateId = this.currentStateId;
    this.currentStateId = transitionDescriptor.targetId;

    transitionDescriptor.action?.call(this.actionThis, this.context, event);

    if (this.onTransition) {
      const transition = {
        fromStateId: this.previousStateId,
        toStateId: this.currentStateId,
        event,
      };

      // console.log("[transition]", transition);

      this.onTransition(transition, this.context);
    }

    const nextStateNode = this.states[transitionDescriptor.targetId];
    // console.log("[next state]", transitionDescriptor.targetId);

    nextStateNode.onEntry?.call(this.onEntryThis, this.context, event);
  }
}
