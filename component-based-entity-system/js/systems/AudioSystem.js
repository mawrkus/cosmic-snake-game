import { AudioClip } from "../audio/AudioClip.js";
import { bindAll } from "../helpers/index.js";
import { BackgroundEntity } from "../entities/background/BackgroundEntity.js";
import { GameStateMachine } from "../state-machine/GameStateMachine.js";
import { SnakeEntity } from "../entities/snake/SnakeEntity.js";
import { System } from "./System.js";

// https://pixabay.com/sound-effects
// https://twistedwave.com/online

export class AudioSystem extends System {
  constructor({ entityManager, stateMachine }) {
    super();

    this.entityManager = entityManager;
    this.stateMachine = stateMachine;

    this.audioClips = {};
    this.isMusicOn = true;
    this.backgroundMusicClip = null;
    this.audioEffectPlaying = null;

    bindAll(this, [
      "createAudioClip",
      "playMusic",
      "toggleMusic",
      "playAppleEatenSound",
      "playSnakeAccelerateStressSound",
      "playGameOver",
    ]);
  }

  bootstrap() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.on(EVENTS.ENTITY_CREATED, this.createAudioClip);
    this.stateMachine.on(EVENTS.CONTROLLER_TOGGLE_MUSIC, this.toggleMusic);
    this.stateMachine.on(EVENTS.GAME_START, this.playMusic);
    this.stateMachine.on(EVENTS.SNAKE_EAT, this.playAppleEatenSound);
    this.stateMachine.on(
      EVENTS.SNAKE_ACCELERATE_STRESS,
      this.playSnakeAccelerateStressSound
    );
    this.stateMachine.on(EVENTS.GAME_OVER, this.playGameOver);
  }

  shutdown() {
    const { EVENTS } = GameStateMachine;

    this.stateMachine.off(EVENTS.GAME_OVER, this.playGameOver);
    this.stateMachine.off(
      EVENTS.SNAKE_ACCELERATE_STRESS,
      this.playSnakeAccelerateStressSound
    );
    this.stateMachine.off(EVENTS.SNAKE_EAT, this.playAppleEatenSound);
    this.stateMachine.off(EVENTS.GAME_START, this.playMusic);
    this.stateMachine.off(EVENTS.CONTROLLER_TOGGLE_MUSIC, this.toggleMusic);
    this.stateMachine.off(EVENTS.ENTITY_CREATED, this.createAudioClip);
  }

  createAudioClip(event) {
    const { entityId } = event.data;

    if (!this.entityManager.hasEntityComponent(entityId, "Audio")) {
      return;
    }

    // console.log('[audio] 🔊 Creating audio clips for entity "%s"...', entityId);

    const entityAudio = this.entityManager.getEntityComponent(
      entityId,
      "Audio"
    );

    this.audioClips[entityId] = Object.entries(entityAudio.get()).reduce(
      (acc, [name, audioClipProps]) => ({
        ...acc,
        [name]: new AudioClip(audioClipProps),
      }),
      {}
    );
  }

  playMusic() {
    this.audioClips[BackgroundEntity.ID].gameOver.stop(); // just in case
    this.audioEffectPlaying = null;

    if (this.isMusicOn) {
      const musicClipName = `gameLoop${Math.floor(Math.random() * 2)}`;

      this.backgroundMusicClip =
        this.audioClips[BackgroundEntity.ID][musicClipName];

      this.backgroundMusicClip.play();
    }
  }

  toggleMusic() {
    this.isMusicOn = !this.isMusicOn;

    this.backgroundMusicClip.toggle();
  }

  playAudioEffect(audioClip) {
    audioClip.play();

    this.audioEffectPlaying = audioClip;
  }

  playAppleEatenSound(event) {
    this.playAudioEffect(this.audioClips[event.data.appleId].eat);
  }

  playSnakeAccelerateStressSound() {
    this.playAudioEffect(this.audioClips[SnakeEntity.ID].accelerateStress);
  }

  playGameOver(event) {
    this.backgroundMusicClip.stop();

    if (event.data?.cause) {
      if (this.audioEffectPlaying) {
        this.audioEffectPlaying.stop();
      }

      this.audioClips[BackgroundEntity.ID].gameOver.play();
    }
  }
}
