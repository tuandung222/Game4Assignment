import { _decorator, Component, Node, Vec3, ModelComponent, geometry, Prefab, clamp } from 'cc';
import { PoolManager } from '../framework/poolManager';
import { Player, Prop, PropType } from './gameState';
import { LogicManager } from './logicManager';
import { Util } from '../framework/util';
import { Constant } from '../framework/constant';
import { EffectManager } from '../framework/effectManager';
import { GobeUtil } from './gobeUtil';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = PropLogic
 * DateTime = Thu Sep 09 2021 15:45:54 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = propLogic.ts
 * FileBasenameNoExtension = propLogic
 * URL = db://assets/script/core/propLogic.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 */
 let v3_1: Vec3 = new Vec3();
 let v3_2: Vec3 = new Vec3();
 let coinWorPos: Vec3 = new Vec3();
@ccclass('PropLogic')
export class PropLogic extends Component {
    @property(Prefab)
    virtualCoinPrefab: Prefab = null!;

    @property(Prefab)
    virtualHammerPrefab: Prefab = null!;

    public indexProp: number = 0;
    private _dicProps: {[index: number]: Node} = {};
    private _parent: LogicManager = null!;

    public init(parent: LogicManager) {
        this._parent = parent;
    }

    /**
     * 重置节点
     */
    public reset() {
        let keyArray: string[]= Object.keys(this._dicProps);
        keyArray.forEach((element: string)=> {
            PoolManager.instance.putNode(this._dicProps[parseInt(element)]);
            delete this._dicProps[parseInt(element)];
        });
    }

    /**
     * 生成虚拟道具
     * @returns 虚拟道具数据
     */
    public initProps() {
        let props: Array<Prop>= [];
        this.indexProp = 0;

        for (let idx: number = 0; idx < 36; idx++) {
            let row = Math.floor(idx / 6);
            let col = Math.floor(idx % 6);

            if (row >= 2 && row <= 3 && col >= 2 && col <= 3) { //中间空出来
                continue;
            }
            props[this.indexProp] = this.generateProp(new Vec3(-9 + col * 3.5, 1, 6 - row * 3));
            this.indexProp++;
        }

        //两横
        for (let idx: number= 0; idx < 7; idx++) {
            props[this.indexProp] = this.generateProp(new Vec3(-18 + idx * 6, 1, -16));
            this.indexProp++;
            props[this.indexProp] = this.generateProp(new Vec3(-18 + idx * 6, 1, 14));
            this.indexProp++;
        }

        //两横
        for (let idx: number= 0; idx < 12; idx++) {
            props[this.indexProp] = this.generateProp(new Vec3(-29 + idx * 5, 1, -24));
            this.indexProp++;
            props[this.indexProp] = this.generateProp(new Vec3(-29 + idx * 5, 1, 22.5));
            this.indexProp++;
        }

        //两竖
        for (let idx: number= 0; idx < 4; idx++) {
            props[this.indexProp] = this.generateProp(new Vec3(-18, 1, -10 + idx * 6));
            this.indexProp++;
            props[this.indexProp] = this.generateProp(new Vec3(18, 1, -10 + idx * 6));
            this.indexProp++;
        }

        //两竖
        for (let idx: number= 0; idx < 5; idx++) {
            props[this.indexProp] = this.generateProp(new Vec3(-29, 1, -10 + idx * 5));
            this.indexProp++;
            props[this.indexProp] = this.generateProp(new Vec3(29, 1, -10 + idx * 5));
            this.indexProp++;
        }

        //两竖
        for (let idx: number= 0; idx < 9; idx++) {
            props[this.indexProp] = this.generateProp(new Vec3(-36, 1, -21 + idx * 5));
            this.indexProp++;
            props[this.indexProp] = this.generateProp(new Vec3(36, 1, -21 + idx * 5));
            this.indexProp++;
        }

        return props;
    }

    /**
     * 移除多余道具
     * @param length 移除数值
     */
    public removeOverProp(length: number) {
        let keyArray = Object.keys(this._dicProps);
        for(let i = length; i < keyArray.length; i++) {
            if (this._dicProps[i]) {
                PoolManager.instance.putNode(this._dicProps[i]);
                delete this._dicProps[i];
            }
        }
    }

