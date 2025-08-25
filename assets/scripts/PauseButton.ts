import { _decorator, Component, Node, director, game, Label } from 'cc';
const { ccclass, property } = _decorator;
import { GameManager, GameState } from './GameManager';
import { Map } from './Map';
import { ClockLabel } from './ClockLabel';


@ccclass('PauseButton')
export class PauseButton extends Component {
    @property(Node)
    pauseMenu: Node | null = null;

    @property(Map)
    map: Map | null = null;

    @property(ClockLabel)
    clock: ClockLabel | null = null;

    handlePopup() {
        GameManager.isPaused() ? this.pauseMenu!.active = true : this.pauseMenu!.active = false;
        this.handleTime();
    }

    handleTime(){
        if(GameManager.isPaused()){
            this.clock.pauseClock();
        }
        else{
            this.clock.resumeClock();
        }
    }
    onClickPause() {
        if (!this.pauseMenu) return;

         if (GameManager.isPaused()) {
            // Resume
            GameManager.setState(GameState.Playing);
            this.handlePopup();
        } else {
            // Pause
            GameManager.setState(GameState.Paused);
            this.handlePopup();
        }
    }

    onResume() {
        GameManager.setState(GameState.Playing);
        this.handlePopup();
    }

    onRestart() {
        GameManager.setState(GameState.Playing);
        this.map.resetMap();
        this.handlePopup();
        this.clock.resetClock();
    }

    // onQuit() {
    //     director.resume();
    //     director.loadScene("MainMenu");
    // }

}


