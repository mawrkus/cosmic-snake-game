import { GameError } from "../errors/GameError.js";
import { GameStateMachine } from "../state-machine/GameStateMachine.js";

export class EntityManager {
  constructor({ stateMachine }) {
    this.stateMachine = stateMachine;

    this.entities = new Map();

    this.componentsBitLookup = new Map();
    this.currentBit = 1;
  }

  createEntity(entityId, components) {
    if (this.entities.has(entityId)) {
      throw GameError.create(`Entity "${entityId}" already exists!`);
    }

    const entityComponents = new Map();

    const entityData = new Map([
      ["id", entityId],
      ["key", 0],
      ["components", entityComponents],
    ]);

    this.entities.set(entityId, entityData);

    for (const component of components) {
      this.addComponent(entityId, component);
    }

    this.stateMachine.sendEvent(GameStateMachine.EVENTS.ENTITY_CREATED, {
      entityId,
      components: components.reduce(
        (acc, c) => ({ ...acc, [c.getName()]: c.get() }),
        {}
      ),
    });

    return entityId;
  }

  addComponent(entityId, component) {
    const entityData = this.getEntity(entityId);
    const entityComponents = entityData.get("components");

    entityComponents.set(component.getName(), component);

    if (!this.componentsBitLookup.has(component.getName())) {
      this.componentsBitLookup.set(component.getName(), this.currentBit);

      this.currentBit = this.currentBit << 1;
    }

    entityData.set(
      "key",
      entityData.get("key") | this.componentsBitLookup.get(component.getName())
    );

    // See Component.js
    component.getEntityId = () => entityId;

    component.remove = () => {
      entityComponents.delete(component.getName());

      entityData.set(
        "key",
        entityData.get("key") &
          ~this.componentsBitLookup.get(component.getName())
      );
    };

    return component;
  }

  upsertComponent(entityId, component) {
    const entityComponents = this.getEntity(entityId).get("components");

    if (!entityComponents.has(component.getName())) {
      return this.addComponent(entityId, component);
    }

    const componentToUpdate = entityComponents.get(component.getName());

    componentToUpdate.copyValuesFrom(component);

    return componentToUpdate;
  }

  replaceEntityComponent(entityId, componentName, newComponent) {
    const previousComponent = this.getEntityComponent(entityId, componentName);

    this.getEntity(entityId).get("components").set(componentName, newComponent);

    return previousComponent;
  }

  removeAllEntities({ except } = {}) {
    const entitiesToSave = new Set(except);

    for (const entityData of this.entities.values()) {
      const entityId = entityData.get("id");

      if (!entitiesToSave.has(entityId)) {
        this.removeEntity(entityId);
      }
    }
  }

  removeEntity(entityId) {
    this.entities.delete(entityId);

    this.stateMachine.sendEvent(GameStateMachine.EVENTS.ENTITY_REMOVED, {
      entityId,
    });
  }

  getComponents(componentNames) {
    let searchKey = 0;

    for (const componentName of componentNames) {
      if (!this.componentsBitLookup.has(componentName)) {
        throw GameError.create(`Unknown component "${componentName}"!`, {
          meta: this.componentsBitLookup,
        });
      }

      searchKey |= this.componentsBitLookup.get(componentName);
    }

    const result = [];

    for (const entityData of this.entities.values()) {
      if ((searchKey & entityData.get("key")) === searchKey) {
        const entityComponents = entityData.get("components");

        result.push(
          componentNames.map((componentName) =>
            entityComponents.get(componentName)
          )
        );
      }
    }

    return result;
  }

  getEntityComponents(entityId, componentNames) {
    const entityComponents = this.getEntity(entityId).get("components");

    if (!componentNames) {
      return entityComponents;
    }

    return componentNames.map((componentName) =>
      this.getEntityComponent(entityId, componentName)
    );
  }

  getEntityComponent(entityId, componentName) {
    const entityComponents = this.getEntity(entityId).get("components");

    if (!entityComponents.has(componentName)) {
      // throw GameError.create(
      //   `The entity "${entityId}" does not have any "${componentName}" component!`,
      //   { meta: entityComponents }
      // );
      console.warn(
        `The entity "${entityId}" does not have any "${componentName}" component!`,
        { meta: entityComponents }
      );
      console.trace();
      return null;
    }

    return entityComponents.get(componentName);
  }

  hasEntityComponent(entityId, componentName) {
    return this.getEntity(entityId).get("components").has(componentName);
  }

  getEntity(entityId) {
    if (!this.entities.has(entityId)) {
      throw GameError.create(`The entity "${entityId}" does not exist!`);
    }

    return this.entities.get(entityId);
  }

  filterEntities(filterFn) {
    return Array.from(this.entities).filter(([entityId, entityData]) =>
      filterFn(entityData)
    );
  }

  forEachEntities(forEachFn) {
    return Array.from(this.entities).forEach(([entityId, entityData]) =>
      forEachFn(entityData)
    );
  }
}
