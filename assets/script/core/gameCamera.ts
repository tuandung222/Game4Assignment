import { _decorator, Component, Node, CameraComponent, Vec3, Camera } from "cc";
const { ccclass, property } = _decorator;

let vec_1:Vec3 = new Vec3();
let vec_2:Vec3 = new Vec3();
@ccclass("GameCamera")
export class GameCamera extends Component {

    @property(Camera)
    camera:Camera = null!;

    private _targetNode:Node = null;

    private _isUpdate:boolean = false;    

    start () {
        // Your initialization goes here.
        window.mainCamera = this.camera.getComponent(CameraComponent);
    }

    public init(targetNode:Node): void {
        this._targetNode = targetNode;

        this.node.setPosition(this._targetNode.position);
        this.node.setRotationFromEuler(0, 180, 0);
        this.node.children[0].setRotationFromEuler(-60, -180, 0);
        this.node.children[0].setPosition(0, 34, -17);
    }

    public startGame(){
        this._isUpdate = true;
    }

    public finishGame(){
        this._isUpdate = false;
    }

    update (deltaTime: number) {
        if(this._isUpdate){
            Vec3.lerp(vec_1, this.node.position, this._targetNode.position, 0.1);
            this.node.setPosition(vec_1);
        }
    }
}
