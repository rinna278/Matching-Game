import { _decorator, Component, Node, Skeleton, sp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SpineWin')
export class SpineWin extends Component {
    @property(sp.Skeleton)
    skeleton: sp.Skeleton | null = null;
    start() {
        if(this.skeleton){
            this.skeleton.setAnimation(0,"Start", false);
            this.skeleton.addAnimation(0,"Loop", true, 0);
        }

    }

}


