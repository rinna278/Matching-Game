import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PauseButton')
export class PauseButton extends Component {
    @property(Node)
    pauseMenu: Node | null = null;

    private isPaused: boolean = false;

    onClickPause() {
        if (!this.pauseMenu) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // dừng game
            director.pause();
            this.pauseMenu.active = true;
        } else {
            // tiếp tục game
            director.resume();
            this.pauseMenu.active = false;
        }
    }

    onResume() {
        this.isPaused = false;
        director.resume();
        if (this.pauseMenu) {
            this.pauseMenu.active = false;
        }
    }

    onRestart() {
        director.resume();
        director.loadScene(director.getScene().name);
    }

    onQuit() {
        director.resume();
        director.loadScene("MainMenu");
    }
}


