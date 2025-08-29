import { _decorator, Component, Node, director, game, Label, tween, UIOpacity, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { GameManager, GameState } from './GameManager';
import { Map } from './Map';
import { ClockLabel } from './ClockLabel';
import { ScoreManager } from './ScoreManager';

@ccclass('PauseButton')
export class PauseButton extends Component {
    @property(Node)
    pauseMenu: Node | null = null;

    @property(Map)
    map: Map | null = null;

    @property(ClockLabel)
    clock: ClockLabel | null = null;

    @property(ScoreManager)
    scoreManager: ScoreManager | null = null;
    
    handlePopup() {
        if(!this.pauseMenu) {
            console.log("Dont have pauseMenu")
            return;
        }
        const wantShow = GameManager.isPaused();

        if (wantShow) {
            this.pauseMenu.active = true; // bật node trước
            this.pauseMenu.scale = new Vec3(0, 0, 0); // thu nhỏ ban đầu

            tween(this.pauseMenu)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: "backOut" })
                .start();

            // Nếu muốn fade in thì thêm UIOpacity
            const opacity = this.pauseMenu.getComponent(UIOpacity) || this.pauseMenu.addComponent(UIOpacity);
            opacity.opacity = 0;
            tween(opacity)
                .to(0.3, { opacity: 255 })
                .start();

        } else {
            // Tween thu nhỏ lại rồi mới tắt
            tween(this.pauseMenu)
                .to(0.2, { scale: new Vec3(0, 0, 0) }, { easing: "backIn" })
                .call(() => {
                    this.pauseMenu!.active = false; // tắt sau khi tween xong
                })
                .start();

            const opacity = this.pauseMenu.getComponent(UIOpacity)!;
            tween(opacity)
                .to(0.2, { opacity: 0 })
                .start();
        }
    }

    onClickPause() {
        if (!this.pauseMenu) return;
        GameManager.setState(GameState.Paused);
        this.handlePopup();
    }

    onResume() {
        GameManager.setState(GameState.Playing);
        this.handlePopup();
    }

    onRestart() {
        GameManager.setState(GameState.Playing);
        if (this.map) {
            this.map.resetMap();
        }
        if (this.clock) {
            this.clock.resetClock();
        }
        if(this.scoreManager){
            this.scoreManager.resetScore();
        }
        this.handlePopup();
    }

    onQuit() {
        director.resume();
        director.loadScene("Home");
    }
}