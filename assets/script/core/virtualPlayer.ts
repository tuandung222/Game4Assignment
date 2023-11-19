import { LogicManager } from './logicManager';
import { _decorator, Component, Vec3} from 'cc';
import { Player } from './gameState';
import { GobeUtil } from './gobeUtil';
const { ccclass } = _decorator;

@ccclass('VirtualPlayer')
export class VirtualPlayer extends Component {
    private _curAngleY: number = 0;//当前Y分量旋转角度
    private _vec3_0:Vec3 = new Vec3();
    private _angle_0:Vec3 = new Vec3();

    private _next_vec3_0:Vec3 = new Vec3();

    init(pos:Vec3) {
        this._curAngleY = 0;
        this._vec3_0.set(pos);
    }

    /**
     * 执行玩家行为
     *
     * @param {*} obj
     * @memberof Player
     */
    public playAction(obj: {action: number, posX: number, posZ: number, angleY: number}) {
        this._curAngleY = obj.angleY;
        this._vec3_0.set(obj.posX, 0, obj.posZ);
        this._angle_0.set(0, this._curAngleY, 0);
    }   

    public playActionRecovery () {
        this.node.setRotationFromEuler(this._angle_0);
        this.node.setPosition(this._vec3_0);
    }

    public updateState (player: Player, scriptLogicManager: LogicManager) {
        Vec3.lerp(this._next_vec3_0, this.node.position, this._vec3_0, 0.2);
    
        this.node.setRotationFromEuler(this._angle_0);
        this.node.setPosition(this._next_vec3_0);
        if(player.channel.openId == GobeUtil.instance.ownPlayerId){
            scriptLogicManager.propLogic.handleProp(player, this.node, false);
        }   
        else if(GobeUtil.instance.isAi){
            scriptLogicManager.propLogic.handleProp(player, this.node, true);
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
