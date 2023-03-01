export class BackgroundCanvasAnimation {
  constructor({ imgClassNames }) {
    this.imgClassNames = imgClassNames;
    this.element = document.querySelector(".game-background");
  }

  draw({ features = {} }) {
    if (features.hasCollision) {
      this.element.classList.add("flash");
      return;
    }

    const className =
      this.imgClassNames[Math.floor(Math.random() * this.imgClassNames.length)];

    this.element.classList.remove("flash", ...this.imgClassNames);
    this.element.classList.add(className);
  }
}
