import { _decorator, Component, Node, SkinningModelComponent, ParticleSystemComponent, Vec3, Mat4, log } from 'cc';
import { ClientEvent }from '../framework/clientEvent';
import { AudioManager } from '../framework/audioManager';
import { PoolManager} from '../framework/poolManager';
import { ResourceUtil } from '../framework/resourceUtil';
import { Constant } from '../framework/constant';
import { DisplayManager } from './displayManager';
import { FighterModel } from './fighterModel';
import { Player, PropType} from './gameState';
import { EffectManager } from '../framework/effectManager';
import { Util } from '../framework/util';
import { PlayerData } from '../framework/playerData';
import { LogicManager } from './logicManager';
import { GobeUtil } from './gobeUtil';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = Player
 * DateTime = Tue Sep 07 2021 12:38:14 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = player.ts
 * FileBasenameNoExtension = player
 * URL = db://assets/script/core/player.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */

enum PlayType {
    null,
    idle,
    run,
    attack,
    is_attack,
    game_over,
}

let vec_0:Vec3 = new Vec3();
let vec_1:Vec3 = new Vec3();
let vec_2:Vec3 = new Vec3();
@ccclass('Fighter')
export class Fighter extends Component {
    @property(Node)
    public ndSocketCrown: Node = null!;//皇冠挂载节点

    @property(SkinningModelComponent)
    public model: SkinningModelComponent = null!;

    @property(FighterModel)
    public fighterModel: FighterModel = null!;
    
    @property(Node)
    public ndSocketWeapon: Node = null!;//武器挂载节点

    private _aiPosNode:Node = null!; // ai点
 
    public playerState: Player = null!;//玩家状态信息

    private _ndCrown: Node = null!;//皇冠
    private _ndHammer: Node = null!;//锤子
    private _isPlayRunningEffect: boolean = false;
    private _runEffect: Node = null!;
    private _score: number = 0;
    private _mat:Mat4 = new Mat4();

    private _ndHammerTrial: Node = null!;//挂在锤子上的拖尾特效节点
    private _parent: DisplayManager = null!;
    
    private vec3_pos: Vec3 = new Vec3();
    private vec3_angle: Vec3 = new Vec3();
    private vec3_lastPos: Vec3 = new Vec3();
    private vec3_pos_1: Vec3 = new Vec3();
    
    private _moveIndex:number = 0;
    private _playType:PlayType = PlayType.null;

    public init(parent: DisplayManager, aiPosNode:Node) {
        this._aiPosNode = aiPosNode;
        this._parent = parent;
        this._isPlayRunningEffect = false;
        this._runEffect = null!;
        this._score = 0;
        this._aiPosIndex = 0;

        this.playIdle();

        if (!this._ndCrown) {
            ResourceUtil.loadModelRes("crown/crown").then((pf: any)=>{
                this._ndCrown = PoolManager.instance.getNode(pf, this.ndSocketCrown);
                this.ndSocketCrown.active = false;
            })
        } else {
            this.ndSocketCrown.active = false;
        }

        if (!this._ndHammer) {
            ResourceUtil.loadModelRes("hammer/hammerProp").then((pf: any)=>{
                this._ndHammer = PoolManager.instance.getNode(pf, this.ndSocketWeapon);
                this._ndHammer.setPosition(0, 0, 0);
                this.ndSocketWeapon.active = false;
                this._hideHammerTrial();
            })
        } else {
            this.ndSocketWeapon.active = false;
            this._hideHammerTrial();
        }

        this.vec3_pos.set(0, 0, 0);
        this.vec3_angle.set(0, 0, 0);
        this.vec3_lastPos.set(0, 0, 0);
        this.vec3_pos_1.set(0, 0, 0);

        this._lastIndex = 0;
        vec_0.set(50, 0, 0);
        var index = Math.floor(Math.random() * Constant.AI_POS_INDEX[this._lastIndex].length);
        this._nextIndex = Constant.AI_POS_INDEX[this._lastIndex][index];
        vec_1.set(this._aiPosNode.children[this._nextIndex - 1].position);

        var dis:number = Vec3.distance(vec_0, vec_1);
        this._posPer = Constant.AI_SPEED / dis;

        // console.log("1", this._nextIndex);
    }

