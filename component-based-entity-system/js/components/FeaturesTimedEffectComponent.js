import { TimedEffectComponent } from "./TimedEffectComponent.js";

export class FeaturesTimedEffectComponent extends TimedEffectComponent {
  constructor({
    targetComponentName,
    startDelayInTicks,
    durationInTicks,
    remainingTicks = durationInTicks,
    startValues,
    endSoonValues,
    endValues,
  }) {
    super({
      targetComponentName,
      startDelayInTicks,
      durationInTicks,
      remainingTicks,
      startValues,
      endSoonValues,
      endValues,
    });
  }
}
