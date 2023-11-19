import { _decorator, Component, Node, Prefab, Animation } from 'cc';
import {ClientEvent} from '../framework/clientEvent';
import { UIManager } from '../framework/uiManager';
import { AudioManager } from '../framework/audioManager';
import {PoolManager} from '../framework/poolManager';
import { Constant } from '../framework/constant';
import { Fighter } from './fighter';
import { GameState, Player, Prop, PropType } from './gameState';
import { LogicManager } from './logicManager';
import { GobeUtil, WIFI_TYPE } from './gobeUtil';
import { ResourceUtil } from '../framework/resourceUtil';
import { PropBase } from './propBase';
import { GameCamera } from './gameCamera';
import { PlayerData } from '../framework/playerData';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = DisplayManager
 * DateTime = Thu Sep 02 2021 10:12:26 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = displayManager.ts
 * FileBasenameNoExtension = displayManager
 * URL = db://assets/script/fight/displayManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
@ccclass('DisplayManager')
export class DisplayManager extends Component {
    @property(LogicManager)
    logicManager: LogicManager = null!;

    @property(Node)
    playerGroupNode: Node = null!;

    @property(Node)
    propGroupNode: Node = null!;

    @property(Prefab)
    coinPrefab: Prefab = null!;

    @property(Prefab)
    hammerPrefab: Prefab = null!;

    @property(GameCamera)
    cameraManager:GameCamera = null!;

    @property(Node)
    aiPosNode:Node = null!;

    public dicPlayers: {[index: string]: Node} = {};
    private _dicProps: {[index: number]: Node} = {};

    private _isGameOver:boolean = false;

    start () {
        this.reset();
    }

    onEnable () {
        ClientEvent.on(Constant.EVENT_NAME.ON_GAME_READY, this._onGameReady, this);
        ClientEvent.on(Constant.EVENT_NAME.ON_GAME_END, this._onGameEnd, this);
        ClientEvent.on(Constant.EVENT_NAME.ON_GAME_321, this._gameStart, this);
        ClientEvent.on(Constant.EVENT_NAME.CREATE_COIN, this._onCreateCoin, this);
    }

    onDisable () {
        ClientEvent.off(Constant.EVENT_NAME.ON_GAME_READY, this._onGameReady, this);
        ClientEvent.off(Constant.EVENT_NAME.ON_GAME_END, this._onGameEnd, this);
        ClientEvent.off(Constant.EVENT_NAME.ON_GAME_321, this._gameStart, this);
        ClientEvent.off(Constant.EVENT_NAME.CREATE_COIN, this._onCreateCoin, this);
    }

     /**
     * 创建金币
     * 
     * @param hammerId 
     */
     private _onCreateCoin(pos:number[][]){
        this.logicManager.onCreateCoin(pos);
        this.dropCoin();
    }

    /**
     * 显示初始场景
     */
    private _init() {
        this._isGameOver = false;
        let keyArray: string[]= Object.keys(this.dicPlayers);
        keyArray.forEach((element: string)=> {
            PoolManager.instance.putNode(this.dicPlayers[parseInt(element)]);
            delete this.dicPlayers[parseInt(element)];
        });
        keyArray= Object.keys(this._dicProps);
        keyArray.forEach((element: string)=> {
            PoolManager.instance.putNode(this._dicProps[parseInt(element)]);
            delete this._dicProps[parseInt(element)];
        });
        
        let gameState: GameState = this.logicManager.currentGameState;
        let props: Array<Prop> = gameState.props;
        props.forEach((value: Prop, index: number) => {
            this._dicProps[index] = this._createProp(value);
        });
    }

    /**
     * 创建道具节点
     * @param value 道具数据
     * @returns 
     */
    private _createProp(value: Prop) {
        let prefab: Prefab = this.coinPrefab;
        if (value.type === PropType.HAMMER) {
            prefab = this.hammerPrefab;
        } 
        let node: Node = PoolManager.instance.getNode(prefab, this.propGroupNode);
        node.setPosition(value.position);
        node.getComponent(PropBase)?.show(value);
        return node;
    }

