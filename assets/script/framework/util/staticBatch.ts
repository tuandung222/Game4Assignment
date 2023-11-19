import { _decorator, Component, Node, BatchingUtility } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StaticBatch')
export class StaticBatch extends Component {

    @property([Node])
    needBatches: Node[] = [];

    start () {
        this.needBatches.forEach((node)=>{
            BatchingUtility.batchStaticModel(node, this.node);
        })
    }
}
