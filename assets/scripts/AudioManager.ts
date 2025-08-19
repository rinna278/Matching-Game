import { _decorator, Component, AudioSource, resources, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    @property(AudioClip)
    backgroundMusic: AudioClip | null = null;

    @property(AudioClip)
    matchSound: AudioClip | null = null;

    @property(AudioClip)
    clickSound: AudioClip | null = null;

    private audioSource: AudioSource | null = null;

    start() {
        this.audioSource = this.node.getComponent(AudioSource);
        if (!this.audioSource) {
            this.audioSource = this.node.addComponent(AudioSource);
        }
        
        this.playBackgroundMusic();
    }

    playBackgroundMusic() {
        if (this.audioSource && this.backgroundMusic) {
            this.audioSource.clip = this.backgroundMusic;
            this.audioSource.playOnAwake = true;
            this.audioSource.loop = true;
            this.audioSource.volume = 1;
            this.audioSource.play();
        }
    }

    playMatchSound() {
        if (this.audioSource && this.matchSound) {
            this.audioSource.playOneShot(this.matchSound, 1);
        }
    }

    playClickSound() {
        if (this.audioSource && this.clickSound) {
            this.audioSource.playOneShot(this.clickSound, 0.8);
        }
    }

    setBackgroundVolume(volume: number) {
        if (this.audioSource) {
            this.audioSource.volume = volume;
        }
    }

    stopBackgroundMusic() {
        if (this.audioSource) {
            this.audioSource.stop();
        }
    }
}