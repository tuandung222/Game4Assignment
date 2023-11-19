
import { _decorator, Component, Node, LabelComponent, AnimationComponent, SpriteComponent, SpriteFrame, Prefab, Label, Animation } from 'cc';
import { GobeUtil, WIFI_TYPE } from '../../core/gobeUtil';
import {ClientEvent }from '../../framework/clientEvent';
import { Constant } from '../../framework/constant';
import { ResourceUtil } from '../../framework/resourceUtil';
import { PoolManager } from '../../framework/poolManager';
import { EffectManager } from '../../framework/effectManager';
import { FighterModel } from '../../core/fighterModel';
import { PlayerInfo } from '../../libs/GOBE';
import { UIManager } from '../../framework/uiManager';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = Ready2
 * DateTime = Thu Sep 02 2021 17:35:37 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = ready2.ts
 * FileBasenameNoExtension = ready2
 * URL = db://assets/script/ui/ready/ready2.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
 
const MODEL_BOY: number = 0;
const MODEL_GIRL: number = 1;
@ccclass('Ready')
export class Ready extends Component {
    @property(AnimationComponent)
    animation: AnimationComponent = null!;

    @property([Node])
    aryPlayerWait: Node[] = [];

    @property([Node])
    aryPlayer: Node[] = [];

    @property([LabelComponent])
    aryPlayerName: LabelComponent[] = [];

    @property([SpriteComponent])
    aryPlayerHead: SpriteComponent[] = [];

    @property([SpriteFrame])
    aryHead: SpriteFrame[] = [];

    @property(Node)
    leftNode: Node = null!;

    @property(Node)
    rightNode: Node = null!;

    @property(Node)
    btnClose: Node = null!;
    
    @property(Label)
    txtNum:Label = null!;

    @property(Animation)
    vsAni:Animation = null!;

    @property(Node)
    girlNode: Node = null!;

    @property(Node)
    boyNode: Node = null!;

    private _vsNode: Node | null = null;

    private _isShowAni:boolean = false;

    private _isFightOpen:boolean = false;

    onEnable () {
        PoolManager.instance.putNode(this._vsNode as Node);
        ClientEvent.on(Constant.EVENT_NAME.ON_OTHER_JOIN_ROOM, this._onOtherJoinRoom, this);
    }

    onDisable () {
        this._cleanModel();
        ClientEvent.off(Constant.EVENT_NAME.ON_OTHER_JOIN_ROOM, this._onOtherJoinRoom, this);
    }

    show(isFight:boolean = false) {
        this._isFightOpen = isFight;
        this._isShowAni = false;
        this.txtNum.string = "房间号：" + GobeUtil.instance.room.roomCode;
        var count:number = this.aryPlayerHead.length;
        for(var index = 0; index < count; index ++){
            this._showPlayerReady(index, false);
        }

        this.animation.play();
        this.animation.once(Animation.EventType.FINISHED, () => {
            this._isShowAni = true;
            this._updatePlayerShow();
            this._checkStart();
        });

        this.vsAni.node.active = false;

        if(GobeUtil.instance.wifiType == WIFI_TYPE.STAND_ALONE){
            this.btnClose.active = false;
        }
    }

    /**
     * 退出组队
     */
    public onClose(){
        UIManager.instance.showDialog(Constant.PANEL_NAME.TIP_PANEL, [
            Constant.ROOM_TIPS.LEAVE_ROOM_MSG, ()=>{
                GobeUtil.instance.leaveRoom(()=>{
                    UIManager.instance.hideDialog(Constant.PANEL_NAME.READY);
                    UIManager.instance.showTips(Constant.ROOM_TIPS.LEAVE_ROOM_SUCCESS);

                    if(this._isFightOpen){
                        UIManager.instance.showTransition(Constant.SCENE_NAME.SLECT);
                    }
                },()=>{
                    UIManager.instance.showTips(Constant.ROOM_TIPS.LEAVE_ROOM_ERROR);
                }, 
                false);
            }]
        );
    }

    /**
     * 显示玩家
     * 
     * @param isOwn 
     * @returns 
     */
    private _updatePlayerShow(playerId?:string){
        var roomPlayers:PlayerInfo[] = GobeUtil.instance.roomPlayers;
        for (let idx = 0; idx < roomPlayers.length; idx++) {
            let player: PlayerInfo = roomPlayers[idx];
            if(playerId && playerId != ""){
                if( player.playerId == playerId){
                    let i = MODEL_BOY;
                    if (!GobeUtil.instance.checkIsRoomOwner(player.playerId)) {
                        i = MODEL_GIRL;
                    } 
        
                    this._showPlayerReady(i, true, player.customPlayerProperties);
                    this._showModel(i);
                }
            }else{
                let i = MODEL_BOY;
                if (!GobeUtil.instance.checkIsRoomOwner(player.playerId)) {
                    i = MODEL_GIRL;
                } 
    
                this._showPlayerReady(i, true, player.customPlayerProperties);
                this._showModel(i);
            }
        }
    }
    /**
     * 其他玩家加入房间
     */
    private _onOtherJoinRoom(playerId:string){
        this._updatePlayerShow(playerId);
        this._checkStart();
    }

    private _showPlayerReady (idx: number, isReady: boolean, playerName:string = "") {
        (this.aryPlayerHead[idx].node.parent as Node).active = isReady;
        this.aryPlayerName[idx].node.active = isReady;
        this.aryPlayer[idx].active = isReady;
        this.aryPlayerWait[idx].active = !isReady;
        
        if(playerName != ""){
            this.aryPlayerName[idx].string = playerName;
        }
    }

    private _showModel (idx: number) {
        let prefabName: string = Constant.READY_PREFAB.BOY_MODEL;
        let parent: Node = this.leftNode;
        if (idx === MODEL_GIRL) {
            parent = this.rightNode;
            prefabName = Constant.READY_PREFAB.GIRL_MODEL;
        }
        EffectManager.instance.playEffect(parent, Constant.READY_PREFAB.JOIN_EFFECT, true, true);
        if(idx === MODEL_GIRL){
            this.girlNode.active = true;
        }else{
            this.boyNode.active = true;
        }
    }

    private _cleanModel () {
        this.girlNode.active = false;
        this.girlNode.active = false;
    }

    private _checkStart(){
        if(!this._isShowAni){
            return;
        }

        var roomPlayers:PlayerInfo[] = GobeUtil.instance.roomPlayers;
        if (roomPlayers.length >= Constant.MIN_PLAYER) {
            UIManager.instance.hideDialog(Constant.PANEL_NAME.TIP_PANEL);
            UIManager.instance.hideDialog(Constant.PANEL_NAME.MEDIA_PANEL);

            GobeUtil.instance.mediaLeaveRoom();
            GobeUtil.instance.leaveChannel();
            
            this.animation.off(Animation.EventType.FINISHED);
            this.vsAni.node.active = true;
            this.vsAni.play();
            this.vsAni.once(AnimationComponent.EventType.FINISHED, () => {
                UIManager.instance.showTransition(Constant.SCENE_NAME.SLECT);
            })    
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
