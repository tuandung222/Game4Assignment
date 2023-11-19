import { _decorator, Node, Prefab, AnimationComponent, ParticleSystemComponent, Vec3, find, AnimationState, AnimationClip, director } from 'cc';
import { PoolManager } from './poolManager';
import { ResourceUtil } from './resourceUtil';

const { ccclass, property } = _decorator;

@ccclass('EffectManager')
export class EffectManager{
    private _ndParent: Node = null!;
    public get ndParent() {
        if (!this._ndParent) {
            let ndEffectParent = find("effectManager") as Node;

            if (ndEffectParent) {
                this._ndParent = ndEffectParent;
            } else {
                // console.warn("请在场景里添加effectManager节点");
                this._ndParent = new Node("effectManager");
                director.getScene()?.addChild(this._ndParent);
            }
        }

        return this._ndParent;
    }

    static _instance: EffectManager;

    static get instance () {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new EffectManager();
        return this._instance;
    }

    /**
     * 播放动画
     * @param {string} path 动画节点路径
     * @param {string} aniName 
     * @param {vec3} worPos 世界坐标
     * @param {boolean} isLoop 是否循环
     * @param {boolean} isRecycle 是否回收
     * @param {number} [scale=1] 缩放倍数 
     * @param {Function} [callback=()=>{}] 回调函数 
     */
    public playAni (path: string, aniName: string, worPos: Vec3 = new Vec3(),  isLoop: boolean = false,  isRecycle: boolean = false, scale: number = 1, callback: Function = ()=>{}) {
        let childName: string = path.split("/")[1];
        let ndEffect: Node | null = this.ndParent.getChildByName(childName);

        let cb = ()=>{
            ndEffect?.setScale(scale, scale, scale);
            ndEffect?.setWorldPosition(worPos); 
            let ani: AnimationComponent= ndEffect?.getComponent(AnimationComponent) as AnimationComponent;
            ani.play(aniName);
            let aniState: AnimationState= ani.getState(aniName) as AnimationState;
            if (aniState) {
                if (isLoop) {
                    aniState.wrapMode = AnimationClip.WrapMode.Loop;    
                } else {
                    aniState.wrapMode = AnimationClip.WrapMode.Normal;    
                }
            }

            ani.once(AnimationComponent.EventType.FINISHED, ()=>{
                callback && callback();
                if (isRecycle && ndEffect) {
                    PoolManager.instance.putNode(ndEffect);
                }
            })
        }

        if (!ndEffect) {
            ResourceUtil.loadEffectRes(path).then((prefab: unknown)=>{
                ndEffect = PoolManager.instance.getNode(prefab as Prefab, this.ndParent) as Node;
                ndEffect.setScale(scale, scale, scale);
                ndEffect.setWorldPosition(worPos);                
                cb();
            })
        } else {
          cb();
        }
    }

    /**
     * 移除特效
     * @param {string} name  特效名称
     * @param {Node}} ndParent 特效父节点
     */
    public removeEffect (name: string, ndParent: Node = this.ndParent) {
        let ndEffect: Node | null = ndParent.getChildByName(name);
        if (ndEffect) {
            let arrAni: AnimationComponent[] = ndEffect.getComponentsInChildren(AnimationComponent);
            arrAni.forEach((element: AnimationComponent)=>{    
                element.stop();
            })

            let arrParticle: [] = ndEffect?.getComponentsInChildren(ParticleSystemComponent) as any;
            arrParticle.forEach((element:ParticleSystemComponent)=>{
                element?.clear();
                element?.stop();
            })
            PoolManager.instance.putNode(ndEffect);        
        }
    }

    /**
     * 播放粒子特效
     * @param {string} path 特效路径
     * @param {vec3}worPos 特效世界坐标 
     * @param {number} [recycleTime=0] 特效节点回收时间，如果为0，则使用默认duration
     * @param  {number} [scale=1] 缩放倍数
     * @param {vec3} eulerAngles 特效角度
     * @param {Function} [callback=()=>{}] 回调函数
     */
    public playParticle (path: string, worPos: Vec3,  recycleTime: number = 0, scale: number = 1, eulerAngles?: Vec3 | null, callback?: Function) {
        ResourceUtil.loadEffectRes(path).then((prefab: any)=>{
            let ndEffect: Node = PoolManager.instance.getNode(prefab as Prefab, this.ndParent) as Node;
            ndEffect.setScale(scale, scale, scale);
            ndEffect.setWorldPosition(worPos);  
            
            if (eulerAngles) {
                ndEffect.eulerAngles = eulerAngles;
            }
            
            let maxDuration: number = 0;

            let arrParticle:  ParticleSystemComponent[]= ndEffect.getComponentsInChildren(ParticleSystemComponent);
            arrParticle.forEach((item: ParticleSystemComponent)=>{
                item.simulationSpeed = 1;
                item?.clear();
                item?.stop();
                item?.play()

                let duration: number= item.duration;
                maxDuration = duration > maxDuration ? duration : maxDuration;
            })

            let seconds: number = recycleTime && recycleTime > 0 ? recycleTime : maxDuration;

            setTimeout(()=>{
                if (ndEffect.parent) {
                    callback && callback();
                    PoolManager.instance.putNode(ndEffect);
                }
            }, seconds * 1000)  
        })
    }

