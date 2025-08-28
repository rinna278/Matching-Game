import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MainScene')
export class MainScene extends Component {
    onLoad() {
        // Preload GamePlay ngay khi Home vừa load xong
        director.preloadScene("GamePlay", 
            (completedCount, totalCount, item) => {
                const percent = Math.floor((completedCount / totalCount) * 100);
                console.log(`Preloading GamePlay: ${percent}%`);
            }, 
            () => {
                console.log("✅ GamePlay scene preloaded!");
            }
        );
    }
}


