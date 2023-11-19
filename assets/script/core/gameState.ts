
import { _decorator, Vec3 } from 'cc';

/**
 * Predefined variables
 * Name = GameState
 * DateTime = Wed Sep 01 2021 11:40:25 GMT+0800 (中国标准时间)
 * Author = yanli.huang
 * FileBasename = GameState.ts
 * FileBasenameNoExtension = GameState
 * URL = db://assets/script/fight/GameState.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
 export enum PropType {     //道具类型  
    NULL = 0,
    COIN = 1,               //金币
    HAMMER = 2,             //锤头 
    // IS_HAMMER = 2,             //锤头 
    RAINING_COIN = 3,          //金币雨
    HAMMER_ED = 4,             //被锤头攻击 
}

 export interface Channel{    
    openId: string,         //玩家渠道id
    name: string,           //玩家昵称
    headUrl: string,        //玩家头像
    state: number,      //玩家状态
    delayTime: number   //延迟时间
}

 export interface Player{ //道具信息
    playId:number,
    id: number,         //道具信息
    channel: Channel,       //玩家渠道信息
    position: Vec3,     //玩家位置
    eulerAngles: Vec3,  //玩家旋转信息
    score: number,          //玩家积分
    isShowReward: boolean,//是否奖励20个金币
    isScoreLead: boolean,//是否分数领先
    attackPos: Vec3 | null,     //攻击位置
    attackId: number,       //攻击玩家id
    attackPropType: PropType,//攻击的道具类型
    hammerCount: number,        //锤子可击打次数
    dizzyTime: number,      //眩晕时间
    dizzyOverTime: number,//被榴莲或者锤子击中后眩晕结束时间（frameTime大于这个玩家才能移动）
    moveX:number, // 手柄左右方向
    moveY:number // 手柄上下方向
}

export interface Prop{      //道具信息
    id: number,             //道具id
    position: Vec3,//道具位置
    dropPosition: Vec3,//金币道具掉落位置
    scale: number,//道具大小
    exist: boolean,//是否展示
    type: PropType,//道具类型
    removed: boolean, // 移除
}

export interface GameState{
    id: number,             //逻辑帧标示符
    time: number,//剩余时间
    frameTime: number,//当前帧的时间
    props: Array<Prop>,//道具信息
    players: Array<Player>,//玩家信息
    createHammerTime: number,//创建锤头的时间
    createCoinTime: number, //创建金币的时间
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
