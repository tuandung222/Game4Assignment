import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MatchPanel')
export class MatchPanel extends Component {
    @property(Label)
    txtTip: Label = null!;

    private _matchTime:number = 0;

    show(){
        this._matchTime = 0;
    }

    protected update(dt: number): void {
        this._matchTime += dt;

        this.txtTip.string = "当前等待时长为" + Math.floor(this._matchTime) + "秒"
    }

}