    /**
    * 隐藏锤子上的拖尾特效
    *
    * @private
    * @memberof Fighter
    */
    private _hideHammerTrial () {
        if (!this._ndHammer) {
            return;
        }

        if (!this._ndHammerTrial) {
            this._ndHammerTrial = this._ndHammer.getChildByName("trail01") as Node;
        }
        
        if (this._ndHammerTrial && this._ndHammerTrial.active) {
            this._ndHammerTrial.active = false;
        }
    }

    /**
     * 播放跑步效果
     */
    public playRun() {
        if(this._playType == PlayType.run){
            return;
        }

        this._playType = PlayType.run;
        if (!this.fighterModel.isRunning) {
            this._isPlayRunningEffect = true;
            //播放移动粒子特效
            if (this._runEffect) {
                this._runEffect.active = true;

                let particle = this._runEffect.getComponentInChildren(ParticleSystemComponent) as ParticleSystemComponent;
                particle.loop = true;
                particle.clear();
                particle.stop();
                particle.play();
            } else {
                ResourceUtil.loadEffectRes("runningSmoke").then((pf: any)=>{
                    if (!this.fighterModel.isRunning) {
                        return; //已经没在跑了
                    }

                    this._runEffect = PoolManager.instance.getNode(pf, this.node);
                    this._runEffect.active = true;
                    let particle = this._runEffect.getComponentInChildren(ParticleSystemComponent) as ParticleSystemComponent;
                    particle.loop = true;
                    particle.clear();
                    particle.stop();
                    particle.play();
                })
            }
        }

        if (this.ndSocketWeapon.active) {
            this.fighterModel.playAni(Constant.ANI_TYPE.RUN_1, true, false, ()=>{}, 1);
            this._hideHammerTrial();
        } else {
            this.fighterModel.playAni(Constant.ANI_TYPE.RUN, true, false, ()=>{}, 1);
        }
    }

    /**
     * 攻击
     * @param value 
     */
    public playAttack(value:Player, isActick:boolean) {
        if(this._playType == PlayType.attack){
            return;
        }

        this._playType = PlayType.attack;
        value.hammerCount = 0;
        value.attackPropType = PropType.NULL;
        //使用锤子
        AudioManager.instance.playSound(Constant.AUDIO_NAME.HIT);
        this._ndHammerTrial.active = true;
        EffectManager.instance.playTrail(this._ndHammerTrial);

        this.fighterModel.isActick = isActick;
        this.fighterModel.playAni(Constant.ANI_TYPE.ATTACK, false, false, ()=>{
            this._hideHammerTrial();
            this.ndSocketWeapon.active = false; //武器消失
            this.playIdle();
        }, 1);
    }

    /**
     * 播放待机效果
     */
    public playIdle() {
        if(this._playType == PlayType.idle){
            return;
        }

        this._playType = PlayType.idle;
        this.fighterModel.playAni(Constant.ANI_TYPE.IDLE, true, false, ()=>{}, 2);

        if (this._runEffect && this._isPlayRunningEffect) {
            let particle2 = this._runEffect.getComponentInChildren(ParticleSystemComponent) as ParticleSystemComponent;
            particle2.loop = false;
        }

        this._isPlayRunningEffect = false;
    }

