import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LevelUI')
export class LevelUI extends Component {
    @property(Label)
    levelLabel: Label | null = null;

    setLevel(level: number) {
        if (this.levelLabel) {
            this.levelLabel.string = `${level}`;
        }
    }
}


