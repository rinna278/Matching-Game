import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SettingButton')
export class SettingButton extends Component {
    @property(Node)
    settingMenu:Node |null = null;

    showSettingMenu(){
        if(this.settingMenu)
            this.settingMenu.active = true;
        console.log("show settingmenu successfully")
    }

    hideSettingMenu(){
        if(this.settingMenu)
            this.settingMenu.active = false;
        console.log("hide settingMenu successfully")
    }
}


