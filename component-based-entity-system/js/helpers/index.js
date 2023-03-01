import { GameError } from "../errors/GameError.js";

export const enumeration = (constants) =>
  Object.freeze(
    constants.reduce((acc, name) => ({ ...acc, [name]: name }), {})
  );

export const bindAll = (thisObj, methodNames) => {
  for (const methodName of methodNames) {
    if (typeof thisObj[methodName] !== "function") {
      throw GameError.create(`"${methodName}" is not a valid method!`, {
        meta: { thisObj, methodNames },
      });
    }

    thisObj[methodName] = thisObj[methodName].bind(thisObj);
  }
};

export function* oscillator(high, low, dec) {
  let current = high;

  yield current;

  while (true) {
    current += dec;

    if (current < low) {
      current = low;
      dec = -dec;
    } else if (current > high) {
      current = high;
      dec = -dec;
    }

    yield current;
  }
}

export function* fader(high, low, dec) {
  for (let i = high; i >= low; i += dec) {
    yield i;
  }
}
