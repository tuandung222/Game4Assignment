import { _decorator, Component, AnimationComponent} from "cc";
import { AudioManager } from "../../framework/audioManager";
import { Constant } from "../../framework/constant";
const { ccclass, property } = _decorator;

@ccclass("readyGo")
export class readyGo extends Component {

    @property(AnimationComponent)
    ani: AnimationComponent = null!;

    show (callback: Function) {
        this.ani.play();
        this.ani.once(AnimationComponent.EventType.FINISHED, ()=>{
            callback && callback();
        });
    }

    tick () {
        AudioManager.instance.playSound(Constant.AUDIO_NAME.TICK);
    }

    go () {
        AudioManager.instance.playSound(Constant.AUDIO_NAME.GO);
    }
}
