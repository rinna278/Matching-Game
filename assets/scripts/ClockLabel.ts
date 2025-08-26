import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;
import { GameManager, GameState } from './GameManager';

@ccclass('ClockLabel')
export class ClockLabel extends Component {

    @property(Label)
    countdownLabel: Label | null = null;
    @property
    startTime: number = 20;   // số giây bắt đầu

    private currentTime: number = 0;
    private accumulatedTime: number = 0; // Thời gian tích lũy

    start() {
        this.resetClock();
    }

    update(dt: number) {
        if (GameManager.isPaused() || this.currentTime <= 0) {
            return;
        }

        this.accumulatedTime += dt;
        
        // Mỗi khi tích lũy đủ 1 giây thì giảm thời gian
        if (this.accumulatedTime >= 1.0) {
            this.currentTime--;
            this.accumulatedTime -= 1.0; // Giữ lại phần dư 
            this.updateLabel();

            if (this.currentTime <= 0) {
            }
        }
    }

    updateLabel() {
        if (this.countdownLabel) {
            const m = Math.floor(this.currentTime / 60);
            const s = this.currentTime % 60;
            this.countdownLabel.string = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }
    }

    resetClock() {
        this.currentTime = this.startTime;
        this.accumulatedTime = 0;
        this.updateLabel();
    }
}