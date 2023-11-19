import { VirtualPlayer } from './virtualPlayer';
import { _decorator, Component, Node, Vec3, Prefab, Quat, ModelComponent, geometry, Mat4, math } from 'cc';
import { Constant } from '../framework/constant';
import { PoolManager } from '../framework/poolManager';
import { Player, PropType } from './gameState';
import { LogicManager } from './logicManager';
import { GobeUtil } from './gobeUtil';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = PlayerLogic
 * DateTime = Thu Sep 09 2021 15:46:05 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = playerLogic.ts
 * FileBasenameNoExtension = playerLogic
 * URL = db://assets/script/core/playerLogic.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
 let v3_1 = new Vec3();
 let v3_2 = new Vec3();
@ccclass('PlayerLogic')
export class PlayerLogic extends Component {

    @property(Prefab)
    virtualPlayerPrefab: Prefab = null!;

    @property(Node)
    obstacleGroupNode: Node = null!;

    private _dicPlayers: {[index: number]: Node} = {};//存放虚拟玩家节点的字典
    private _dicScriptVirtualPlayers: {[index: number]: VirtualPlayer} = {};//存放虚拟玩家脚本的字典
    private _parent: LogicManager = null!;

    public init(parent: LogicManager) {
        this._parent = parent;
    }

    /**
     * 重置节点
     */
    public reset() {
        let keyArray: string[]= Object.keys(this._dicPlayers);
        keyArray.forEach((element: string)=> {
            PoolManager.instance.putNode(this._dicPlayers[parseInt(element)]);
            delete this._dicPlayers[parseInt(element)];
        });
    }

    /**
     * 生成虚拟玩家
     * @returns 虚拟玩家数据
     */
    public initPlayer() {
        let players: Array<Player>= [];
        for(let i: number = 0; i < Constant.MAX_PLAYER; i++) {
            let player: Player = {} as Player;
            let pos: Vec3 = new Vec3(-50, 0, 0);
            let eulerAngles: Vec3 = new Vec3(0, 90, 0);
            switch (i) {
                case 0:
                    break;
                case 1:
                    pos.set(50, 0, 0);
                    eulerAngles.set(0, -90, 0);
                    break;
            }
            player.id = i;
            player.position = pos;
            player.eulerAngles = eulerAngles;
            player.score = 0;
            player.hammerCount = 0;
            player.moveX = 0;
            player.moveY = 0;
            player.isShowReward = false;
            player.isScoreLead = false;
            players[i] = player;

            let ndVirtualPlayer = PoolManager.instance.getNode(this.virtualPlayerPrefab, this.node);
            ndVirtualPlayer.setPosition(pos);
            ndVirtualPlayer.eulerAngles = eulerAngles;
            this._dicPlayers[i] = ndVirtualPlayer;

            let scriptVirtualPlayer = ndVirtualPlayer.getComponent(VirtualPlayer) as VirtualPlayer;
            scriptVirtualPlayer.init(pos);
            this._dicScriptVirtualPlayers[i] = scriptVirtualPlayer;
        }
        
        return players;
    }

    
    /**
     * 处理虚拟玩家节点显示
     * @param players 玩家数据
     */
    public updatePlayerNode(players: Player[]) {
        players.forEach((value: Player, index: number) => {
            let playerNode: Node = this._dicPlayers[index];
            if (value.channel) {
                playerNode.active = true;
            } else {
                playerNode.active = false;
            }
        });
    }

    /**
     * 玩家停止移动
     * @param player 
     * @param horizontal 
     * @param vertical 
     * @param value 
     */
    public stopMove(player: Player, posX: number, posZ: number, angleY: number) {
        this._dicScriptVirtualPlayers[player.id].playAction({action: Constant.ACTION.STOP_MOVE, posX: posX, posZ: posZ, angleY: angleY});
    }

    /**
     * 玩家停止移动,并朝向敌人进行攻击
     * @param player 
     * @param horizontal 
     * @param vertical 
     * @param value 
     */
     public stopMoveAndAttack(player: Player, posX: number, posZ: number, angleY: number) {
        this._dicScriptVirtualPlayers[player.id].playAction({action: Constant.ACTION.IS_ATTACK_ED, posX: posX, posZ: posZ, angleY: angleY});
    }

    /**
     * 玩家移动
     * @param player 玩家数据
     * @param horizontal 水平值
     * @param vertical  垂直值
     */
    public move(playerId: number, posX: number, posZ: number, angleY: number) {
        this._dicScriptVirtualPlayers[playerId].playAction({action: Constant.ACTION.MOVE, posX: posX, posZ: posZ, angleY: angleY});
    }

    
    /**
     * 更新玩家状态
     */
    public updateStateRecovery () {
        for (const i in this._dicScriptVirtualPlayers) {
            if (Object.prototype.hasOwnProperty.call(this._dicScriptVirtualPlayers, i)) {
                const scriptVirtualPlayer = this._dicScriptVirtualPlayers[i];
                scriptVirtualPlayer.playActionRecovery();
            }
        }
    }