    public updateOwnState(gameState: GameState, dt:number){
        let players: Array<Player> = gameState.players;
        players.forEach((value: Player, index: number) => {
            if(value.channel.openId == GobeUtil.instance.ownPlayerId){
                let ndPlayer: Node = this.dicPlayers[index];
                let scriptFighter: Fighter = ndPlayer.getComponent(Fighter) as Fighter;
                scriptFighter.playMove(this.logicManager, dt, index == 0 ? this.dicPlayers[1] : this.dicPlayers[0], value);
            }else if(GobeUtil.instance.isAi){
                let ndPlayer: Node = this.dicPlayers[index];
                let scriptFighter: Fighter = ndPlayer.getComponent(Fighter) as Fighter;
                scriptFighter.playMoveAi(this.logicManager, dt, index == 0 ? this.dicPlayers[1] : this.dicPlayers[0], value);
            }
        });
    }

    public updateRun(playerId:string, gameState: GameState){
        let players: Array<Player> = gameState.players;
        players.forEach((value: Player, index: number) => {
            if(value.channel.openId == playerId){
                let ndPlayer: Node = this.dicPlayers[index];
                let scriptFighter: Fighter = ndPlayer.getComponent(Fighter) as Fighter;
                scriptFighter.playRun();
            }

            return;
        });
    }

    public updateIdle(playerId:string, gameState: GameState){
        let players: Array<Player> = gameState.players;
        players.forEach((value: Player, index: number) => {
            if(value.channel.openId == playerId){
                let ndPlayer: Node = this.dicPlayers[index];
                let scriptFighter: Fighter = ndPlayer.getComponent(Fighter) as Fighter;
                scriptFighter.playIdle();
            }

            return;
        });
    }

    public updateStateRecovery(gameState: GameState){
        let players: Array<Player> = gameState.players;
        players.forEach((value: Player, index: number) => {
            let ndPlayer: Node = this.dicPlayers[index];
            var value: Player = players[index];
            if (ndPlayer) {
                if (value.channel) {
                    ndPlayer.active = true;
                    let scriptFighter: Fighter = ndPlayer.getComponent(Fighter) as Fighter;
                    scriptFighter.updateStateRecovery(value);
                } else if(ndPlayer){
                    ndPlayer.active = false;
                }
            }
        });
    }

    public updateProp(gameState: GameState){
        let props: Array<Prop> = gameState.props;
        props.forEach((value: Prop, index: number) => {
            let ndProp: Node = this._dicProps[index];
            if (ndProp && !value.exist) {
                PoolManager.instance.putNode(ndProp);
                delete this._dicProps[index];
            }
        });
    }

    /**
     * 更新场景状态
     * @param deltaTime 
     */
    public updateState(deltaTime: number, gameState: GameState, isCheck:boolean) {
        let players: Array<Player> = gameState.players;
        players.forEach((value: Player, index: number) => {
            let ndPlayer: Node = this.dicPlayers[index];
            var value: Player = players[index];
            if (ndPlayer) {
                if (value.channel) {
                    ndPlayer.active = true;
                    let scriptFighter: Fighter = ndPlayer.getComponent(Fighter) as Fighter;
                    scriptFighter.updateState(deltaTime, value, isCheck);
                } else if(ndPlayer){
                    ndPlayer.active = false;
                }
            }
        });

        let props: Array<Prop> = gameState.props;
        props.forEach((value: Prop, index: number) => {
            let ndProp: Node = this._dicProps[index];
            if (ndProp && !value.exist) {
                PoolManager.instance.putNode(ndProp);
                delete this._dicProps[index];
            }

            if (!ndProp && value.exist && !value.dropPosition) {
                this._dicProps[index] = this._createProp(value);
            }

            if (ndProp) {
                let scriptProp = ndProp.getComponent(PropBase) as PropBase;
                scriptProp?.updateState(deltaTime, value);
            }
        });
    }


