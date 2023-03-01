import { Component } from "./Component.js";
import { enumeration } from "../helpers/index.js";

export class PlayerComponent extends Component {
  static CONTROLLER_TYPES = enumeration(["KEYBOARD"]);

  constructor({ controllerType, points }) {
    super({ controllerType, points });
  }
}
