import { GameError } from "../errors/GameError.js";

export class System {
  constructor() {
    if (!this.bootstrap) {
      throw GameError.create("Please implement the System.bootstrap method!");
    }

    if (!this.shutdown) {
      throw GameError.create("Please implement the System.shutdown method!");
    }
  }
}
