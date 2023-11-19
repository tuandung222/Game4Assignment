import { _decorator, Node, Component, Animation, sp, sys, log} from 'cc';
import { UIManager } from '../../framework/uiManager';
import { Constant } from '../../framework/constant';
import { GobeUtil, WIFI_TYPE } from '../../core/gobeUtil';
import { PlayerData } from '../../framework/playerData';
import { Util } from '../../framework/util';
import { ClientEvent } from '../../framework/clientEvent';
const { ccclass, property } = _decorator;

@ccclass('StartPanel')
export class StartPanel extends Component {
    
    @property(sp.Skeleton)
    startSk:sp.Skeleton = null!;

    @property(Node)
    btnNode:Node = null!;

    @property(Node)
    btnNodeHw:Node = null!;

    @property(Animation)
    loadAni:Animation = null!;

    private _isClick:boolean = false;

    show(){
        this.loadAni.node.active = false;
        this.loadAni.stop();

        this.startSk.setAnimation(0, 'start', false);
        this.startSk.addAnimation(0, 'idle', true);

        this.btnNode.active = false;
        this.btnNodeHw.active = false;
       
        setTimeout(()=>{
            this.btnNode.active = true;

            if(GobeUtil.instance.isHwInit){
                this.btnNodeHw.active = true;
            }
        }, 1500);

        if(!GobeUtil.instance.isHwInit){
            GobeUtil.instance.initHuawei();
        }
    }

    protected onEnable(): void {
        ClientEvent.on(Constant.EVENT_NAME.HUAWEI_LOGIN_MSG, this._initSuccess, this);
    }

    protected onDisable(): void {
        ClientEvent.off(Constant.EVENT_NAME.HUAWEI_LOGIN_MSG, this._initSuccess, this);
    }

    private _initSuccess(code:number, msg:string){
        // 账号登录
        if(code == Constant.HUAWEI_LOGIN.SIGN_IN_SUCCESS){
            GobeUtil.instance.isHwLogin = true;
            this._loginGame();
        }else if(code == Constant.HUAWEI_LOGIN.INIT_SUCCESS){
            // 华为初始化
            this.btnNodeHw.active = true;
        }
        else if(code == Constant.HUAWEI_LOGIN.INIT_UNDER_AGE){
        }
        else if(code == Constant.HUAWEI_LOGIN.INIT_ERROR){
        }
        else if(code == Constant.HUAWEI_LOGIN.SIGN_IN_ERROR){
            UIManager.instance.showTips(Constant.ROOM_TIPS.HUA_WEI_LOAGIN_ERROR);
            this.loadAni.node.active = false;
            this.loadAni.stop();
            this._isClick = false;
        }
    }

    /**
     * 开始游戏
     * 
     * @returns 
     */
    public onStartGameHW(){
        if(this._isClick){
            return;
        }

        this._isClick = true;

        this.loadAni.node.active = true;
        this.loadAni.play();

        GobeUtil.instance.hwSignIn();
    }

    /**
     * 开始游戏
     * 
     * @returns 
     */
    public onStartGame(){
        if(this._isClick){
            return;
        }

        this._isClick = true;

        this.loadAni.node.active = true;
        this.loadAni.play();
        this._loginGame();
    }

    /**
     * 登录游戏
     */
    private _loginGame(){
        if(!GobeUtil.instance.isChangeWifiType){
            GobeUtil.instance.createRoomAI(()=>{
                UIManager.instance.showDialog(Constant.PANEL_NAME.READY);
            },()=>{
                UIManager.instance.showTips(Constant.ROOM_TIPS.CREATE_ROOM_ERROR);
            });
        }else{
            // 登录
            var playerId:string = PlayerData.instance.playerInfo['playerId'];
            GobeUtil.instance.initSDK(playerId, (successInit:boolean)=>{
                if(successInit){
                    UIManager.instance.showDialog(Constant.PANEL_NAME.SELECT_GAME);
                    UIManager.instance.hideDialog(Constant.PANEL_NAME.START_GAME);
                }else{
                    UIManager.instance.showTips(Constant.ROOM_TIPS.LOGIN_GAME_ERROR);
                }

                this.loadAni.node.active = false;
                this.loadAni.stop();
                this._isClick = false;
            });
        }
    }
}

