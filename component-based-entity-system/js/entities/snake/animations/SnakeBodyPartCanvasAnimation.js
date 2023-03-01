import { GridEntity } from "../../grid/GridEntity.js";
import { SnakeEntity } from "../SnakeEntity.js";

export class SnakeBodyPartCanvasAnimation {
  constructor({ aliveProps, deadProps }) {
    this.aliveProps = aliveProps;
    this.deadProps = deadProps;
  }

  draw({ canvas, position, shake, movement, features, incorporeal }) {
    if (!features.isAlive) {
      this.drawDeadPart({ canvas, position, movement, features });
      return;
    }
    const { color, size } = features.isTail
      ? SnakeEntity.TAIL_ANIMATION_PROPS.aliveProps
      : this.aliveProps;

    const posOffset = (GridEntity.UNIT_IN_PIXELS - size) / 2;

    let [pX, pY] = [position.pixelsX + posOffset, position.pixelsY + posOffset];

    if (shake.amplitude && Math.random() > 0.25) {
      [pX, pY] = this.applyShake({
        pX,
        pY,
        dir: movement.dir,
        amplitude: shake.amplitude,
      });
    }
    if (incorporeal) {
      canvas.ctx.shadowColor = color;
      canvas.ctx.shadowBlur = incorporeal.shadowBlur;
      canvas.ctx.globalAlpha = incorporeal.globalAlpha;
    }

    canvas.ctx.fillStyle = color;
    canvas.ctx.fillRect(pX, pY, size, size);
  }

  drawDeadPart({ canvas, position, movement, features }) {
    const { color, size } = features.isTail
      ? SnakeEntity.TAIL_ANIMATION_PROPS.deadProps
      : this.deadProps;

    const posOffset = (GridEntity.UNIT_IN_PIXELS - size) / 2;

    const [pX, pY] = this.applyShake({
      pX: position.pixelsX + posOffset,
      pY: position.pixelsY + posOffset,
      dir: movement.dir,
      amplitude: 0.3,
    });

    canvas.ctx.fillStyle = color;
    canvas.ctx.fillRect(pX, pY, size, size);
  }

  applyShake({ pX, pY, dir, amplitude }) {
    // up or down
    if (dir === 0 || dir === 2) {
      pX +=
        (Math.random() > 0.5 ? Math.random() : -Math.random()) *
        amplitude *
        GridEntity.UNIT_IN_PIXELS;
    } else {
      pY +=
        (Math.random() < 0.5 ? Math.random() : -Math.random()) *
        amplitude *
        GridEntity.UNIT_IN_PIXELS;
    }

    return [pX, pY];
  }
}