    /**
     * 播放节点下面的动画和粒子
     *
     * @param {Node} targetNode 特效挂载节点
     * @param {string} effectPath 特效路径
     * @param {boolean} [isPlayAni=true] 是否播放动画
     * @param {boolean} [isPlayParticle=true] 是否播放特效
     * @param {number} [recycleTime=0] 特效节点回收时间，如果为0，则使用默认duration
     * @param {number} [scale=1] 缩放倍数
     * @param {Vec3} [pos=new Vec3()] 位移
     * @param {boolean} [isRecycle=true] 回收或者销毁
     * @param {Function} [callback=()=>{}] 回调函数
     * @returns
     * @memberof EffectManager
     */
    public playEffect (targetNode: Node, effectPath: string, isPlayAni: boolean = true, isPlayParticle: boolean = true, recycleTime: number = 0, scale: number = 1, pos?: Vec3 | null, eulerAngles?: Vec3 | null, isRecycle: boolean = true, callback?: Function | null) {
        if (!targetNode || !targetNode.parent) {//父节点被回收的时候不播放
            return;
        }

        ResourceUtil.loadEffectRes(effectPath).then((prefab: any)=>{
            let ndEffect: Node = PoolManager.instance.getNode(prefab as Prefab, targetNode) as Node;
            ndEffect.setScale(scale, scale, scale);

            if (pos) {
                ndEffect.setPosition(pos);
            }

            if (eulerAngles) {
                ndEffect.eulerAngles = eulerAngles;
            }
            
            let maxDuration: number = 0;

            if (isPlayAni) {
                let arrAni: AnimationComponent[] = ndEffect.getComponentsInChildren(AnimationComponent);
    
                if (arrAni.length) {
                    arrAni.forEach((element: AnimationComponent, idx: number)=>{
                        element?.play();
                        
                        let aniName = element?.defaultClip?.name;
                        if (aniName) {
                            let aniState = element.getState(aniName);
                            if (aniState) {
                                aniState.time = 0;
                                aniState.sample();
                                
                                let duration = aniState.duration;
                                maxDuration = duration > maxDuration ? duration : maxDuration;
    
                                aniState.speed = 1;
                            }
                        }
                    })
                }
            }
    
            if (isPlayParticle) {
                let arrParticle: ParticleSystemComponent[]= ndEffect.getComponentsInChildren(ParticleSystemComponent);
                
                if (arrParticle.length) {
                    arrParticle.forEach((element:ParticleSystemComponent)=>{
                        element.simulationSpeed = 1;
                        element?.clear();
                        element?.stop();
                        element?.play()
        
                        let duration: number= element.duration;
                        maxDuration = duration > maxDuration ? duration : maxDuration;
                    })
                }
            }
    
            let seconds: number = recycleTime && recycleTime > 0 ? recycleTime : maxDuration;
            
            setTimeout(()=>{
                if (ndEffect.parent) {
                    callback && callback();
                    if (isRecycle) {
                        PoolManager.instance.putNode(ndEffect);
                    } else {
                        ndEffect.destroy();
                    }
                }
            }, seconds * 1000)   
        })
    }

    /**
     * 播放节点上的粒子特效/托尾粒子特效
     *
     * @param {Node} ndParent
     * @memberof EffectManager
     */
    public playTrail (ndParent: Node, recycleTime:number = 0, callback?:Function, speed: number = 1) {
        let maxDuration: number = 0;

        if (!ndParent.active) {
            ndParent.active = true;
        }

        let arrParticle: ParticleSystemComponent[]= ndParent.getComponentsInChildren(ParticleSystemComponent);
        arrParticle.forEach((element:ParticleSystemComponent)=>{
            element.simulationSpeed = speed;
            element?.clear();
            element?.stop();
            element?.play();

            let duration: number= element.duration;
            maxDuration = duration > maxDuration ? duration : maxDuration;
        })

        if (callback) {
            let seconds: number = recycleTime && recycleTime > 0 ? recycleTime : maxDuration;

            setTimeout(()=>{
                callback();
            }, seconds * 1000)  
        }
    }

    /**
     * 播放道具消失特效
     * @param {string} path 特效路径
     * @param {vec3}worPos 特效世界坐标 
     * @param {Function} [callback=()=>{}] 回调函数
     */
    public playDisappearEff (path: string, worPos: Vec3, cb: Function) {
        ResourceUtil.loadEffectRes(path).then((prefab: any)=>{
            let ndEffect: Node = PoolManager.instance.getNode(prefab as Prefab, this.ndParent) as Node;
            ndEffect.setWorldPosition(worPos);  
            
            let maxDuration: number = 0;

            let arrParticle:  ParticleSystemComponent[]= ndEffect.getComponentsInChildren(ParticleSystemComponent);
            arrParticle.forEach((item: ParticleSystemComponent)=>{
                item.simulationSpeed = 1;
                item?.clear();
                item?.stop();
                item?.play()

                let duration: number= item.duration;
                maxDuration = duration > maxDuration ? duration : maxDuration;
            })

            setTimeout(()=>{
                if (ndEffect && ndEffect.parent) {
                    PoolManager.instance.putNode(ndEffect);
                }
            }, maxDuration * 1000) 

            cb && cb(()=>{
                if (ndEffect && ndEffect.parent) {
                    PoolManager.instance.putNode(ndEffect);
                }
            });
        })
    }
}
