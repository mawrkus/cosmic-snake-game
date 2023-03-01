import { TimedEffectComponent } from "./TimedEffectComponent.js";

export class MovementTimedEffectComponent extends TimedEffectComponent {
  constructor({
    startDelayInTicks,
    durationInTicks,
    remainingTicks = durationInTicks,
    startValues,
    endSoonValues,
    endValues,
  }) {
    super({
      targetComponentName: "Movement",
      startDelayInTicks,
      durationInTicks,
      remainingTicks,
      startValues,
      endSoonValues,
      endValues,
    });
  }
}
