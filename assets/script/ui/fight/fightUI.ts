import { _decorator, Component, Node, LabelComponent, SpriteFrame, SpriteComponent} from 'cc';
import { GameState, Player } from '../../core/gameState';
import { GobeUtil, ROOM_TYPE } from '../../core/gobeUtil';
import {Util} from '../../framework/util';
import { Constant } from '../../framework/constant';
import { ClientEvent } from '../../framework/clientEvent';
import { ResourceUtil } from '../../framework/resourceUtil';
import { DisplayManager } from '../../core/displayManager';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = FightUI2
 * DateTime = Mon Sep 06 2021 15:55:45 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = fightUI2.ts
 * FileBasenameNoExtension = fightUI2
 * URL = db://assets/script/ui/fight/fightUI2.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
 const MODEL_BOY: number = 0;//蓝色房主
 const MODEL_GIRL: number = 1;
@ccclass('FightUI')
export class FightUI extends Component {
    @property([LabelComponent])
    public aryPlayerDelay: LabelComponent[] = [];

    @property([LabelComponent])
    public aryPlayerScore: LabelComponent[] = [];

    @property([Node])
    public aryPlayerNode: Node[] = [];

    @property([SpriteComponent])
    public aryPlayerHead: SpriteComponent[] = [];

    @property([SpriteFrame])
    public aryHead: SpriteFrame[] = [];

    @property(LabelComponent)
    public lbCountDown: LabelComponent = null!;

    @property([Node])
    public ringNode: Node[] = [];

    private _parent: DisplayManager = null!;

    show(parent: DisplayManager) {
        this.lbCountDown.string = Util.formatTimeForSecond(60, true);
        this._parent = parent;
        let gameState: GameState = this._parent.logicManager.currentGameState;
        let players: Array<Player> = gameState.players;
        for (let idx = 0; idx < players.length; idx++) {
            let player: Player = players[idx];
            if (!player.channel) {
                this.aryPlayerNode[idx].active = false;
            } else {
                this.aryPlayerNode[idx].active = true;
                let i = MODEL_BOY;
                if (!GobeUtil.instance.checkIsRoomOwner(player.channel.openId)) {
                    i = MODEL_GIRL;
                }
                if (player.channel.headUrl && player.channel.headUrl.length) {
                    ResourceUtil.loadSpriteFrameURL(player.channel.headUrl, this.aryPlayerHead[i]);
                } else {
                    this.aryPlayerHead[i].spriteFrame = this.aryHead[i];
                }
            }
        }

        var isRoomOwner:boolean = GobeUtil.instance.checkIsRoomOwner(GobeUtil.instance.ownPlayerId);
        this.ringNode[0].active = isRoomOwner;
        this.ringNode[1].active = !isRoomOwner;

        ClientEvent.dispatchEvent(Constant.EVENT_NAME.GAME_INIT);
    }

    private _updatePlayerState() {
        if (GobeUtil.instance.room 
            && GobeUtil.instance.roomType != ROOM_TYPE.START) {
            return;
        }
        
        let gameState: GameState = this._parent.logicManager.currentGameState;
        let players: Array<Player> = gameState.players;
        for (let idx = 0; idx < players.length; idx++) {
            let player: Player = players[idx];
            if (player.channel) {
                let i = MODEL_BOY;
                if (!GobeUtil.instance.checkIsRoomOwner(player.channel.openId)) {
                    i = MODEL_GIRL;
                }

                this.aryPlayerScore[i].string = `${player.score}`;
                // this.aryPlayerDelay[i].string = `${player.channel.delayTime}ms`;
            }
        }

        let curTime = gameState.time > 0 ? gameState.time : 0;
        if(curTime > Constant.GAME_TIME){
            curTime = Constant.GAME_TIME;
        }
        this.lbCountDown.string = Util.formatTimeForSecond(curTime, true);
    }
    
    lateUpdate (deltaTime: number) {
        this._updatePlayerState();
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
