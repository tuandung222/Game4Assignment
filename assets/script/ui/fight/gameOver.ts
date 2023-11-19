
import { _decorator, Component, Node, LabelComponent, SpriteComponent, SpriteFrame, Prefab, AnimationComponent, AnimationClip, Animation, sys } from 'cc';
import { DisplayManager } from '../../core/displayManager';
import { FighterModel } from '../../core/fighterModel';
import { UIManager } from '../../framework/uiManager';
import { AudioManager } from '../../framework/audioManager';
import { Constant } from '../../framework/constant';
import { Player } from '../../core/gameState';
import { ResourceUtil } from '../../framework/resourceUtil';
import { PoolManager } from '../../framework/poolManager';
import { GobeUtil, WIFI_TYPE } from '../../core/gobeUtil';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = GameOver2
 * DateTime = Wed Sep 08 2021 19:12:52 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = gameOver2.ts
 * FileBasenameNoExtension = gameOver2
 * URL = db://assets/script/ui/fight/gameOver2.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
const MODEL_BOY: number = 0;
const MODEL_GIRL: number = 1;
@ccclass('gameOver')
export class GameOver extends Component {
    @property([Node])
    aryNodeWin: Node[] = [];

    @property([LabelComponent])
    aryLbScore: LabelComponent[] = [];

    @property([LabelComponent])
    aryLbName: LabelComponent[] = [];

    @property([SpriteComponent])
    arySpIcon: SpriteComponent[] = [];

    @property([SpriteFrame])
    aryHead: SpriteFrame[] = [];
    
    @property(Node)
    leftNode: Node = null!;

    @property(Node)
    rightNode: Node = null!;

    @property(Animation)
    winAni: Animation = null!;
    
    @property(Node)
    btnAgc: Node = null!;

    private _parent: DisplayManager = null!;
    private _girlNode: Node | null = null;
    private _boyNode: Node | null = null;

    onDisable () {
        this._cleanModel();
        this.winAni.stop();
        this.winAni.node.active = false;

        UIManager.instance.hideDialog(Constant.PANEL_NAME.FIGHT_UI);
    }

    public show (parent: DisplayManager, winner: number) {
        this.winAni.stop();
        this.winAni.node.active = false;

        this._parent = parent;
        let players: Player[] = parent.logicManager.currentGameState.players;
        if(players.length < 2){
            return;
        }

        AudioManager.instance.stop(Constant.AUDIO_NAME.BACKGROUND);
        AudioManager.instance.playSound(Constant.AUDIO_NAME.WIN);
        for (let pos in players) {
            let player: Player = players[pos];
            if (player.channel) {
                let i = MODEL_BOY;
                if (!GobeUtil.instance.checkIsRoomOwner(player.channel.openId)) {
                    i = MODEL_GIRL;
                }
                if (parseInt(pos) === winner) {
                    this.winAni.node.setPosition(this.aryNodeWin[i].position);
                    this.winAni.node.active = true;
                    let aniStateIn = this.winAni.getState("leaveWinAniIn");
                    if (aniStateIn) {
                        aniStateIn.time = 0;
                        aniStateIn.sample();
                        this.winAni.play("leaveWinAniIn");
                        aniStateIn.wrapMode = AnimationClip.WrapMode.Normal;
                    }

                    this.winAni.once(AnimationComponent.EventType.FINISHED, ()=>{
                        let aniStateIdle = this.winAni.getState("leaveWinAniIdle");
                        if (aniStateIdle) {
                            aniStateIdle.time = 0;
                            aniStateIdle.sample();
                            this.winAni.play("leaveWinAniIdle");
                            aniStateIdle.wrapMode = AnimationClip.WrapMode.Loop;
                        }
                    })                
                }
                
                this._showModel(i, winner == -1 ? true : parseInt(pos) === winner);
                this.aryLbScore[i].string = player.score + '';
                this.aryLbName[i].string = player.channel.name;

                if (player.channel.headUrl && player.channel.headUrl.length) {
                    ResourceUtil.loadSpriteFrameURL(player.channel.headUrl, this.arySpIcon[i]);
                } else {
                    this.arySpIcon[i].spriteFrame = this.aryHead[i];
                }
            }  
        }

        GobeUtil.instance.leaveRoom();

        // 开启内置社区
        this.btnAgc.active = GobeUtil.instance.isOpenPgs && GobeUtil.instance.isHwLogin;
    }

