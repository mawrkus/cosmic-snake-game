import { GameError } from "../errors/GameError.js";

export class EventManager {
  constructor() {
    this.eventsMap = new Map();
  }

  static validate(eventName, listener) {
    if (
      !eventName ||
      (typeof eventName !== "string" && typeof eventName !== "symbol")
    ) {
      throw GameError.create(
        `Please provide a valid event name (received ${eventName})!`,
        {
          meta: eventName,
        }
      );
    }

    if (typeof listener !== "function") {
      throw GameError.create(
        `Please provide a valid listener function (received ${listener})!`,
        {
          meta: listener,
        }
      );
    }
  }

  on(eventName, listener) {
    EventManager.validate(eventName, listener);

    const listeners = this.eventsMap.has(eventName)
      ? this.eventsMap.get(eventName)
      : new Set();

    listeners.add(listener);

    return this.eventsMap.set(eventName, listeners);
  }

  off(eventName, listener) {
    EventManager.validate(eventName, listener);

    if (!this.eventsMap.has(eventName)) {
      throw GameError.create(`No registered event "${eventName}"!`, {
        meta: eventName,
      });
    }

    if (!this.eventsMap.has(eventName)) {
      return;
    }

    return this.eventsMap.get(eventName).delete(listener);
  }

  emit(event, optionalNonSerializableData) {
    if (!event.name) {
      throw GameError.create("Cannot emit an event without a name!", {
        meta: event,
      });
    }

    if (!this.eventsMap.has(event.name)) {
      return;
    }

    for (const listener of this.eventsMap.get(event.name)) {
      listener(event, optionalNonSerializableData);
    }
  }
}
