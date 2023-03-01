import { AnimationComponent } from "../../components/AnimationComponent.js";
import { AudioComponent } from "../../components/AudioComponent.js";

export class BackgroundEntity {
  static ID = "BACKGROUND";

  static build({}) {
    const animationComponent = new AnimationComponent({
      className: "BackgroundCanvasAnimation",
      props: {
        imgClassNames: ["img0", "img1", "img2"],
      },
    });

    const audioComponent = new AudioComponent({
      gameLoop0: {
        file: "./assets/audio/game-loop0.mp3",
        loop: true,
        volume: 0.5,
      },
      gameLoop1: {
        file: "./assets/audio/game-loop1.mp3",
        loop: true,
        volume: 0.5,
      },
      gameOver: {
        file: "./assets/audio/game-over.mp3",
      },
    });

    return [animationComponent, audioComponent];
  }
}
