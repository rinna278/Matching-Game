import { _decorator, Component, Node, director, game, Label } from 'cc';
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
        if (this.pauseMenu) {
            this.pauseMenu.active = GameManager.isPaused();
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