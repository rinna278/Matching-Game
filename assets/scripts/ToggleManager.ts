import {
  _decorator,
  Component,
  Node,
  Sprite,
  SpriteFrame,
  tween,
  UITransform,
  Vec3,
} from "cc";
import { AudioManager } from "./AudioManager";
const { ccclass, property } = _decorator;

@ccclass("ToggleManager")
export class ToggleManager extends Component {
  @property(SpriteFrame)
  offSprite: SpriteFrame | null = null; // nền khi OFF

  @property(SpriteFrame)
  onSprite: SpriteFrame | null = null; // nền khi ON

  @property(Node)
  iconSwitch: Node | null = null;

  @property(AudioManager)
  audioManager: AudioManager | null = null;

  private isOn: boolean = true;
  private isBgmOn: boolean = true;
  start() {
    this.updateUI(this.isOn);
  }

  toggleSwitch() {
    this.isOn = !this.isOn;
    this.updateUI(this.isOn);
  }

  updateUI(checked: boolean) {
    const bgSprite = this.getComponent(Sprite);
    if (bgSprite) {
      bgSprite.spriteFrame = checked ? this.onSprite : this.offSprite;
    }

    // animate icon sang trái/phải
    if (this.iconSwitch) {
      const halfWidth = this.node.getComponent(UITransform)!.width / 2;
      const knobHalf = this.iconSwitch.getComponent(UITransform)!.width / 2;
      const targetX = checked
        ? halfWidth - knobHalf - 5
        : -(halfWidth - knobHalf - 5);

      tween(this.iconSwitch)
        .to(0.2, { position: new Vec3(targetX, 0, 0) })
        .start();
    }
  }
  toggleBGM() {
    this.isBgmOn = !this.isBgmOn;
    if (this.audioManager) {
      if (this.isBgmOn) {
        this.audioManager.playBackgroundMusic();
      } else {
        this.audioManager.stopBackgroundMusic();
        console.log("bgm has stop");
      }
    }
  }
}
