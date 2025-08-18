import { _decorator, Component, Node, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Tile')
export class Tile extends Component {
    @property(SpriteFrame)
    spriteFrame: SpriteFrame | null = null;
    public id: number = -1;
    public isRemoved: boolean = false;
}