     /**
     * 删除指定道具
     *
     * @memberof PropLogic
     */
     public removePropId (propId: number) {
        var prop:Prop = this._parent.currentGameState.props[propId];
        if(prop){
            prop.exist = false;

            if(this._dicProps[prop.id]){
                PoolManager.instance.putNode(this._dicProps[prop.id]);
                delete this._dicProps[prop.id];

                return true;
            }
        }

        return false;
    }

    /**
     * 删除指定道具
     *
     * @memberof PropLogic
     */
    public removeProp (prop: Prop) {
        PoolManager.instance.putNode(this._dicProps[prop.id]);
        delete this._dicProps[prop.id];
        prop.exist = false;
    }

    /**
     * 生成道具数据
     * @param pos 位置
     * @param scale 大小
     * @param type 类型
     * @param belongOpenId 指定玩家才能拾取道具，为""则表示谁都可以拾取
     * @param delay 延迟（金币雨产生的金币会每隔150毫秒展示）
     * @returns 
     */
    public generateProp(pos: Vec3, scale: number = 1, type: PropType = PropType.COIN, belongOpenId: string = "", delay: number = 0) {
        let prop: Prop = {} as Prop;
        prop.id = this.indexProp;
        prop.position = pos;
        prop.scale = scale;
        prop.exist = true;
        prop.type = type;
        this._dicProps[this.indexProp] = this._generatePropNode(prop) as Node;
        return prop;
    }

    /**
     * 生成道具节点
     * @param prop 道具数据
     * @returns 
     */
    private _generatePropNode(prop: Prop) {
        let prefab: Prefab = this.virtualCoinPrefab;if (prop.type === PropType.HAMMER) {
            prefab = this.virtualHammerPrefab;
        } 
        let node: Node = PoolManager.instance.getNode(prefab, this.node);
        node.setWorldPosition(prop.position);
        return node;
    }

    /**
     * 处理人物碰到道具
     * @param player 玩家数据
     * @param ndVirtualPlayer 玩家节点
     */
    public handleProp(player: Player, ndVirtualPlayer: Node, isAi: boolean) {
        let props: {[index: number]: Prop} = this._parent.currentGameState.props;
        let keyPropsArray: Array<string> = Object.keys(this._dicProps);
        let model1: ModelComponent = ndVirtualPlayer.getComponentInChildren(ModelComponent) as ModelComponent;

        keyPropsArray.forEach((value: string) => {
            let prop: Prop = props[parseInt(value)];
            if (prop.type === PropType.HAMMER && player.hammerCount || prop.removed) {
                return;
            }
            let ndProp: Node = this._dicProps[parseInt(value)];
            let distance = Util.getTwoNodeXZLength(ndProp, ndVirtualPlayer);
            if (distance >= 5) {
                return;
            }

            let model2: ModelComponent = ndProp.getComponentInChildren(ModelComponent) as ModelComponent;
            let obb1: geometry.OBB = new geometry.OBB();
            let obb2: geometry.OBB = new geometry.OBB();
            obb1.halfExtents = Vec3.multiplyScalar(v3_1, model1.node.scale, 0.5 * (model1.node.parent as Node).scale.x);
            obb2.halfExtents = Vec3.multiplyScalar(v3_2, model2.node.scale, 0.5 * (model2.node.parent as Node).scale.x);
            obb1.translateAndRotate(model1.node.worldMatrix, model1.node.worldRotation, obb1);
            obb2.translateAndRotate(model2.node.worldMatrix, model2.node.worldRotation, obb2);
                if (geometry.intersect.obbWithOBB(obb1, obb2)) {if (prop.type === PropType.HAMMER && player.hammerCount !== 0) {
                    return;
                }
                if (prop.type === PropType.HAMMER) {
                    prop.removed = true;
                    if(isAi){
                        GobeUtil.instance.sendFrame({'A': Constant.ACTION.HAMMER, 'V': prop.id, 'AI' : 1});
                    }else{
                        GobeUtil.instance.sendFrame({'A': Constant.ACTION.HAMMER, 'V': prop.id});
                    }
                } else if (prop.type === PropType.COIN) {
                    if(this._dicProps[prop.id]){
                        prop.removed = true;
                        if(isAi){
                            GobeUtil.instance.sendFrame({'A': Constant.ACTION.ICON, 'V': prop.id, 'AI' : 1});
                        }else{
                            GobeUtil.instance.sendFrame({'A': Constant.ACTION.ICON, 'V': prop.id});
                        }
                    }else{
                        return;
                    }
                }
            }
        });
    }

