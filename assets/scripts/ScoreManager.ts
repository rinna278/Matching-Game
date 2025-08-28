import {
  _decorator,
  Component,
  instantiate,
  Label,
  Node,
  ParticleSystem,
  Prefab,
  Sprite,
  UITransform,
  Vec3,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("ScoreManager")
export class ScoreManager extends Component {
  @property(Label)
  scoreLabel: Label | null = null;
  public currentScore: number = 0;
  scorePerLevel: number = 100;
  milestoneScore: number[] = [30, 65, 100];
  @property(Sprite)
  progressSprite: Sprite | null = null;
  @property(Sprite)
  progressBar: Sprite | null = null;
  // Node chứa các sao
  @property(Prefab)
  milestoneStarNode: Prefab | null = null;
  currentStarIndex = 0;

  @property(Prefab)
  matchEffectPrefab: Prefab | null = null;


  updateScoreLabel() {
    if (this.scoreLabel) {
      this.scoreLabel.string = `Score: ${this.getScore()}`;
    }
  }

  updateProgressSprite() {
    if (!this.progressSprite) return;
    const fillPercentage = this.currentScore / this.scorePerLevel;

    this.progressSprite.fillRange = fillPercentage;
    console.log(this.progressSprite.fillRange);
  }

  addScore() {
    this.currentScore+=2;
    this.updateScoreLabel();
    this.updateProgressSprite();
    this.checkMilestoneStars();
  }

  resetScore() {
    this.clearMilestoneStars();
    this.currentScore = 0;
    this.currentStarIndex = 0;
    this.updateScoreLabel();
    this.updateProgressSprite();
    this.placeMileStarNode();
    this.checkMilestoneStars();
  }

  getScore() {
    return this.currentScore;
  }

  setMilestoneScore(mileStoneScore: number[]) {
    this.milestoneScore = mileStoneScore;
  }

  // Tạo và đặt các node sao theo % mileScore
  async placeMileStarNode() {
    if (!this.progressBar || !this.milestoneStarNode) return;

    const spriteWidth =
      this.progressBar.node.getComponent(UITransform)?.width || 0;

    console.log("spriteWidth", spriteWidth);
    this.scorePerLevel = this.milestoneScore[this.milestoneScore.length - 1];
    // clear các sao cũ (nếu có)
    for (let i = 0; i < this.milestoneScore.length; i++) {
      const percent = this.milestoneScore[i] / this.scorePerLevel;
      const xPos = spriteWidth *percent - spriteWidth / 2;
      console.log("percent", percent);
      const starNode = instantiate(this.milestoneStarNode); // clone prefab sao
      starNode.name = `MileStar${i + 1}`;
      this.progressBar.node.addChild(starNode); // thêm sao vào progress bar
      starNode.setPosition(xPos, 0, 0);
      const starEmpty = starNode.getChildByName("StarEmpty");
      const starFilled = starNode.getChildByName("StarFilled");
      // console.log("starEmpty:", starEmpty);
      // console.log("starFilled:", starFilled);

      if (starEmpty) {
        starEmpty.active = true;
      }
      if (starFilled) starFilled.active = false;
    }
    await Promise.resolve();
    console.log("Mile stars placed.");
  }

  async checkMilestoneStars() {
    if (!this.progressBar) return;

    const stars = this.progressBar.node.children;

    const starEmpty1 = stars[1].getChildByName("StarEmpty");
    const starFilled1 = stars[1].getChildByName("StarFilled");
    if(this.currentScore >= this.milestoneScore[0] && this.currentStarIndex === 0){
      if (starEmpty1) starEmpty1.active = false;
      if (starFilled1) starFilled1.active = true;
      this.currentStarIndex = 1;
      console.log("currentStarIndex:",this.currentStarIndex);
      await Promise.resolve();
      return;
    }
    
    const starEmpty2 = stars[2].getChildByName("StarEmpty");
    const starFilled2 = stars[2].getChildByName("StarFilled");
    if(this.currentScore >= this.milestoneScore[1] && this.currentStarIndex === 1){
      if (starEmpty2) starEmpty2.active = false;
      if (starFilled2) starFilled2.active = true;
      this.currentStarIndex = 2;
      console.log("currentStarIndex:",this.currentStarIndex);
      await Promise.resolve();
      return;
    }
    const starEmpty3 = stars[3].getChildByName("StarEmpty");
    const starFilled3 = stars[3].getChildByName("StarFilled");
    if(this.currentScore >= this.milestoneScore[2] && this.currentStarIndex === 2){
      if (starEmpty3) starEmpty3.active = false;
      if (starFilled3) starFilled3.active = true;
    }
    await Promise.resolve();
  }

  async clearMilestoneStars() {
    if (!this.progressBar) return;

    const stars = this.progressBar.node.children;

    // bỏ index 0 vì đó là progressSprite, sao bắt đầu từ index 1
    for (let i = 0; i < this.milestoneScore.length; i++) {
      const starNode = stars[i + 1];
      if (starNode) {
        starNode.destroy();
      }
    }
    await Promise.resolve();
  }

  getTargetStarPosition() : Vec3 | null {
    if (!this.progressBar) return null;
    if (this.currentStarIndex >= this.milestoneScore.length) return;

    const stars = this.progressBar.node.children;
    const starNode = stars[this.currentStarIndex + 1];
    if (!starNode) return null;
    console.log("starNode", starNode.name)
    return starNode.worldPosition.clone();
  }

  private spawnMilestoneEffect(starNode: Node) {
    if (!this.matchEffectPrefab) return;

    const effect = instantiate(this.matchEffectPrefab);
    effect.setPosition(starNode.position.clone()); 
    starNode.addChild(effect);

    const ps = effect.getComponent(ParticleSystem);
    if (ps) {
      ps.play();
    }

    setTimeout(() => {
      effect.destroy();
    }, 2000);
  }

}
