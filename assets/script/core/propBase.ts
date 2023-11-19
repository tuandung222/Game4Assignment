import { Prop } from './gameState';
import { _decorator, Component, Node, Tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = Coin2
 * DateTime = Tue Sep 07 2021 11:07:17 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = coin2.ts
 * FileBasenameNoExtension = coin2
 * URL = db://assets/script/core/coin2.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
 //道具基础类通用组件
@ccclass('PropBase')
export class PropBase extends Component {
    protected _tween: Tween<Node> = null!;
    protected _dropTween: Tween<Node> = null!;
    protected _propInfo: Prop = null!;
    protected _isDisappearEffShowing: boolean = false;//是否正在播放消失特效
    protected _parentName: string = "";//父节点名字
    protected _prop: Prop = null!;//道具状态信息
    protected _disappearCb: Function = null!;//消失后执行的回调函数
    protected _targetEuler: Vec3 = new Vec3(0, -360, 0);//目标角度
    protected _oriEuler: Vec3 = new Vec3();//初始角度

    onDisable () {
        this.unscheduleAllCallbacks();
    }

    /**
     * 展示道具
     *
     * @param {Prop} value 道具状态数据
     * @memberof PropBase
     */
    public show(value: Prop) {
        this.node.eulerAngles = this._oriEuler;

        if (this._tween) {
            this._tween.stop();
            this._tween = null!;
        }

        this._tween = new Tween(this.node)
        .to(3 * value.scale, {eulerAngles: this._targetEuler})
        .call(()=>{
            this.node.eulerAngles = this._oriEuler;
        })
        .union()
        .repeatForever()
        .start();

        this._propInfo = value;
        
        this._parentName = this.node.parent?.name!;
        this._isDisappearEffShowing = false;
    }

    /**
     * 掉落动画
     * @param posTarget 掉落位置
     */
    public drop (posTarget: Vec3) {
        let len: number = this.node.position.clone().subtract(posTarget).length();

        this._dropTween = new Tween(this.node).to(len / 10, {position: posTarget}).call(()=>{
            this._dropTween = null!;
            this.node.setPosition(posTarget);
        }).start();
    }

    public updateState (deltaTime: number, prop: Prop) {
        this._prop = prop;
    }
}