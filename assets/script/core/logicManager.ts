import { DisplayManager } from './displayManager';
import { _decorator, Component, Vec3, find, log} from 'cc';
import {ClientEvent} from '../framework/clientEvent';
import { Constant } from '../framework/constant';
import { GameState, Player, Channel, PropType} from './gameState';
import { PlayerLogic } from './playerLogic';
import { PropLogic } from './propLogic';
import { Util } from '../framework/util';
import { FrameInfo, PlayerInfo, RecvFrameMessage } from '../libs/GOBE';
import { GobeUtil, ROOM_TYPE, WIFI_TYPE } from './gobeUtil';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = LogicManager
 * DateTime = Wed Sep 01 2021 17:31:10 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = logicManager.ts
 * FileBasenameNoExtension = logicManager
 * URL = db://assets/script/fight/logicManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
@ccclass('LogicManager')
export class LogicManager extends Component {

    @property(PlayerLogic)
    public playerLogic: PlayerLogic = null!;

    @property(PropLogic)
    public propLogic: PropLogic = null!;
    
    public currentGameState: GameState = {} as GameState;
    public get scriptDisplayManager () {
        return find("display")?.getComponent(DisplayManager) as DisplayManager;
    }

    private _arrayGameState: {[index: number]: GameState} = [];
    private _startGameTime: number = 0;
    private _isGameing: boolean = false;

    start () {
        this._onGetRoomInfo();
        this.playerLogic.init(this);
        this.propLogic.init(this);
    }

    onEnable () {
        ClientEvent.on(Constant.EVENT_NAME.ON_GAME_START, this._onStartGame, this);
        ClientEvent.on(Constant.EVENT_NAME.ON_GAME_END, this._onEndGame, this);
        ClientEvent.on(Constant.EVENT_NAME.CREATE_HAMMER, this._onCreateHammer, this);
    }

    onDisable () {
        ClientEvent.off(Constant.EVENT_NAME.ON_GAME_START, this._onStartGame, this);
        ClientEvent.off(Constant.EVENT_NAME.ON_GAME_END, this._onEndGame, this);
        ClientEvent.off(Constant.EVENT_NAME.CREATE_HAMMER, this._onCreateHammer, this);
    }

    private _onEndGame(){
        if(this._isGameing){
            this._isGameing = false;
            GobeUtil.instance.finishGame();
        }
    }

    /**
     * 设置第0帧数据
     */
    public setDefaultGameState() {
        this._arrayGameState = [];   
        this.playerLogic.reset();
        this.propLogic.reset();     
        this.currentGameState.id = 0;
        this.currentGameState.props = this.propLogic.initProps(); 
        this.currentGameState.players = this.playerLogic.initPlayer();
        this.currentGameState.frameTime = Date.now();
        this.currentGameState.createHammerTime = Constant.GAME_TIME - Constant.HAMMER_TIME;
        this._frameIndex = 0;
    }