    /**
     * 获取随机道具、金币掉落位置
     * @param posWorld 
     * @returns 
     */
    public randomDropPos(posWorld: Vec3, propType: number, radius: number = 6) {
        let posNew: Vec3 | null = new Vec3();
        let i = 0;
        let data: any;
        if (propType === PropType.COIN) {
            data = this.virtualCoinPrefab.data;
        } else if (propType === PropType.HAMMER) {
            data = this.virtualHammerPrefab.data;
        } 

        do {
            //范围逐渐扩大
            let r_1 = (radius + i / 10);
            let r_2 = (radius + i / 10);

            let x = -r_1 + Math.random() * r_1 * 2;
            let z = -r_2 + Math.random() * r_2 * 2;

            x = x + posWorld.x;
            z = z + posWorld.z;

            //限制范围
            x = clamp(x, -28, 28);
            z = clamp(z, -24, 24);

            posNew.set(x, 1, z);

            i++;
            //防止死循环
            if (i >= 50) {
                console.log("randomDropPos,posNew", posNew, "posWorld", posWorld, "propType", propType, "radius", radius);

                posNew = null;
                break;
            }
        } while (!!this._canPlaced(posNew, data));
        return posNew;
    }

    /**
     * 判断位置是否可放置
     * @param pos 位置
     * @param node 放置物体
     * @returns 
     */
    private _canPlaced(pos: Vec3, node: Node) {
        let modelArray: ModelComponent[] = this.node.parent?.getComponentsInChildren(ModelComponent) as ModelComponent[];
        let flag: boolean = false;
        let model1: ModelComponent = node.getComponentInChildren(ModelComponent) as ModelComponent;
        node.setWorldPosition(pos);

        for(let i: number = 0; i < modelArray.length; i++) {
            if (!modelArray[i].node.active) continue;
            let model2: ModelComponent = modelArray[i];
            let obb1: geometry.OBB = new geometry.OBB();
            let obb2: geometry.OBB = new geometry.OBB();
            obb1.halfExtents = Vec3.multiplyScalar(v3_1, model1.node.scale, 0.5 *(model1.node.parent as Node).scale.x);
            obb1.halfExtents.y *= 2;
            obb2.halfExtents = Vec3.multiplyScalar(v3_2, model2.node.scale, 0.5 * (model2.node.parent as Node).scale.x);
            obb1.translateAndRotate(model1.node.worldMatrix, model1.node.worldRotation, obb1);
            obb2.translateAndRotate(model2.node.worldMatrix, model2.node.worldRotation, obb2);
            if (geometry.intersect.obbWithOBB(obb1, obb2)) {
                return true;
            }
        }
        
        return flag;
    }

    /**
     * 获取场景金币数
     * @param props 道具数据
     * @returns 
     */
    public getCoinNum(props: Prop[]) {
        let result: Prop[] = props.filter((value: Prop) => {
            return value.type === PropType.COIN && value.exist;
        });
        return result.length;
    }

     /**
     * 获取场景锤头数
     * @param props 道具数据
     * @returns 
     */
     public getHammerNum(props: Prop[]) {
        let result: Prop[] = props.filter((value: Prop) => {
            return value.type === PropType.HAMMER && value.exist;
        });
        return result.length;
    }

     /**
     * 生成被锤子打击后掉落的金币坐标
     * @param num 金币数
     * @param position 掉落位置
     */
     public createCoinByHammer(num: number, position: Vec3, radius: number = 6) {
        var pos:number[][] = [];

        for(let i: number = 0; i < num; i++) {
            let randomPos = this.randomDropPos(position, PropType.COIN, radius);
            if (randomPos) {
                pos.push([randomPos.x, randomPos.y, randomPos.z]);
            }
        } 

        GobeUtil.instance.createCoin(pos);
    }

    /**
     * 创建金币
     * @param pos 
     */
    public createCoinServer(pos:number[][]){
        for(var index:number = 0; index < pos.length; index ++){
            let prop: Prop = this.generateProp(new Vec3(pos[index][0], pos[index][1], pos[index][2]));
            this._parent.currentGameState.props[this.indexProp] = prop;
            prop.dropPosition = new Vec3(pos[index][0], pos[index][1], pos[index][2]);
            this._dicProps[this.indexProp].setWorldPosition(prop.dropPosition);
            this.indexProp++;
        }
    }
}

