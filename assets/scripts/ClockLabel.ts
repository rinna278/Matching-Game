import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ClockLabel')
export class ClockLabel extends Component {

    @property(Label)
    countdownLabel: Label | null = null;
    @property
    startTime: number = 20;   // số giây bắt đầu

    private currentTime: number = 0;

    start() {
        this.resetClock();
    }

    private tick = () => {   // dùng arrow function để giữ context "this"
        if (this.currentTime > 0) {
            this.currentTime--;
            this.updateLabel();
        } else {
            this.unschedule(this.tick);
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
        this.updateLabel();
        this.unschedule(this.tick);
        this.schedule(this.tick, 1);
    }

    pauseClock() {
        this.unschedule(this.tick);
    }
    resumeClock() {
        this.schedule(this.tick, 1);
    }
}


