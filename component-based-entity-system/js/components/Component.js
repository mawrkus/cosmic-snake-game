import { GameError } from "../errors/GameError.js";

const capitalize = (string) => `${string[0].toUpperCase()}${string.slice(1)}`;

export class Component {
  constructor(props = {}) {
    if (typeof props.name !== "undefined") {
      throw GameError.create(
        'The "name" prop is reserved! Please choose another prop name.',
        { meta: props.name }
      );
    }

    const name = this.constructor.name.replace("Component", "");

    this.getName = () => name;

    this.defineProperties(props);
  }

  defineProperties(props) {
    let data = new Map();

    const thisProps = Object.entries(props).reduce((acc, [key, value]) => {
      data.set(key, value);

      return {
        ...acc,
        get: {
          configurable: false,
          enumerable: true,
          value: () => Object.fromEntries(data),
          writable: false,
        },
        set: {
          configurable: false,
          enumerable: true,
          value: (newData) => {
            data = new Map(Object.entries(newData));
            return newData;
          },
          writable: false,
        },
        // has: {
        //   configurable: false,
        //   enumerable: true,
        //   value: (key) => {
        //     return data.has(key);
        //   },
        //   writable: false,
        // },
        [`get${capitalize(key)}`]: {
          configurable: false,
          enumerable: true,
          value: () => data.get(key),
          writable: false,
        },
        [`set${capitalize(key)}`]: {
          configurable: false,
          enumerable: true,
          value: (newValue) => {
            data.set(key, newValue);
            return newValue;
          },
          writable: false,
        },
        [`inc${capitalize(key)}`]: {
          configurable: false,
          enumerable: true,
          value: (inc) => {
            const newValue = data.get(key) + inc;
            data.set(key, newValue);
            return newValue;
          },
          writable: false,
        },
      };
    }, {});

    Object.defineProperties(this, thisProps);
  }

  copyValuesFrom(otherComponent) {
    // we don't need more than this, as we'll mostly copy timed effects
    // (see EntityManager.upsertComponent usage)
    this.set(otherComponent.get());
  }

  getEntityId() {
    throw GameError.create(
      "The Component.getEntityId method has not been defined by EntityManager!"
    );
  }

  remove() {
    throw GameError.create(
      "The Component.remove method has not been defined by EntityManager!"
    );
  }
}
