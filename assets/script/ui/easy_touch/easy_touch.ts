
import { _decorator, Component, Node, CCInteger, Vec3 } from 'cc';
import { Constant } from '../../framework/constant';
import { Util } from '../../framework/util';
import { PlayerData } from '../../framework/playerData';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = easyTouch
 * DateTime = Wed May 11 2022 14:12:44 GMT+0800 (中国标准时间)
 * Author = yu_meng123
 * FileBasename = easyTouch.ts
 * FileBasenameNoExtension = easyTouch
 * URL = db://assets/script/game/easyTouch.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('EasyTouch')
export class EasyTouch extends Component {
    @property(Node)
    centerCircleNode: Node = null!;

    @property(Node)
    directionNode: Node = null!;

    @property(CCInteger)
    bgLength: number = 0;

    @property
    isLeftTouch: boolean = false;

    private _vec3_1: Vec3 = new Vec3();

    private _lastPos: Vec3 = new Vec3();

    private _vec3_Angle: Vec3 = new Vec3(0, 0, 0);

    private _lastX: number = 0;
    private _lastY: number = 0;

    start () {
        this.directionNode.active = false;

        setTimeout(() => {
            this._lastPos.set(this.node.position);
        });
    }

    public startTouch (x: number, y: number) {
        this.node.setPosition(new Vec3(x, y));
        this.directionNode.active = false;
    }

    public endTouch () {
        this.node.setPosition(this._lastPos);
        this.directionNode.active = false;

        // 左手
        if (this.isLeftTouch) {
            PlayerData.instance.updateEasyTouchInfo(Constant.EASY_TOUCH.TOUCH_LEFT_X, 0);
            PlayerData.instance.updateEasyTouchInfo(Constant.EASY_TOUCH.TOUCH_LEFT_Y, 0);
        }
        // 右手
        else {
            PlayerData.instance.updateEasyTouchInfo(Constant.EASY_TOUCH.TOUCH_RIGHT_X, 0);
            PlayerData.instance.updateEasyTouchInfo(Constant.EASY_TOUCH.TOUCH_RIGHT_Y, 0);
        }
    }

    /**
     * 移动
     * 
     * @param x 
     * @param y 
     */
    public moveTouch (x: number, y: number) {
        var dis = Math.sqrt(x * x + y * y);
        if (dis > this.bgLength) {
            var per: number = this.bgLength / dis;
            x = per * x;
            y = per * y;
            this._vec3_1.set(x, y, 0);
            this.centerCircleNode.setPosition(this._vec3_1);
        }
        else {
            this._vec3_1.set(x, y, 0);
            this.centerCircleNode.setPosition(this._vec3_1);
        }

        var z: number = Math.atan(x / y) * 180 / Math.PI;
        if (y < 0) {
            z -= 180;
        }

        this._vec3_Angle.set(0, 0, z * -1);
        this.directionNode.eulerAngles = this._vec3_Angle;
        this.directionNode.active = true;

        // 左手
        if (this.isLeftTouch) {
            PlayerData.instance.updateEasyTouchInfo(Constant.EASY_TOUCH.TOUCH_LEFT_X, x / this.bgLength);
            PlayerData.instance.updateEasyTouchInfo(Constant.EASY_TOUCH.TOUCH_LEFT_Y, y / this.bgLength);
        }
        // 右手
        else {
            PlayerData.instance.updateEasyTouchInfo(Constant.EASY_TOUCH.TOUCH_RIGHT_X, x / this.bgLength);
            PlayerData.instance.updateEasyTouchInfo(Constant.EASY_TOUCH.TOUCH_RIGHT_Y, y / this.bgLength);
        }
    }

    /**
     * 设置 上次便移的点
     * @param x 
     * @param y 
     */
    public setLastXY (x: number, y: number) {
        this._lastX = x;
        this._lastY = y;
    }

    /**
     * 通过数值更改位置
     * 
     * @param x 
     * @param y 
     */
    public moveTouchByXY (x: number, y: number) {
        x = Math.ceil(x * 10) * 0.1;
        y = Math.ceil(y * 10) * 0.1;

        this._lastX = Util.lerp(this._lastX, x, 0.1);
        this._lastY = Util.lerp(this._lastY, y, 0.1);

        this._vec3_1.set(this._lastX * this.bgLength, this._lastY * this.bgLength, 0);
        this.centerCircleNode.setPosition(this._vec3_1);

        var z: number = Math.atan(x / y) * 180 / Math.PI;
        if (y < 0) {
            z -= 180;
        }

        this._vec3_Angle.set(0, 0, z * -1);
        this.directionNode.eulerAngles = this._vec3_Angle;
    }

}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.4/manual/zh/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.4/manual/zh/scripting/decorator.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.4/manual/zh/scripting/life-cycle-callbacks.html
 */
