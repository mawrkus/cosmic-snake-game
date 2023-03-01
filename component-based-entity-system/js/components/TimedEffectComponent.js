import { Component } from "./Component.js";

export class TimedEffectComponent extends Component {
  constructor({
    targetComponentName,
    startDelayInTicks = 0,
    durationInTicks,
    remainingTicks = durationInTicks,
    startValues,
    endSoonValues,
    endValues,
  }) {
    super({
      targetComponentName,
      hasStarted: false,
      startDelayInTicks,
      durationInTicks,
      remainingTicks,
      startValues,
      endSoonValues,
      endValues,
      hasNotifiedEndSoon: false,
    });
  }
}