     /**
     * 收到房间信息
     */
    private _onGetRoomInfo() {
        let playerList: PlayerInfo[] = GobeUtil.instance.roomPlayers;
        let players: Array<Player> = this.currentGameState.players;
        playerList.forEach((value: PlayerInfo, index: number) => {
            var pIndex:number = 0;
            if(!GobeUtil.instance.checkIsRoomOwner(value.playerId)){
                pIndex = 1;
            }
            let player: Player = players[pIndex];
            if (!player.channel) player.channel = {} as Channel;
            player.channel.openId = value.playerId;
            player.channel.name = value.customPlayerProperties as string;
            player.channel.state = value.customPlayerStatus as number;
            player.channel.delayTime = 0;
        });

        ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_GAME_READY);
    }

     /**
     * 开始帧同步操作
     */
    private _onStartGame() {
        this._isGameing = true;
        this._startGameTime = JSON.parse(GobeUtil.instance.room.customRoomProperties)["time"];
        this._arrayGameState[0] = Util.clone(this.currentGameState);

        let gameState: GameState = this.currentGameState;
        let players: Array<Player> = gameState.players;
        this.playerLogic.updatePlayerNode(players);
    }
    /**
     * 创建锤子
     * 
     * @param hammerId 
     */
    private _onCreateHammer(pos:number[]){
        this.currentGameState.props[this.propLogic.indexProp] = 
            this.propLogic.generateProp(new Vec3(pos[0], pos[1], pos[2]), 1, PropType.HAMMER);
        this.propLogic.indexProp++;
    }

    public checkIsReCovery(){
        if(GobeUtil.instance.isDisJoin){
            this._handleAction(()=>{
                this.scriptDisplayManager.updateStateRecovery(this.currentGameState);
                this.playerLogic.updateStateRecovery();
                this.scriptDisplayManager.updateProp(this.currentGameState);
            });
        }
    }

     /**
     * 创建金币
     * 
     * @param hammerId 
     */
    public onCreateCoin(pos:number[][]){
        this.propLogic.createCoinServer(pos);
    }

    lateUpdate(dt: number): void {
        if (GobeUtil.instance.room && GobeUtil.instance.roomType != ROOM_TYPE.START
            || !this._isGameing) {
                // this.scriptDisplayManager.updateState(0.1, this.currentGameState, true);
            return;
        }

        this._handleAction();

        var frameTime : number = GobeUtil.instance.time + GobeUtil.instance.serverTimeDis;
        this.currentGameState.time = Math.floor(Constant.GAME_TIME - (frameTime - this._startGameTime) / 1000);
        if (this.currentGameState.time <= 0) {
            this._isGameing = false;
            GobeUtil.instance.finishGame();
        }

        this.playerLogic.updateState();
        this.scriptDisplayManager.updateOwnState(this.currentGameState, dt);
        this.scriptDisplayManager.updateState(dt, this.currentGameState, false);

        this._checkPlayerScoreLead();
        //生成锤子
        if (this.currentGameState.createHammerTime == 0) {
            this.currentGameState.createHammerTime = this.currentGameState.time - Constant.HAMMER_TIME;
            console.log("aaaaa", this.currentGameState.createHammerTime);
        }

        if((!GobeUtil.instance.isRoomOwnIn && !GobeUtil.instance.checkIsRoomOwner(GobeUtil.instance.ownPlayerId))
         || GobeUtil.instance.checkIsRoomOwner(GobeUtil.instance.ownPlayerId)){
            if (this.currentGameState.time < this.currentGameState.createHammerTime) {
                console.log("aaaaaa", this.currentGameState.time, this.currentGameState.createHammerTime);
                this.currentGameState.createHammerTime = this.currentGameState.time - Constant.HAMMER_TIME;
                GobeUtil.instance.createHammer(this.currentGameState.time - Constant.HAMMER_TIME);
            }
        }
    }

    /**
     * 设置分数领先的玩家
     */
    private _checkPlayerScoreLead () {
        let maxScoreIdx = -1;
        let maxScore: number = 0;

        for (let idx in this.currentGameState.players) {
            let player: Player = this.currentGameState.players[idx];
            if (player.channel) {
                if (maxScore < player.score) {
                    maxScore = player.score;
                }
            }  
        }

        //初始分数都为零则不设置谁领先
        if (maxScore === 0) {
            return;
        }

        //筛选出分数相同的玩家
        let arrMaxScorePlayer = this.currentGameState.players.filter((player: Player)=>{
            return player.score === maxScore;
        })

        // 玩家分数得超越另一位才能标记分数领先
        for (let index = 0; index < arrMaxScorePlayer.length; index++) {
            const player = arrMaxScorePlayer[index];
            if (player.isScoreLead) {
                maxScoreIdx = player.id;
                break;
            }
        }

        if (maxScoreIdx === -1) {
            maxScoreIdx = arrMaxScorePlayer[0].id;
        }        

        this.currentGameState.players.forEach((player: Player)=>{
            player.isScoreLead = player.id === maxScoreIdx;
        })
    }

    private _frameIndex:number = 0;

    private _isAiHit:boolean = false;

    /**
     * 处理玩家操作
     * @param frame 帧数据
     */
    private _handleAction(callback:Function = null) {
        if(this._frameIndex > GobeUtil.instance.currFrame){
            return;
        }

        var frames : FrameInfo[] = [];
        if(GobeUtil.instance.recvMap.has(this._frameIndex)){
            frames = GobeUtil.instance.recvMap.get(this._frameIndex);
            this._frameIndex ++;
        }
        else{
            this._frameIndex ++;
        }

        for(var index:number = 0; index < frames.length; index ++){
            let playerId: string = frames[index].playerId;
            let players: Array<Player> = this.currentGameState.players;
            let result = players.filter((value: Player) => {
                return value.channel && value.channel.openId === playerId;
            });
            if (!result.length) return;
            var msg:string = frames[index].data[0];
            let data: {A: number, V: number, I: string, X: number, Z: number, AI: number, Y:number, MX:number, MY:number, T:number} = JSON.parse(msg);
            switch(data.A) {
                case Constant.ACTION.RUN:
                    this.scriptDisplayManager.updateRun(playerId, this.currentGameState);
                    break;
                case Constant.ACTION.IDLE:
                    this.scriptDisplayManager.updateIdle(playerId, this.currentGameState);
                    break;
                case Constant.ACTION.MOVE:
                    if(data.AI == 1){
                        players[Constant.AI_PLAYER].position = new Vec3(data.X, 0, data.Z);
                        players[Constant.AI_PLAYER].eulerAngles = new Vec3(0,  data.V, 0);
                        this.playerLogic.move(Constant.AI_PLAYER, data.X, data.Z, data.V);
                    }else{
                        result[0].position = new Vec3(data.X, 0, data.Z);
                        result[0].eulerAngles = new Vec3(0,  data.V, 0);
                        result[0].moveX = data.MX;
                        result[0].moveY = data.MY;
                        this.playerLogic.move(result[0].id, data.X, data.Z, data.V);
                    }
                    break;
                case Constant.ACTION.STOP_MOVE:
                    this.playerLogic.stopMove(result[0], 0, 0, 0);
                    break;
                case Constant.ACTION.HEART_BEAT:
                    result[0].channel.delayTime = data.V as number;
                    break;
                case Constant.ACTION.HIT:
                    if(data.AI == 1){
                        this._isAiHit = true;
                        players[Constant.AI_PLAYER].attackPropType = PropType.HAMMER;
                        players[Constant.AI_PLAYER].eulerAngles = new Vec3(0, data.V, 0);
                    }else{
                        this._isAiHit = false;
                        result[0].attackPropType = PropType.HAMMER;
                        result[0].eulerAngles = new Vec3(0, data.V, 0);
                    }
                    break;
                case Constant.ACTION.IS_ATTACK_ED:
                    if(this._isAiHit){
                        result[0].attackPropType = PropType.HAMMER_ED;
                        var coinCount:number = 0;
                        if(result[0].score > 10){
                            coinCount = 10;
                            result[0].score -= 10;
                        }
                        else{
                            coinCount = result[0].score;
                            result[0].score = 0;
                        }

                        this.propLogic.createCoinByHammer(coinCount, result[0].position);
                    }else{
                        players.filter((valueOther: Player) => {
                            if(valueOther.channel && valueOther.channel.openId != playerId){
                                valueOther.attackPropType = PropType.HAMMER_ED;
                                var coinCount:number = 0;
                                if(valueOther.score > 10){
                                    coinCount = 10;
                                    valueOther.score -= 10;
                                }
                                else{
                                    coinCount = valueOther.score;
                                    valueOther.score = 0;
                                }
    
                                if(valueOther.channel.openId != GobeUtil.instance.ownPlayerId){
                                    this.propLogic.createCoinByHammer(coinCount, valueOther.position);
                                }
                            }
                        });
                    }
                    break;
                case Constant.ACTION.HAMMER:
                    var bool = this.propLogic.removePropId(data.V);
                    if(bool){
                        if(data.AI == 1){
                            players[Constant.AI_PLAYER].hammerCount = 1;
                        }else{
                            result[0].hammerCount = 1;
                        }
                    }
                    break;
                case Constant.ACTION.ICON:
                    var bool = this.propLogic.removePropId(data.V);
                    // if(bool){
                        if(data.AI == 1){
                            players[Constant.AI_PLAYER].score++; 
                        }else{
                            result[0].score++; 
                        }
                    // }
                    break;
                case Constant.ACTION.CREATE_HAMMER:
                    console.log("aaaaa", data);
                    ClientEvent.dispatchEvent(Constant.EVENT_NAME.CREATE_HAMMER, [data.X, data.Y, data.Z]);
                    GobeUtil.instance.hammerIndex = data.V + 1;
                    this.currentGameState.createHammerTime = data.T;
                    break;
                case Constant.ACTION.CREATE_ICON:
                    var info = JSON.parse(data.I);
                    ClientEvent.dispatchEvent(Constant.EVENT_NAME.CREATE_COIN, info["coin_pos"]);
                    break;
                    
            }
        }

        if(callback){
            callback();
        }

        this._handleAction(callback);
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
