
import { _decorator, Touch, input, Input, view, EventTouch, Vec2, Component } from 'cc';
import { Constant } from '../../framework/constant';
import { EasyTouch } from './easy_touch';
import { ClientEvent } from '../../framework/clientEvent';
const { ccclass, property } = _decorator;
@ccclass('EasyTouchPanel')
export class EasyTouchPanel extends Component {
    // 左 横杆
    @property(EasyTouch)
    leftEasyTouch: EasyTouch = null!;

    @property(EasyTouch)
    rightEasyTouch: EasyTouch = null!;

    // 移动位置
    private _startLeftMoveX: number = 0;

    // 移动坐标
    private _startLeftMoveY: number = 0;

    // 移动位置
    private _startRightMoveX: number = 0;

    // 移动坐标
    private _startRightMoveY: number = 0;

    // 屏幕宽
    private _canvasMidWidth: number = 0;

    // 屏幕高
    private _canvasMidHeight: number = 0;

    private _leftTouchId: number = -1;

    private _rightTouchId: number = -1;

    start () {
        let size = view.getVisibleSize();
        let width = Math.round(size.width);
        let height = Math.round(size.height);
        this._canvasMidWidth = width * 0.5;
        this._canvasMidHeight = height * 0.5;
    }

    onEnable () {
        ClientEvent.on(Constant.EVENT_NAME.GAME_INIT, this._init, this);
        input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    onDisable () {
        input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    /**
     * 鼠标触摸
     * @param event 
     */
    private _onTouchStart (event: EventTouch) {
        var touch: Touch = event.touch;
        var touchX: number = touch.getUIStartLocation().x;
        var touchY: number = touch.getUIStartLocation().y;

        // 屏幕左边
        if (touchX < this._canvasMidWidth) {
            this._startLeftMoveX = touchX;
            this._startLeftMoveY = touchY;
            this._leftTouchId = touch.getID();

            this.leftEasyTouch.startTouch(touchX - this._canvasMidWidth, touchY - this._canvasMidHeight);
        }
        else {
            this._startRightMoveX = touchX;
            this._startRightMoveY = touchY;
            this._rightTouchId = touch.getID();

            this.rightEasyTouch.startTouch(touchX - this._canvasMidWidth, touchY - this._canvasMidHeight);
        }
    }

    /**
     * 鼠标触摸
     * @param event 
     */
    private _onTouchMove (event: EventTouch) {
        var touchs: Touch[] = event.getTouches();
        for (var index: number = 0; index < touchs.length; index++) {
            var touch: Touch = touchs[index];
            var vec2: Vec2 = touch.getUILocation();
            if (touch.getID() == this._leftTouchId) {
                this.leftEasyTouch.moveTouch(touch.getUILocation().x - this._startLeftMoveX, touch.getUILocation().y - this._startLeftMoveY);
            }
            else if (touch.getID() == this._rightTouchId) {
                this.rightEasyTouch.moveTouch(vec2.x - this._startRightMoveX, vec2.y - this._startRightMoveY);
            }
        }
    }

    private _init(){
        this._leftTouchId = -1;
        this.leftEasyTouch.endTouch();
        this.leftEasyTouch.moveTouchByXY(
            0,
            0
        );
    }

    /**
    * 鼠标触摸
    * @param event 
    */
    private _onTouchEnd (event: EventTouch) {
        var touch: Touch = event.touch;
        var touchId: number = touch.getID();
        if (touchId == this._leftTouchId) {
            this._leftTouchId = -1;
            this.leftEasyTouch.endTouch();
            this.leftEasyTouch.moveTouchByXY(
                0,
                0
            );
        }
        else {
            this._rightTouchId = -1;
            this.rightEasyTouch.endTouch();
            this.rightEasyTouch.moveTouchByXY(
                0,
                0
            );
        }

        if (this._leftTouchId == -1 && this._rightTouchId == -1) {
            // 双手都移开屏幕
        }
    }
}
