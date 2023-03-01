class AudioClip {
  // https://pixabay.com/sound-effects
  // https://twistedwave.com/online
  constructor({ file, loop = false, volume = 1 } = {}) {
    this.audio = new Audio(file);
    this.audio.loop = loop;
    this.audio.volume = volume;

    if (this.loop) {
      this.play = () => {
        this.audio.play();
        this.play = () => {};
      };
      return;
    }
  }

  play() {
    if (this.audio.currentTime) {
      this.stop();
    }

    this.audio.play();

    return this.audio;
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;

    return this.audio;
  }

  toggle() {
    if (!this.audio.paused) {
      this.audio.pause();
      return false;
    }

    this.audio.play();
    return true;
  }
}
