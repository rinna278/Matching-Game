import { _decorator, Component, AudioSource, resources, AudioClip } from "cc";
const { ccclass, property } = _decorator;

@ccclass("AudioManager")
export class AudioManager extends Component {
  @property(AudioClip)
  backgroundMusic: AudioClip | null = null;

  @property(AudioClip)
  matchSound: AudioClip | null = null;

  @property(AudioClip)
  clickSound: AudioClip | null = null;

  private audioSource: AudioSource | null = null;
  private clickSource: AudioSource | null = null;
  private matchSource: AudioSource | null = null;
  private isMatchSoundPlay: boolean = true;
  private isClickSoundPlay: boolean = true;
  private sfxEnabled: boolean = true;
  start() {
    this.audioSource = this.node.addComponent(AudioSource);
    this.clickSource = this.node.addComponent(AudioSource);
    this.matchSource = this.node.addComponent(AudioSource);
    this.setUpBGM();
    this.playBackgroundMusic();
  }
  // ==================BGM====================
  setUpBGM() {
    if (this.audioSource && this.backgroundMusic) {
      this.audioSource.clip = this.backgroundMusic;
      this.audioSource.playOnAwake = true;
      this.audioSource.loop = true;
      this.audioSource.volume = 1;
    }
  }

    setBackgroundVolume(volume: number) {
    if (this.audioSource) {
      this.audioSource.volume = volume;
    }
  }

  stopBackgroundMusic() {
    if (this.audioSource) {
      this.audioSource.pause();
    }
  }

  playBackgroundMusic() {
    this.audioSource.play();
  }

  // ==================== Click Sound ====================
  playClickSound() {
    if (!this.sfxEnabled) return;
    if (this.clickSource && this.clickSound) {
      this.clickSource.clip = this.clickSound;
      this.clickSource.loop = false;
      this.clickSource.play();
      this.isClickSoundPlay = true;
    }
  }

  // ==================== Match Sound ====================
  playMatchSound() {
    if (!this.sfxEnabled) return;
    if (this.matchSource && this.matchSound) {
      this.matchSource.clip = this.matchSound;
      this.matchSource.loop = false;
      this.matchSource.play();
      this.isMatchSoundPlay = true;
    }
  }

  playSfx(){
    this.playClickSound();
    this.playMatchSound();
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }
}