    /**
     * 重新开始
     */
    onAgainBtnClick() {
        UIManager.instance.showDialog(Constant.PANEL_NAME.MATCH_PANEL, [], ()=>{}, true);
        if(GobeUtil.instance.wifiType == WIFI_TYPE.WIFI){
            GobeUtil.instance.matchRoom(()=>{
                UIManager.instance.hideDialog(Constant.PANEL_NAME.MATCH_PANEL);
                UIManager.instance.hideDialog(Constant.PANEL_NAME.GAME_OVER);
                UIManager.instance.showDialog(Constant.PANEL_NAME.READY, [true]);
                this._parent.reset();
            }, ()=>{
                UIManager.instance.showTips(Constant.ROOM_TIPS.MATCH_ROOM_ERROR);
                UIManager.instance.hideDialog(Constant.PANEL_NAME.MATCH_PANEL);
            });
        }else{
            GobeUtil.instance.createRoomAI(()=>{
                UIManager.instance.hideDialog(Constant.PANEL_NAME.MATCH_PANEL);
                UIManager.instance.hideDialog(Constant.PANEL_NAME.GAME_OVER);
                UIManager.instance.showDialog(Constant.PANEL_NAME.READY, [true]);
                this._parent.reset();
            }, ()=>{
                UIManager.instance.showTips(Constant.ROOM_TIPS.MATCH_ROOM_ERROR);
                UIManager.instance.hideDialog(Constant.PANEL_NAME.MATCH_PANEL);
            })
        }
    }

    /**
     * 离开场景
     */
    onClickLeave(){
        if(!GobeUtil.instance.isChangeWifiType){
            UIManager.instance.showDialog(Constant.PANEL_NAME.TIP_PANEL, [Constant.ROOM_TIPS.LEAVE_GAME, ()=>{
                GobeUtil.instance.leaveGame();
                UIManager.instance.hideDialog(Constant.PANEL_NAME.GAME_OVER);
                UIManager.instance.showTransition(Constant.SCENE_NAME.SLECT);
            }],()=>{},true);
        }else{
            this._parent.reset();
            UIManager.instance.showTips(Constant.ROOM_TIPS.LEAVE_ROOM_SUCCESS);
            UIManager.instance.hideDialog(Constant.PANEL_NAME.GAME_OVER);
            UIManager.instance.showTransition(Constant.SCENE_NAME.SLECT);
        }
    }

    onClickAgc(){
        GobeUtil.instance.forumPagePublish();
        GobeUtil.instance.leaveRoom();
    }

    private _showModel (idx: number, isWin: boolean) {
        let prefabName: string = Constant.READY_PREFAB.BOY_MODEL;
        let parent: Node = this.leftNode;
        if (idx === MODEL_GIRL) {
            parent = this.rightNode;
            prefabName = Constant.READY_PREFAB.GIRL_MODEL;
        }
        if ((idx === MODEL_GIRL? this._girlNode : this._boyNode) === null) {
            ResourceUtil.getUIPrefabRes(prefabName, (err: {}, prefab: Prefab) =>{
                if ((idx === MODEL_GIRL? this._girlNode : this._boyNode) === null) {
                    let node: Node = PoolManager.instance.getNode(prefab, parent);
                    let fighterModel: FighterModel = node.getComponent(FighterModel) as FighterModel;
                    if (isWin) {
                        fighterModel.playAni(Constant.ANI_TYPE.VICTORY, true, false, ()=>{}, 13);
                    } else {
                        fighterModel.playAni(Constant.ANI_TYPE.LOSE, false, false, ()=>{
                            fighterModel.playAni(Constant.ANI_TYPE.LOSE_1, true, false, ()=>{}, 15);
                        }, 14);
                    }
                    if (idx === MODEL_GIRL) {
                        this._girlNode = node;
                    } else {
                        this._boyNode = node;
                    }
                }
            });
        }
    }
    
    private _cleanModel () {
        PoolManager.instance.putNode(this._girlNode as Node);
        this._girlNode = null;
        PoolManager.instance.putNode(this._boyNode as Node);
        this._boyNode = null!;
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
