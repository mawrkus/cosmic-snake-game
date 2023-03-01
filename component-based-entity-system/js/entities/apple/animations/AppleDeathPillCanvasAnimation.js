import { GridEntity } from "../../grid/GridEntity.js";
import { fader, oscillator } from "../../../helpers/index.js";

export class AppleDeathPillCanvasAnimation {
  constructor() {
    this.colorFad = fader(245, 43, -0.75);
    this.colorOsc = oscillator(10, 0, -0.5);

    this.opacity = oscillator(1, 0.6, -0.003);
    this.inactiveOpacity = 0.7;

    this.radius = oscillator(
      GridEntity.UNIT_IN_PIXELS * 0.33,
      GridEntity.UNIT_IN_PIXELS * 0.1,
      -0.01
    );
  }

  draw({ canvas, position, features }) {
    const colorParam =
      (this.colorFad.next().value || 43) + this.colorOsc.next().value;

    canvas.ctx.fillStyle = `rgb(${colorParam},${colorParam},${colorParam})`;

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
