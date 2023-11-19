
import { _decorator, Component, AnimationComponent, director } from 'cc';
import { PoolManager } from '../../framework/poolManager';
const { ccclass, property } = _decorator;

@ccclass('TransitionBgPanel')
export class TransitionBgPanel extends Component {
    private static TRANSITION_IN: string = 'transitionIn';
    private static TRANSITION_OUT: string = 'transitionOut';

    @property(AnimationComponent)
    animation: AnimationComponent = null!;

    show (callback:Function) {
        director.addPersistRootNode(this.node);
        this.animation.play(TransitionBgPanel.TRANSITION_IN);

        this.animation.once(AnimationComponent.EventType.FINISHED, () => {
            this.animation.play(TransitionBgPanel.TRANSITION_OUT);
            this.animation.once(AnimationComponent.EventType.FINISHED, () => {
                director.removePersistRootNode(this.node);
                PoolManager.instance.putNode(this.node);
                callback && callback();
            }); 
        }); 
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
