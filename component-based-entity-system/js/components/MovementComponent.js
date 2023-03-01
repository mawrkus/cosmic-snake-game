import { Component } from "./Component.js";

export class MovementComponent extends Component {
  static DIRS = [
    [0, -1], // up
    [+1, 0], // right
    [0, +1], // down
    [-1, 0], // left
  ];

  static DIR_NAMES = ["up", "right", "down", "left"];

  static DIRS_COUNT = MovementComponent.DIRS.length;

  static randomDir() {
    return Math.floor(Math.random() * MovementComponent.DIRS_COUNT);
  }

  constructor({ dir, speed, acc, nextDir, isFrozen }) {
    super({ dir, speed, acc, nextDir, isFrozen });
  }

  turnLeft() {
    this.turn(-1);
  }

  turnRight() {
    this.turn(+1);
  }

  turn(dirInc) {
    let nextDir = this.getDir() + dirInc;

    if (nextDir < 0) {
      nextDir = MovementComponent.DIRS_COUNT - 1;
    } else if (nextDir >= MovementComponent.DIRS_COUNT) {
      nextDir = 0;
    }

    this.setNextDir(nextDir);
  }

  getDirIncs() {
    return MovementComponent.DIRS[this.getDir()];
  }

  getDirName() {
    return MovementComponent.DIR_NAMES[this.getDir()];
  }
}