    /**
     * 移动
     */
    public playMove(logicManager: LogicManager, dt:number, otherNode:Node, player:Player){
        if(!(this._playType == PlayType.idle || this._playType == PlayType.run)){
            return;
        }

        if(player.hammerCount > 0){
            var distance:number = Vec3.distance(this.vec3_lastPos, otherNode.position);
            if(distance < 5){
                Vec3.subtract(this.vec3_pos_1, this.node.position, otherNode.position);
                var angleY:number = Math.atan(this.vec3_pos_1.z/this.vec3_pos_1.x) * 180 / Math.PI; 
                if(this.vec3_pos_1.x < 0){
                    if(this.vec3_pos_1.z < 0){
                        angleY = 180 - angleY;
                    }else {
                        angleY = (angleY + 180) * -1;
                    }
                }else{
                    angleY *= -1;
                }

                angleY-=90;
                GobeUtil.instance.sendFrame({'A': Constant.ACTION.HIT, 'V': angleY});

                this.vec3_angle.y = angleY;
                this.node.eulerAngles = this.vec3_angle;
                this.playAttack(player, true);
                return;
            }
        }

        var leftY:number = PlayerData.instance.getEasyTouchInfo(Constant.EASY_TOUCH.TOUCH_LEFT_Y);
        var leftX:number = PlayerData.instance.getEasyTouchInfo(Constant.EASY_TOUCH.TOUCH_LEFT_X);
        if (leftY == 0 && leftX == 0) {
            if(this._playType != PlayType.idle){
                this.vec3_angle.set(this.node.eulerAngles.clone());
                this.vec3_lastPos.set(this.node.position.clone());
                GobeUtil.instance.sendFrame({'A': Constant.ACTION.MOVE, 'V': this.vec3_angle.y, 'X': this.vec3_lastPos.x, 'Z': this.vec3_lastPos.z, 'MX': leftX, 'MY': leftY});
            }

            this.playIdle();
            return;
        }

        this.playRun();
        var angleY:number = Math.atan(leftX / leftY) * 180 / Math.PI;
        if(leftY < 0){
            angleY -= 180;
        }

        this.vec3_angle.y = 180 - angleY;
        this.node.eulerAngles = this.vec3_angle;

        this.vec3_lastPos.set(this.node.position.clone());
        this.vec3_pos.set(this.node.position.clone());
        var speed:number = 1 - (this.node.scale.x - 1) * Constant.MIN_SPEED_PERCENT;
        this.vec3_pos.x += leftX * 0.2 * dt * 60 * speed;
        this.vec3_pos.z -= leftY * 0.2 * dt * 60 * speed;
    
        this._mat.m12 = this.vec3_pos.x;
        this._mat.m13 = this.vec3_pos.y;
        this._mat.m14 = this.vec3_lastPos.z;
        if (!logicManager.playerLogic.intersectWithObstacle(this._mat, this.node.rotation, this.node.scale, this.node.parent?.scale)) {
            this.vec3_lastPos.x = this.vec3_pos.x;
        }

        this._mat.m12 = this.vec3_lastPos.x;
        this._mat.m13 = this.vec3_pos.y;
        this._mat.m14 = this.vec3_pos.z;
        if (!logicManager.playerLogic.intersectWithObstacle(this._mat, this.node.rotation, this.node.scale, this.node.parent?.scale)) {
            this.vec3_lastPos.z = this.vec3_pos.z;
        }

        if(this._moveIndex == 0){
            GobeUtil.instance.sendFrame({'A': Constant.ACTION.MOVE, 'V': this.vec3_angle.y, 'X': this.vec3_lastPos.x, 'Z': this.vec3_lastPos.z, 'MX': leftX, 'MY': leftY});
        }
        
        this.node.setPosition(this.vec3_lastPos);

        this._moveIndex ++;
        if(this._moveIndex > 4){
            this._moveIndex = 0;
        }
    }

