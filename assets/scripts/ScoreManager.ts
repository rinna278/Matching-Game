import { _decorator, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScoreManager')
export class ScoreManager extends Component {
    @property(Label)
    scoreLabel: Label | null = null;
    private currentScore: number = 0;
    scorePerLevel: number = 100;

    @property(Sprite)
    progressSprite: Sprite | null = null;
    start() {
        this.resetScore();
    }

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
    }

    resetScore() {
        this.currentScore = 0;
        this.updateScoreLabel();
        this.updateProgressSprite();
    }

    getScore() {
        return this.currentScore;
    }
}


