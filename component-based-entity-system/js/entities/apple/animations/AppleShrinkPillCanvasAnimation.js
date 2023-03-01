import { GridEntity } from "../../grid/GridEntity.js";
import { oscillator } from "../../../helpers/index.js";

export class AppleShrinkPillCanvasAnimation {
  constructor() {
    this.color = "rgb(0,187,240)";
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

    canvas.ctx.beginPath();

    canvas.ctx.arc(
      GridEntity.toPixels(position.x + 0.5),
      GridEntity.toPixels(position.y + 0.5),
      this.radius.next().value,
      0,
      2 * Math.PI
    );

    canvas.ctx.fill();
  }
}