    /**
     * 开始游戏
     */
    private _gameStart() {
        this.logicManager.checkIsReCovery();
        UIManager.instance.showDialog(Constant.PANEL_NAME.MEDIA_PANEL);
        
        this.cameraManager.node.getComponent(Animation)?.play();
        UIManager.instance.showDialog(Constant.PANEL_NAME.READY_GO, [()=>{
            GobeUtil.instance.startGame();
        
            AudioManager.instance.playMusic(Constant.AUDIO_NAME.BACKGROUND, true);
            UIManager.instance.showDialog(Constant.PANEL_NAME.FIGHT_UI, [this]);

            var isRoomOwner:boolean = GobeUtil.instance.checkIsRoomOwner(GobeUtil.instance.ownPlayerId)
            if(isRoomOwner){
                this.cameraManager.init(this.dicPlayers[0]);
            }
            else{
                this.cameraManager.init(this.dicPlayers[1]);
            }

            this.cameraManager.startGame();
        }]);
    }

    /**
     * 重置游戏
     */
    public reset() {
        this.logicManager.setDefaultGameState();
        this._init();
    }

    /**
     * 游戏结束事件回调
     */
    private _onGameEnd () {
        if(this._isGameOver){
            return;
        }
        this.cameraManager.finishGame();
        this._isGameOver = true;
        UIManager.instance.hideDialog(Constant.PANEL_NAME.FIGHT_UI);
        AudioManager.instance.playSound(Constant.AUDIO_NAME.TIME_OUT);
        let winner = -1;
        let players: Player[] = this.logicManager.currentGameState.players;
        if(players[0].score < players[1].score){
            winner = 1;
        }else if(players[0].score > players[1].score){
            winner = 0;
        }

        for (const key in this.dicPlayers) {
            if (Object.prototype.hasOwnProperty.call(this.dicPlayers, key)) {
                const element = this.dicPlayers[key];
                const scriptPlayer = element.getComponent(Fighter) as Fighter;
                scriptPlayer.showFighterGameOverAni(winner == -1?true :  winner === Number(key));
            }
        }

        this.scheduleOnce(()=>{
            UIManager.instance.hideDialog(Constant.PANEL_NAME.MESSAGE_PANEL);
            UIManager.instance.hideDialog(Constant.PANEL_NAME.READY_GO);
            UIManager.instance.hideDialog(Constant.PANEL_NAME.FIGHT_UI);
            UIManager.instance.showTransitionBg(()=>{
                UIManager.instance.showDialog(Constant.PANEL_NAME.GAME_OVER, [this, winner], ()=>{}, true);
            });
        }, 1.5)
    }

    /**
     * 游戏开始事件回调
     */
    private _onGameReady() {
        let gameState: GameState = this.logicManager.currentGameState;
        let players: Array<Player> = gameState.players;

        players.forEach((value: Player, index: number) => {
            if (value.channel) {
                let playerPath = "player/girl";
                if (GobeUtil.instance.checkIsRoomOwner(value.channel.openId)) {
                    playerPath = "player/boy";
                } 
    
                ResourceUtil.loadModelRes(playerPath).then((pf: any)=>{
                    let ndPlayer: Node = PoolManager.instance.getNode(pf, this.playerGroupNode);
                    ndPlayer.setPosition(value.position);
                    ndPlayer.setScale(Constant.PLAYER_ORIGIN_SCALE, Constant.PLAYER_ORIGIN_SCALE, Constant.PLAYER_ORIGIN_SCALE);
                    ndPlayer.eulerAngles = value.eulerAngles;
                    ndPlayer.getComponent(Fighter)?.init(this, this.aiPosNode);
                    this.dicPlayers[index] = ndPlayer;
                })
            }
        })
    }

     /**
     * 显示被锤子击打后掉落的金币
     */
     public dropCoin() {
        let props: Array<Prop> = this.logicManager.currentGameState.props;
        props.forEach((value: Prop, index: number) => {
            let node: Node = this._dicProps[index];        
            if (!node && value.exist && value.dropPosition) {
                this._dicProps[index] = this._createProp(value);
                this._dicProps[index].getComponent(PropBase)?.drop(value.dropPosition);
            }
        });
    }
}