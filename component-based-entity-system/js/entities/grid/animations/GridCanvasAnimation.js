import { GridEntity } from "../GridEntity.js";

export class GridCanvasAnimation {
  constructor({ width, height }) {
    const canvasElement = document.querySelector(".grid");

    canvasElement.classList.remove(
      "paused",
      "warped",
      "collision",
      "up",
      "right",
      "down",
      "left"
    );

    canvasElement.width = width * GridEntity.UNIT_IN_PIXELS;
    canvasElement.height = height * GridEntity.UNIT_IN_PIXELS;
  }

  draw({ canvas, features }) {
    canvas.element.classList.toggle("paused", Boolean(features.isDisabled));

    canvas.element.classList.toggle(
      "warped",
      Boolean(features.hasWarp && !features.isDisabled)
    );

    if (features.collision) {
      document.documentElement.style.setProperty(
        "--collision-inc",
        `${3 * Math.ceil(features.collision.speed)}px`
      );

      canvas.element.classList.add("collision", features.collision.dirName);
    }

    canvas.ctx.fillStyle = features.isDisabled
      ? "rgba(21,21,21,0.8)"
      : "rgba(21,21,21)";

    canvas.ctx.fillRect(0, 0, canvas.element.width, canvas.element.height);
  }
}
