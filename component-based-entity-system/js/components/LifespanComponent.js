import { Component } from "./Component.js";

export class LifespanComponent extends Component {
  constructor({ durationInTicks, remainingTicks = durationInTicks, reason }) {
    super({ durationInTicks, remainingTicks, reason });
  }
}
