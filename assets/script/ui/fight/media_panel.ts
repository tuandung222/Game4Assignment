import { _decorator, Component, Node} from 'cc';
import { GobeUtil } from '../../core/gobeUtil';
import { Constant } from '../../framework/constant';
import { ClientEvent } from '../../framework/clientEvent';
import { UIManager } from '../../framework/uiManager';
const { ccclass, property } = _decorator;

@ccclass('MediaPanel')
export class MediaPanel extends Component {

    @property(Node)
    public mediaOpen:Node = null!;

    @property(Node)
    public mediaClose:Node = null!;

    @property(Node)
    public micClose:Node = null!;

    @property(Node)
    public micOpen:Node = null!;

    @property(Node)
    public noMessageOpen:Node = null!;

    @property(Node)
    public messageClose:Node = null!;

    @property(Node)
    public messageOpen:Node = null!;

    private _isOpenMessage:boolean = false; // message界面开启
    private _isFirstOpenM:boolean = true; // 是否第一次开启

    onEnable(): void {
        ClientEvent.on(Constant.EVENT_NAME.SEND_MSG, this._onSendMsg, this);
        ClientEvent.on(Constant.EVENT_NAME.OPEN_MEDIA, this._openMedia, this);
        ClientEvent.on(Constant.EVENT_NAME.OPEN_CHANNEL, this._openChannel, this);
    }

    onDisable(): void {
        ClientEvent.off(Constant.EVENT_NAME.SEND_MSG, this._onSendMsg, this);
        ClientEvent.off(Constant.EVENT_NAME.OPEN_MEDIA, this._openMedia, this);
        ClientEvent.off(Constant.EVENT_NAME.OPEN_CHANNEL, this._openChannel, this);
    }

    private _openMedia(){
        if(GobeUtil.instance.isOpenMedia){
            this.mediaClose.active = true;
            this.mediaOpen.active = false;
    
            this.micClose.active = true;
            this.micOpen.active = false;
        }else{
            this.mediaClose.active = false;
            this.mediaOpen.active = false;

            this.micClose.active = false;
            this.micOpen.active = false;
        }
    }

    private _openChannel(){
        if(GobeUtil.instance.isChannelId){
            this.noMessageOpen.active = true;
            this.messageClose.active = false;
            this.messageOpen.active = false;
        }
        else{
            this.noMessageOpen.active = false;
            this.messageClose.active = false;
            this.messageOpen.active = false;
        }
    }

    show() {
        this._isFirstOpenM = true;
        this.mediaClose.active = false;
        this.mediaOpen.active = false;

        this.micClose.active = false;
        this.micOpen.active = false;

        this.noMessageOpen.active = false;
        this.messageClose.active = false;
        this.messageOpen.active = false;
    }

    /**
     * 打开语音
     */
    public onClickOpenMedia(){
        GobeUtil.instance.mediaMuteAllPlayers(true);

        this.mediaClose.active = false;
        this.mediaOpen.active = true;
    }

    /**
     * 关闭语音
     */
    public onClickCloseMedia(){
        GobeUtil.instance.mediaMuteAllPlayers(false);

        this.mediaClose.active = true;
        this.mediaOpen.active = false;
    }

    /**
     * 开启四周音
     */
    public onOpenMic(){
        GobeUtil.instance.mediaEnableMic(true);
        this.micClose.active = false;
        this.micOpen.active = true;
    }

    /**
     * 关闭四周音
     */
    public onCloseMic(){
        GobeUtil.instance.mediaEnableMic(false);
        this.micClose.active = true;
        this.micOpen.active = false;
    }
    
    
    public onOpenMessage(){
        this._isOpenMessage = true;
        UIManager.instance.showDialog(Constant.PANEL_NAME.MESSAGE_PANEL, [this._isFirstOpenM]);
        this.messageClose.active = true;
        this.noMessageOpen.active = false;
        this.messageOpen.active = false;

        this._isFirstOpenM = false;
    }

    public onCloseMessage(){
        this._isOpenMessage = false;
        UIManager.instance.hideDialog(Constant.PANEL_NAME.MESSAGE_PANEL);
        this.messageClose.active = false;
        this.noMessageOpen.active = true;
        this.messageOpen.active = false;
    }

    private _onSendMsg(msg:string){
        if(msg != "" && !this._isOpenMessage){
            this.noMessageOpen.active = false;
            this.messageOpen.active = true;
        }
    }

}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.3/manual/zh/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.3/manual/zh/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.3/manual/zh/scripting/life-cycle-callbacks.html
 */
