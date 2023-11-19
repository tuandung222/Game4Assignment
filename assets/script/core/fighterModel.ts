
import { _decorator, Component, SkeletalAnimationComponent, SkeletalAnimationState, AnimationClip, log } from 'cc';
import { Constant } from '../framework/constant';
import { GobeUtil } from './gobeUtil';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = FighterModel
 * DateTime = Tue Sep 07 2021 13:36:57 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = FighterModel.ts
 * FileBasenameNoExtension = FighterModel
 * URL = db://assets/resources/package/prefab/ui/fight/playerModel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
@ccclass('FighterModel')
export class FighterModel extends Component {
    @property(SkeletalAnimationComponent)
    public ani: SkeletalAnimationComponent = null!;

    public isAniPlaying: boolean = false;//当前动画是否正在播放

    //是否正在跑
    public get isRunning () {
        return this._aniType === Constant.ANI_TYPE.RUN && this.isAniPlaying === true;
    }

    //是否待机
    public get isIdle () {
        return this._aniType === Constant.ANI_TYPE.IDLE&& this.isAniPlaying === true;
    }

    //是否正在攻击
    public get isAttacking () {
        return this._aniType === Constant.ANI_TYPE.ATTACK && this.isAniPlaying === true;
    } 

    //是否被击中
    public get isHitting () {
        return this._aniType === Constant.ANI_TYPE.HIT && this.isAniPlaying === true;
    } 

    //是否眩晕
    public get isDizzying () {
        return  this._aniType === Constant.ANI_TYPE.DIZZY && this.isAniPlaying === true;
    } 
    
    private _aniType: string = "";//动画类型
    private _aniState: SkeletalAnimationState = null!;//动画播放状态

    public isActick:boolean = false;
    /**
     * 播放玩家动画
     *
     * @param {string} aniType 动画类型
     * @param {boolean} [isLoop=false] 是否循环
     * @param {boolean} [isSkipSameAni=false] 是否跳过同样的动画
     * @param {Function} [callback] 回调函数
     * @param {number} [callback] 调用播放动画的位置，方便用于测试
     * @returns
     * @memberof Player
     */
    public playAni (aniType: string, isLoop: boolean = false, isSkipSameAni: boolean = false, callback?: Function, pos?: number) {
        if(this._aniType == aniType){
            return;
        }

        this._aniState = this.ani?.getState(aniType) as SkeletalAnimationState;

        if (this._aniState && this._aniState.isPlaying) {
            if (isSkipSameAni) {
                this._aniState.time = 0;
                this._aniState.sample();
            } else {
                return;
            }
        }

        this._aniType = aniType;

        this.ani?.play(aniType);
        this.isAniPlaying = true;

        if (this._aniState) {
            if (isLoop) {
                this._aniState.wrapMode = AnimationClip.WrapMode.Loop;    
            } else {
                this._aniState.wrapMode = AnimationClip.WrapMode.Normal;    
            }
        }

        if (!isLoop) {
            this.ani.once(SkeletalAnimationComponent.EventType.FINISHED, ()=>{
                this.isAniPlaying = false;
                callback && callback();
            })
        }
    }

    public attackPlayer(){
        if(this.isActick){
            this.isActick = false;
            GobeUtil.instance.sendFrame({'A': Constant.ACTION.IS_ATTACK_ED});
        }
    }
}
