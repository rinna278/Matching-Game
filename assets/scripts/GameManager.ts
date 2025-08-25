import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;


export enum GameState {
    Playing,
    Paused,
    GameOver,
    MainMenu,
}

@ccclass('GameManager')
export class GameManager extends Component {
    private static _state: GameState = GameState.Playing;

    static get state() {
        return this._state;
    }

    static setState(newState: GameState) {
        this._state = newState;
        console.log("Game state changed to:", GameState[newState]);
    }

    static isPaused() {
        return this._state === GameState.Paused;
    }
}
