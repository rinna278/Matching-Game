import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayButton')
export class PlayButton extends Component {
    startGame() {
        console.log("loading........");
        director.loadScene("GamePlay");
    }
}


