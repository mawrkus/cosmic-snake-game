import { GameLoop } from "./GameLoop.js";

export class Game {
  static bootstrap() {
    const onKeyDown = (event) => {
      if (event.code !== "Space") {
        return;
      }

      document.removeEventListener("keydown", onKeyDown);

      document.querySelector(".intro-screen").classList.add("hidden");
      document.querySelector(".world").classList.remove("hidden");

      const gameLoop = new GameLoop();

      gameLoop.bootstrap();
    };

    document.addEventListener("keydown", onKeyDown);
  }
}