    private _aiPosIndex:number = 0;
    private _nextIndex:number = 0;
    private _lastIndex:number = 0;
    private _posPer:number = 0;
     /**
     * 移动
     */
     public playMoveAi(logicManager: LogicManager, dt:number, otherNode:Node, player:Player){
        if(!(this._playType == PlayType.idle || this._playType == PlayType.run)){
            return;
        }

        if(player.hammerCount > 0){
            var distance:number = Vec3.distance(this.vec3_lastPos, otherNode.position);
            if(distance < 5){
                Vec3.subtract(this.vec3_pos_1, this.node.position, otherNode.position);
                var angleY:number = Math.atan(this.vec3_pos_1.z/this.vec3_pos_1.x) * 180 / Math.PI; 
                if(this.vec3_pos_1.x < 0){
                    if(this.vec3_pos_1.z < 0){
                        angleY = 180 - angleY;
                    }else {
                        angleY = (angleY + 180) * -1;
                    }
                }else{
                    angleY *= -1;
                }

                angleY-=90;
                GobeUtil.instance.sendFrame({'A': Constant.ACTION.HIT, 'V': angleY, 'AI': 1});

                this.vec3_angle.y = angleY;
                this.node.eulerAngles = this.vec3_angle;
                this.playAttack(player, true);
                return;
            }
        }
        
        this.playRun();
        var speed:number = 1 - (this.node.scale.x - 1) * Constant.MIN_SPEED_PERCENT;
        this._aiPosIndex += this._posPer * speed;
        if(this._aiPosIndex >= 1){
            vec_0.set(vec_1);
            var nextPos:number[] = [];
            for(var index:number = 0; index < Constant.AI_POS_INDEX[this._nextIndex].length; index ++){
                if(Constant.AI_POS_INDEX[this._nextIndex][index] != this._lastIndex){
                    nextPos.push(Constant.AI_POS_INDEX[this._nextIndex][index]);
                }
            }
            this._lastIndex = this._nextIndex;
            var index = Math.floor(Math.random() * nextPos.length);
            this._nextIndex = nextPos[index];
            vec_1.set(this._aiPosNode.children[this._nextIndex - 1].position);
            this._aiPosIndex -= 1;
            var dis:number = Vec3.distance(vec_0, vec_1);
            this._posPer = Constant.AI_SPEED / dis;
        }
        // 坐标
        Vec3.lerp(this.vec3_pos, vec_0, vec_1, this._aiPosIndex);

        var leftX:number = vec_1.x - vec_0.x;
        var leftY:number = vec_0.z - vec_1.z;
        if(!(leftX == 0 && leftY == 0)){
            var angleY:number = Math.atan(leftX / leftY) * 180 / Math.PI;
            if(leftY < 0){
                angleY -= 180;
            }

            this.vec3_angle.y = 180 - angleY;
            this.node.eulerAngles = this.vec3_angle;
        }

        this.vec3_lastPos.set(this.node.position.clone());
        this._mat.m12 = this.vec3_pos.x;
        this._mat.m13 = this.vec3_pos.y;
        this._mat.m14 = this.vec3_lastPos.z;
        if (!logicManager.playerLogic.intersectWithObstacle(this._mat, this.node.rotation, this.node.scale, this.node.parent?.scale)) {
            this.vec3_lastPos.x = this.vec3_pos.x;
        }

        this._mat.m12 = this.vec3_lastPos.x;
        this._mat.m13 = this.vec3_pos.y;
        this._mat.m14 = this.vec3_pos.z;
        if (!logicManager.playerLogic.intersectWithObstacle(this._mat, this.node.rotation, this.node.scale, this.node.parent?.scale)) {
            this.vec3_lastPos.z = this.vec3_pos.z;
        }

        if(this._moveIndex == 0){
            GobeUtil.instance.sendFrame({'A': Constant.ACTION.MOVE, 'V': this.vec3_angle.y, 'X': this.vec3_lastPos.x, 'Z': this.vec3_lastPos.z, 'AI' : 1});
        }
        
        this.node.setPosition(this.vec3_lastPos);

        this._moveIndex ++;
        if(this._moveIndex > 4){
            this._moveIndex = 0;
        }
    }

    /**
     * 断线重连
     * 
     * @param value 
     */
    public updateStateRecovery(value: Player){
        this.node.eulerAngles = value.eulerAngles;
        this.node.setPosition(value.position);

        //锤头显示
        if (value.hammerCount && this.ndSocketWeapon.active === false) {
            this.ndSocketWeapon.active = true;
        } else if (value.hammerCount === 0 && this.ndSocketWeapon.active && !this.fighterModel.isAttacking){
            this.ndSocketWeapon.active = false;
        }
    }

