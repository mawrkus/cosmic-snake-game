import { GridEntity } from "../../grid/GridEntity.js";
import { oscillator } from "../../../helpers/index.js";

export class AppleIncorporealPillCanvasAnimation {
  constructor() {
    this.color = "rgb(239,90,90)";
    this.opacity = oscillator(1, 0.6, -0.015);
    this.inactiveOpacity = 0.5;

    this.radius = oscillator(
      GridEntity.UNIT_IN_PIXELS * 0.35,
      GridEntity.UNIT_IN_PIXELS * 0.3,
      -0.033
    );
  }

  draw({ canvas, position, features }) {
    canvas.ctx.fillStyle = this.color;

    canvas.ctx.globalAlpha = features.isInactive
      ? this.inactiveOpacity
      : this.opacity.next().value;

    // canvas.ctx.shadowColor = this.color;
    // canvas.ctx.shadowBlur = 2;

    canvas.ctx.fillRect(
      GridEntity.toPixels(position.x + 0.23),
      GridEntity.toPixels(position.y + 0.23),
      GridEntity.UNIT_IN_PIXELS * 0.54,
      GridEntity.UNIT_IN_PIXELS * 0.54
    );
  }
}
