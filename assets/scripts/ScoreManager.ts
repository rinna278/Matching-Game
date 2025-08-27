  import {
    _decorator,
    Component,
    instantiate,
    Label,
    Node,
    Prefab,
    Sprite,
    UITransform,
  } from "cc";
  const { ccclass, property } = _decorator;

  @ccclass("ScoreManager")
  export class ScoreManager extends Component {
    @property(Label)
    scoreLabel: Label | null = null;
    private currentScore: number = 0;
    scorePerLevel: number = 100;
    milestoneScore: number[] = [30, 65, 100];
    @property(Sprite)
    progressSprite: Sprite | null = null;
    @property(Sprite)
    progressBar: Sprite | null = null;
    // Node chứa các sao
    @property(Prefab)
    milestoneStarNode: Prefab | null = null;

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
      this.currentScore++;
      this.updateScoreLabel();
      this.updateProgressSprite();
      this.checkMilestoneStars();
    }

    resetScore() {
      this.currentScore = 0;
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
    placeMileStarNode() {
      if (!this.progressBar || !this.milestoneStarNode) return;

      const spriteWidth =
        this.progressBar.node.getComponent(UITransform)?.width || 0;

      console.log("spriteWidth", spriteWidth);
      // clear các sao cũ (nếu có)
      for (let i = 0; i < this.milestoneScore.length; i++) {
        const percent = this.milestoneScore[i] / this.scorePerLevel;
        const xPos = percent * spriteWidth - spriteWidth / 2;

        const starNode = instantiate(this.milestoneStarNode); // clone prefab sao
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

      console.log("Mile stars placed.");
    }

    checkMilestoneStars() {
      if (!this.progressBar) return;

      const stars = this.progressBar.node.children;

      // ⚠️ bỏ index 0 vì đó là progressSprite, sao bắt đầu từ index 1
      for (let i = 0; i < this.milestoneScore.length; i++) {
        const starNode = stars[i + 1];
        if (!starNode) continue;

        const starEmpty = starNode.getChildByName("StarEmpty");
        const starFilled = starNode.getChildByName("StarFilled");

        if (this.currentScore >= this.milestoneScore[i]) {
          if (starEmpty) starEmpty.active = false;
          if (starFilled) starFilled.active = true;
        } else {
          if (starEmpty) starEmpty.active = true;
          if (starFilled) starFilled.active = false;
        }
      }
    }
  }