    /**
     * 根据帧数据更新玩家状态
     * @param deltaTime 
     * @param value 玩家数据
     */
    public updateState (deltaTime: number, value: Player, isCheck:boolean) {
        if(!(this._playType == PlayType.idle || this._playType == PlayType.run)){
            return;
        }

        this.playerState = value;
        // 其他玩家移动
        if(isCheck || value.channel.openId != GobeUtil.instance.ownPlayerId && !GobeUtil.instance.isAi){
            var isAngle:boolean = false;
            //玩家转向
            if (!value.eulerAngles.equals(this.node.eulerAngles)) {
                if(value.channel.openId != GobeUtil.instance.ownPlayerId){
                    this.node.eulerAngles = value.eulerAngles;
                }
                
                isAngle = true;
            }
            
            // var dis:number = Vec3.distance(value.position, this.node.position);
            if(!(value.moveX == 0 && value.moveY == 0)){
                Vec3.lerp(this.vec3_pos_1, this.node.position, value.position, 0.2);
                this.node.setPosition(this.vec3_pos_1);
                this.playRun();
            }else if(isAngle){
                this.playRun();
            }else if (this._isPlayRunningEffect){
                this.playIdle();
            }

            // 吃道具
            if (value.attackPropType === PropType.HAMMER) {
                this.node.setPosition(value.position);
                this.playAttack(value, false);
            }
        }
       
        if(value.attackPropType === PropType.HAMMER_ED){
            value.attackPropType = PropType.NULL;
            //  被锤子攻击
            this.onHammerHit(value);
        }

        //得分tips
        if (value.score > this._score) {
            let num: number = value.score - this._score;
            AudioManager.instance.playSound(Constant.AUDIO_NAME.GOLD);
            ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_SHOW_COIN_TIPS, '+' + num, this.node.worldPosition.clone());
            this._score = value.score;  
        }

        //玩家大小
        let size: number = (Constant.PLAYER_ORIGIN_SCALE + this._score * Constant.ADD_SIZE_PER_COIN);
        size = size >= 2 ? 2 : size;
        if (size !== this.node.scale.x) {
            let targetSize = Util.lerp(size, this.node.scale.x, deltaTime * 10);
            this.node.setScale(targetSize, targetSize, targetSize);
            this._ndHammer.setScale(targetSize, targetSize, targetSize);
        }

        //皇冠显示
        if (value.isScoreLead && !this.ndSocketCrown.active) {
            this.ndSocketCrown.active = true;
        } else if (!value.isScoreLead && this.ndSocketCrown.active) {
            this.ndSocketCrown.active = false;
        }

        //锤头显示
        if (value.hammerCount && this.ndSocketWeapon.active === false) {
            this.ndSocketWeapon.active = true;
            // 获得锤子切换动作
            if(this._playType == PlayType.run){
                this.fighterModel.playAni(Constant.ANI_TYPE.RUN_1, true, false, ()=>{}, 1);
                this._hideHammerTrial();
            }
        } else if (value.hammerCount === 0 && this.ndSocketWeapon.active && !this.fighterModel.isAttacking){
            // this.ndSocketWeapon.active = false;
        }
    }

    /**
     * 被锤子击中
     *
     * @param {Player} value
     * @memberof Fighter
     */
    public onHammerHit (value: Player) {
        if(this._playType == PlayType.is_attack){
            return;
        }

        this._playType = PlayType.is_attack;
        EffectManager.instance.playEffect(this.node, "dizzyEff", true, true, 1);

        this.fighterModel.playAni(Constant.ANI_TYPE.HIT, false, true, ()=>{
            this.fighterModel.playAni(Constant.ANI_TYPE.DIZZY, false, false, ()=>{
                this.playIdle();
            }, 11);
        }, 9);

        // //更新分数
        // let num: number = value.score - this._score;
        // if (num !== 0) {
        //     ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_SHOW_COIN_TIPS, num, this.node.worldPosition.clone());
        // }
        
        // this._score = value.score; 
        // this._parent.dropCoin();
    }

    /**
     * 击打特效
     * @param posWorld 击打位置
     * @param scale 击打范围
     * @param endCb 击打回调函数
     */
    private _playHitEffect (posWorld: Vec3, scale: number = 1, endCb?: Function) {
        posWorld.y = 0.1;
        EffectManager.instance.playParticle("hitNew1", posWorld, 0, scale, null, ()=>{
            endCb && endCb();
        });
    }

    /**
     * 游戏结束时先观看3秒的人物胜利失败动画
     */
    public showFighterGameOverAni (isWin: boolean = false) {
        this._playType = PlayType.game_over;
        if (isWin) {
            this.fighterModel.playAni(Constant.ANI_TYPE.VICTORY, true, false, ()=>{}, 13);
        } else {
            this.fighterModel.playAni(Constant.ANI_TYPE.LOSE, false, false, ()=>{
                this.fighterModel.playAni(Constant.ANI_TYPE.LOSE_1, true, false, ()=>{}, 15);
            }, 14);
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
