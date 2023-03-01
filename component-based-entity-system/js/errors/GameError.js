export class GameError extends Error {
  constructor(message, options) {
    super(message, options);

    this.name = "GameError";
  }

  static create(message, fullOptions = {}) {
    const { meta, ...options } = fullOptions;

    const gameError = new GameError(message, options);

    gameError.meta = meta;

    console.error(gameError);

    if (meta) {
      console.error("GameError.meta =", meta);
    }

    return gameError;
  }
}
