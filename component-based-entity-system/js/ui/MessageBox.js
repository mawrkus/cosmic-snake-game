export class MessageBox {
  static SUBTEXT_DISPLAY_DELAY = 1000;

  constructor() {
    this.textElement = document.querySelector(".message .text");
    this.subTextElement = document.querySelector(".message .sub-text");

    this.subTextTimeoutId = null;
  }

  display({ text, subText, subTextDelay }) {
    this.clear();

    this.textElement.textContent = text;

    if (!subTextDelay) {
      this.subTextElement.textContent = subText;
      return;
    }

    this.subTextTimeoutId = setTimeout(() => {
      this.subTextElement.textContent = subText;
    }, MessageBox.SUBTEXT_DISPLAY_DELAY);
  }

  clear() {
    clearTimeout(this.subTextTimeoutId);
    this.subTextTimeoutId = null;

    this.textElement.textContent = "";
    this.subTextElement.textContent = "";
  }
}
