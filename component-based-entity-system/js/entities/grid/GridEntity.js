import { AnimationComponent } from "../../components/AnimationComponent.js";
import { GridFeaturesComponent } from "../../components/GridFeaturesComponent.js";

export class GridEntity {
  static ID = "GRID";
  static UNIT_IN_PIXELS = 16;

  static toPixels = (n) => n * GridEntity.UNIT_IN_PIXELS;

  static build({ width, height }) {
    const featuresComponent = new GridFeaturesComponent({
      width,
      height,
      isDisabled: false,
      hasWarp: false,
      collision: null,
    });

    const animationComponent = new AnimationComponent({
      className: "GridCanvasAnimation",
      props: {
        width,
        height,
      },
    });

    return [featuresComponent, animationComponent];
  }
}
