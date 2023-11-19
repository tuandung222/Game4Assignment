import { _decorator, Component, director, game, Input, input, Prefab, sys } from 'cc';
import { PlayerData } from '../framework/playerData';
import { AudioManager } from '../framework/audioManager';
import { GobeUtil } from '../core/gobeUtil';
import { UIManager } from '../framework/uiManager';
import { Constant } from '../framework/constant';
import { Util } from '../framework/util';
import { PREVIEW } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('Select')
export class Select extends Component {
    @property([Prefab])
    public backPrefabs: Prefab[] = [];

    start() {
        if(PlayerData.instance.isInit == false){
            game.frameRate = 30;
            AudioManager.instance.init();
            PlayerData.instance.loadFromCache();

            var playerId:string = PlayerData.instance.playerInfo['playerId'];
            if(playerId == null){
                playerId = "cocos" + (new Date().getTime()).toString().substring(6);
                var staticId:number = Math.floor(Math.random() * 2);
                PlayerData.instance.createPlayerInfo({
                    'playerId': playerId, 
                    "playerName": "", 
                    "score": 0, 
                    "icon": Math.floor(Math.random() * 10),
                    "staticId": staticId
                });
    
                Util.randomName(staticId).then((playerName)=>{
                    PlayerData.instance.updatePlayerInfo("playerName", playerName);
                })
            }

            //h5 Android 进入全屏模式
            if (!PREVIEW) {
                input.once(Input.EventType.TOUCH_END, () => {
                    if (sys.isBrowser && document.documentElement) {
                        let de = document.documentElement;
                        if (de.requestFullscreen) {
                            de.requestFullscreen();
                        } else if (de.mozRequestFullScreen) {
                            de.mozRequestFullScreen();
                        } else if (de.webkitRequestFullScreen) {
                            de.webkitRequestFullScreen();
                        }
                    }
                }, this);
            }
        }
        
        var ownPlayerId:string = GobeUtil.instance.ownPlayerId;
        if(ownPlayerId == ""){
            UIManager.instance.showDialog(Constant.PANEL_NAME.START_GAME);
        }else{
            UIManager.instance.showDialog(Constant.PANEL_NAME.SELECT_GAME);
        }
    }
}

