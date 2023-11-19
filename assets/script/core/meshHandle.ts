
import { _decorator, Component, Node, MeshRenderer } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = MeshHandle
 * DateTime = Wed Sep 01 2021 17:11:20 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = meshHandle.ts
 * FileBasenameNoExtension = meshHandle
 * URL = db://assets/script/fight/meshHandle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
 
@ccclass('MeshHandle')
export class MeshHandle extends Component {
    @property({serializable: true})
    _showMesh = true;

    @property
    set showMesh (value: boolean) {
        this._showMesh = value;
        this.handleMesh();
    }

    get showMesh () {
        return this._showMesh;
    }

    start () {
        if (typeof Editor === 'undefined') return;
        
        this.handleMesh();
    }

    /**
     * 障碍物碰撞范围显示
     * @param node 
     */
    handleMesh (node: Node | null = null) {
        node = node || this.node;

        let meshRenderer = node.getComponent(MeshRenderer)
        if (meshRenderer) {
            meshRenderer.enabled = this._showMesh;
        }

        let children = node.children;
        for (let i = 0, c = children.length; i < c; i++) {
            this.handleMesh(children[i]);
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
