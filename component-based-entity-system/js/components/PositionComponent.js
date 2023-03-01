import { Component } from "./Component.js";
import { GridEntity } from "../entities/grid/GridEntity.js";

export class PositionComponent extends Component {
  constructor({
    x,
    y,
    pixelsX = GridEntity.toPixels(x),
    pixelsY = GridEntity.toPixels(y),
    lastPixelsOnGridX = GridEntity.toPixels(x),
    lastPixelsOnGridY = GridEntity.toPixels(y),
  }) {
    super({ x, y, pixelsX, pixelsY, lastPixelsOnGridX, lastPixelsOnGridY });
  }

  setXY(newX, newY) {
    this.setX(newX);
    this.setY(newY);

    this.setPixelsXY(GridEntity.toPixels(newX), GridEntity.toPixels(newY));
  }

  setPixelsXY(newPixelsX, newPixelsY, save = false) {
    this.setPixelsX(newPixelsX);
    this.setPixelsY(newPixelsY);

    if (save) {
      this.setLastPixelsOnGridXY(newPixelsX, newPixelsY);
    }
  }

  setLastPixelsOnGridXY(lastPixelsOnGridX, lastPixelsOnGridY) {
    this.setLastPixelsOnGridX(lastPixelsOnGridX);
    this.setLastPixelsOnGridY(lastPixelsOnGridY);
  }

  getLastDiffPixelsXY() {
    return {
      diffX: this.getPixelsX() - this.getLastPixelsOnGridX(),
      diffY: this.getPixelsY() - this.getLastPixelsOnGridY(),
    };
  }

  incXY(incX, incY) {
    const x = this.incX(incX);
    const y = this.incY(incY);

    return { x, y };
  }

  incPixelsXY(incPixelsX, incPixelsY) {
    this.incPixelsX(incPixelsX);
    this.incPixelsY(incPixelsY);
  }
}