    /**
     * 更新玩家状态
     */
    public updateState () {
        for (const i in this._dicScriptVirtualPlayers) {
            if (Object.prototype.hasOwnProperty.call(this._dicScriptVirtualPlayers, i)) {
                const scriptVirtualPlayer = this._dicScriptVirtualPlayers[i];
                scriptVirtualPlayer.updateState(this._parent.currentGameState.players[i], this._parent);
            }
        }
    }

    /**
     * 判断是否相交
     * @returns 
     */
    public intersectWithObstacle(worldMatrix:Mat4, worldRotation:Quat, scale:Vec3, parentScale:Vec3) {
        let modelArray: ModelComponent[] = this.obstacleGroupNode.getComponentsInChildren(ModelComponent);
        let flag: boolean = false;
        for(let i: number = 0; i < modelArray.length; i++) {
            if (!modelArray[i].node.active) continue;
            let model2: ModelComponent = modelArray[i];
            let obb1: geometry.OBB = new geometry.OBB();
            let obb2: geometry.OBB = new geometry.OBB();
            obb1.halfExtents = Vec3.multiplyScalar(v3_1, scale, 0.5 * parentScale.x);
            obb2.halfExtents = Vec3.multiplyScalar(v3_2, model2.node.scale, 0.5 * (model2.node.parent as Node).scale.x);
            obb1.translateAndRotate(worldMatrix, worldRotation, obb1);
            obb2.translateAndRotate(model2.node.worldMatrix, model2.node.worldRotation, obb2);
            if (geometry.intersect.obbWithOBB(obb1, obb2)) {
                return true;
            }
        }
        return flag;
    }

    // /**
    //  * 处理攻击操作数据
    //  * @param player 攻击者数据
    //  * @returns 
    //  */
    // public checkAttack(player: Player) {
    //     if (!player.hammerCount) return;

    //     let enemy: Player = this.getNearestEnemy(player.channel.openId, player.position);
    //     if (!enemy || ((this._parent.currentGameState.frameTime - enemy.dizzyTime) < Constant.REVIVE_TIME * 1000)) return;
    //     let selfNode: Node = this._dicPlayers[player.id];
    //     //正前方3米处
    //     //半径为1米
    //     let hammerDistance = 3 * selfNode.scale.x;
    //     let hammerRange = 1 * selfNode.scale.x;
    //     let offset = enemy.position.clone().subtract(player.position).normalize();
    //     let posHammer = player.position.clone().add(offset.clone().multiplyScalar(hammerDistance));

    //     let dis = posHammer.clone().subtract(enemy.position).length();
    //     if (dis < hammerRange * 0.9 + Constant.INIT_COLLIDER_CIRCLE) {
    //         player.attackPos = posHammer.clone();
    //         player.attackPropType = PropType.HAMMER;
    //         let dis = posHammer.subtract(enemy.position).length();
    //         if (dis < hammerRange + Constant.INIT_COLLIDER_CIRCLE) {
    //             player.hammerCount--;
    //             player.attackId = enemy.id;
    //             enemy.dizzyTime = this._parent.currentGameState.frameTime;
    //             //设置眩晕结束时间，一秒攻击方动画播放秒数，一秒为受击动画播放秒数
    //             enemy.dizzyOverTime = this._parent.currentGameState.frameTime + Constant.DIZZY_TIME * 1000 + 1000;
    //             let num: number = Math.ceil(enemy.score / 2);
    //             num = num >= 20 ? 20 : num;
    //             enemy.score -= num; 
    //             this._parent.propLogic.createCoinByHammer(num, enemy.position);
    //         }

    //         //朝向指定的敌人攻击
    //         GobeUtil.instance.sendFrame({'A': Constant.ACTION.IS_ATTACK_ED, 'I': enemy.channel.openId});
    //     }
    // }

    public getPlayerByIndex(index:number){
        return this._dicPlayers[index];
    }

    /**
     * 获取最近的其他玩家
     * @param selfPlayerId 
     * @param position 
     * @returns 
     */
    public getNearestEnemy (selfPlayerId: string, position: Vec3) {
        let sqr: number = math.bits.INT_MAX;
        let nearestPlayer: Player = null!;
        let players: Array<Player> = this._parent.currentGameState.players;
        for (let pos in players) {
            let player: Player = players[pos];
            if (player.channel && player.channel.openId !== selfPlayerId) {
                //判断距离
                let lenSqr: number = Vec3.squaredDistance(player.position, position);
                if (lenSqr < sqr) {
                    sqr = lenSqr;
                    nearestPlayer = player;
                }
            }
        }

        return nearestPlayer;
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
