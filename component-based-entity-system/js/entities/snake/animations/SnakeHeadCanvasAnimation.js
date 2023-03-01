export class SnakeHeadCanvasAnimation {
  constructor({ aliveProps, deadProps }) {
    this.aliveProps = aliveProps;
    this.deadProps = deadProps;
  }

  draw({ canvas, position, features, incorporeal }) {
    if (!features.isAlive) {
      const { color, size } = this.deadProps;

      canvas.ctx.fillStyle = color;
      canvas.ctx.fillRect(position.pixelsX, position.pixelsY, size, size);

      return;
    }

    const { color, size } = this.aliveProps;

    if (incorporeal) {
      canvas.ctx.shadowColor = color;
      canvas.ctx.shadowBlur = incorporeal.shadowBlur;
      canvas.ctx.globalAlpha = incorporeal.globalAlpha;
    }

    canvas.ctx.fillStyle = color;
    canvas.ctx.fillRect(position.pixelsX, position.pixelsY, size, size);
  }
}
