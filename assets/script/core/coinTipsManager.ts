import { _decorator, Component, Node, Prefab, Vec3, LabelComponent, Tween } from "cc";
import {PoolManager} from "../framework/poolManager";
import {ClientEvent} from "../framework/clientEvent";
const { ccclass, property } = _decorator;

@ccclass("coinTipsManager")
export class coinTipsManager extends Component {
    @property(Prefab)
    pfCoinTips: Prefab = null!;

    onEnable() {
        ClientEvent.on('showCoinTips', this.showCoinTips, this);
    }

    onDisable() {
        ClientEvent.off('showCoinTips', this.showCoinTips, this);
    }

    showCoinTips (coin: string, posWorld: Vec3) {
        let tipsNode = PoolManager.instance.getNode(this.pfCoinTips, this.node);

        let out = new Vec3();
        //@ts-ignore
        window.mainCamera.convertToUINode(posWorld, this.node, out);

        tipsNode.setPosition(out);

        let nodeNum = tipsNode.getChildByName('num');
        if (nodeNum) {
            nodeNum.getComponent(LabelComponent).string = coin;
        }

        //播放动画
        tipsNode.setScale(0, 0, 0)
        tipsNode['tweenMove'] = new Tween(tipsNode)
            .to(0.3, {scale: new Vec3(1.2, 1.2, 1.2)})
            .to(0.1, {scale: new Vec3(1, 1, 1)})
            .by(0.6, {position: new Vec3(0, 100, 0)})
            .union()
            .call(()=>{
                tipsNode['tweenMove'] = null;
                PoolManager.instance.putNode(tipsNode);
            })
            .start();
    }

    /**
     * 如果界面切换需要对tips进行回收
     */
    recrycle () {
        let arrChild: Node[] = [];
        this.node.children.forEach((child: Node)=>{
            arrChild.push(child);
        });

        arrChild.forEach((child: Node)=>{
            //@ts-ignore
            if (child['tweenMove']) {
                //@ts-ignore
                child['tweenMove'].stop();
                //@ts-ignore
                child['tweenMove'] = null;
            }

            PoolManager.instance.putNode(child);
        })

    }
}
