import { Asset, _decorator, log, native, resources, sys} from 'cc';
import {ClientEvent} from '../framework/clientEvent';
import { Constant } from '../framework/constant';
import { FrameInfo, PlayerInfo, RecvFromServerInfo, Room, RoomInfo } from '../libs/GOBE';
import { PlayerData } from '../framework/playerData';
import { UIManager } from '../framework/uiManager';
import { Util } from '../framework/util';

export enum PLAYER_TYPE{
    READY = 0,
    START = 1,
    END = 2
}

export enum ROOM_TYPE{
    READY = "ready",
    START = "start",
    END = "end"
}

export enum WIFI_TYPE{
    STAND_ALONE = "stand-alone", // 单机模式
    WIFI = "wifi", // 联网模式
}

export class MessageInfo{
    public playerId:string = "";

    public msg:string = "";
}

export class RoomAloneInfo{
    public players:PlayerInfo[] = [];
    public customRoomProperties:string = "";
    public ownerId:string = "";
    public roomCode:string = "";
}

export class GobeUtil {
    private static CLIENT_ID : string = 'CLIENT_ID';          // 需要手动更改
    private static CLIENT_SECRET : string = 'CLIENT_SECRET';  // 需要手动更改
    private static APP_ID: string = 'APP_ID';                 // 需要手动更改

    private static _instance: GobeUtil = null!;
    private _openId: string = "";
    public get openId(){
        return this._openId;
    }

    private _client:GOBE.Client = null!;

    private _room: GOBE.Room = null;
    private _roomAloneInfo:RoomAloneInfo = new RoomAloneInfo();
    public get room(){
        if(this._wifiType == WIFI_TYPE.STAND_ALONE){
            return this._roomAloneInfo;
        }

        return this._room;
    }

    private _ownPlayerId:string = "";
    public get ownPlayerId(){
        return this._ownPlayerId;
    }

    private _roomInfos:RoomInfo[] = [];
    public get roomPlayers(){
        if(this._wifiType == WIFI_TYPE.STAND_ALONE){
            return this._roomAloneInfo.players;
        }
        
        if(this._room){
            return this._room.players;
        }
        else{
            return [];
        }
    }

    public static get instance () {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new GobeUtil();
        return this._instance;
    }

    private _cacertNativeUrl: string = "";

    private _lastRoomId:string = null;
    public get lastRoomId (){
        return this._lastRoomId;
    }

    public set lastRoomId (value:any){
        this._lastRoomId = value;
    }

    private _isInitMedia:boolean = false;

    public get isInitMedia (){
        return this._isInitMedia;
    }

    public set isInitMedia (value:boolean){
        this._isInitMedia = value;
    }

    private _isChannelId:boolean = false;
    public get isChannelId (){
        return this._isChannelId;
    }

    public set isChannelId (value:boolean){
        this._isChannelId = value;
    }

    private _isOpenPgs:boolean = false;
    public get isOpenPgs (){
        return this._isOpenPgs;
    }

    public set isOpenPgs (value:boolean){
        this._isOpenPgs = value;
    }

    private _msgLst:object[] = [];
    public get msgLst (){
        return this._msgLst;
    }

    private _isStartFS:Boolean = false;

    private _isStartGame:boolean = false;
    private _isOtherStartGame:boolean = false;

    private _time:number = 0;

    public get time(){
        if(this.wifiType == WIFI_TYPE.STAND_ALONE){
            return new Date().getTime();
        }

        return this._time;
    }
    
    private _isAi:boolean = false;
    public get isAi(){
        return this._isAi;
    }

    private _hammerIndex:number  = 0;
    public set hammerIndex(v:number){
        this._hammerIndex = v;
    }

    // 房主有没有加入房间
    private _isRoomOwnIn:boolean = false;
    public get isRoomOwnIn(){
        return this._isRoomOwnIn;
    }

    public roomType:ROOM_TYPE = ROOM_TYPE.READY;

    private _isDisJoin:boolean = false;
    public get isDisJoin(){
        return this._isDisJoin;
    }

    private _recvMap:Map<number, FrameInfo[]> = new Map();
    public get recvMap(){
        return this._recvMap;
    }

    private _currFrame:number = 0;
    public get currFrame(){
        return this._currFrame;
    }

    // wifi模式
    private _wifiType:WIFI_TYPE = WIFI_TYPE.WIFI;
    public get wifiType(){
        return this._wifiType;
    }

    // 华为初始化成功
    private _isHwInit:boolean = false;
    public get isHwInit(){
        return this._isHwInit;
    }

    public set isHwInit (value:boolean){
        this._isHwInit = value;
    }

    // 华为登录
    private _isHwLogin:boolean = false;
    public get isHwLogin(){
        return this._isHwLogin;
    }

    public set isHwLogin (value:boolean){
        this._isHwLogin = value;
    }

    private _otherDisInterval : number = 0; // 对手掉线 倒计时 10秒 游戏结束

    public isChangeWifiType:boolean = true; // false 只有单机模式 true 可以切换
    
    // 准备过程中掉线
    private _isReadyDis:boolean = false;

    public serverTimeDis:number = 0; // 服务器与客户端时间间隔

    /**
     * 初始化Mgobe
     * @param openId 玩家唯一标示符
     * @param name 玩家昵称
     * @param headUrl 玩家头像
     * @param callback 回调函数
     * @returns 
     */
    public initSDK(openId: string, callback: Function) {
        this._openId = openId;
        this._getToken(callback);
    }

    /**
     * 获得房间列表
     */
    private _updateAvailableRooms(callback:Function){
        let getAvailableRoomsConfig = {
            offset: '0', // 偏移量
            limit: 10, // 单次请求获取的房间数量
            sync: true, // 是否返回帧同步中的房间
        };
        this._client.getAvailableRooms(getAvailableRoomsConfig).then((infos) => {
            // 查询房间列表成功
            this._roomInfos = infos.rooms;
            callback && callback();

           console.log('aaaaaaaa3 查询房间列表成功', this._roomInfos);
        }).catch((e) => {
            // 查询房间列表失败
            this._roomInfos = [];

           console.log('aaaaaaaa3 查询房间列表失败', e);
        });
    }
    /**
     * 查询
     */
    public updateAvailableRooms(){
        this._updateAvailableRooms(()=>{
            
        });
    }

    /**
     * 检查是否是房主
     */
    public checkIsRoomOwner (id: string) {
        if (!this.room) return false;
        return this.room.ownerId === id;
    }

     /**
     * 检查是否是玩家自己
     */
    public isOwnPlayer(playerId:string){
        return GobeUtil.instance.ownPlayerId == playerId;
    }

    /**
     * 发送帧数据
     * @param info 帧数据
     */
    public sendFrame (info: any) {
        if(this.wifiType == WIFI_TYPE.STAND_ALONE){
            this._recvMap.set(++this._currFrame, [{
                playerId:this._ownPlayerId, 
                data:[JSON.stringify(info)],
                timestamp:0
            }]);
        }else{
            if (!this._room ) return;
            this._room.sendFrame(JSON.stringify(info));
        }
    }

    /**
     * 获取token
     * @param callback 
     */
    private _getToken(callback:Function){
        var url:string = "https://connect-drcn.hispace.hicloud.com/agc/apigw/oauth2/v1/token";
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8');
        xhr.onload = () => {
            if (xhr.status !== 200) {
                return;
            }
            
            console.log("aaaaaaaa3 xhr", xhr.response);
            var info = JSON.parse(xhr.response);
            this._initMgobe(info["access_token"], callback);
        };

        var data = {};
        data = {
            'client_id' : GobeUtil.CLIENT_ID,
            'client_secret' : GobeUtil.CLIENT_SECRET,
            'grant_type' : 'client_credentials',
            'useJwt' : 0
        }

        xhr.send(JSON.stringify(data)); 
    }

    /**
     * 获取证书 url
     * @param token 
     * @param callback 
     */
    private _loadCert(token:string, callback:Function){
        resources.load("/endpoint-cert", Asset, (err, asset) => {
            console.log("aaaaaaaa1 加载证书结束 " + (!err));
            if (err) {
                return;
            }
            
            this._cacertNativeUrl = asset.nativeUrl;
            this._initMgobe(token, callback);
        });
    }

    /**
     * 初始化Mgobe
     * @param callback 回调函数 
     */
    private _initMgobe(token:string, callback:Function) {
        if(sys.Platform.ANDROID == sys.platform
            || sys.Platform.OPENHARMONY == sys.platform){
            if(this._cacertNativeUrl == ""){
                console.log("aaaaaaaa2");
                this._loadCert(token, callback);

                return;
            }
            console.log("aaaaaaaa1 _initMgobe1", token);
            this._client = new GOBE.Client({
                appId: GobeUtil.APP_ID, // 应用ID
                openId: this._openId, // 玩家ID，区别不同用户
                clientId: GobeUtil.CLIENT_ID, // 客户端ID
                clientSecret: GobeUtil.CLIENT_SECRET, // 客户端密钥
                accessToken: token, // AGC接入凭证(推荐)
                platform: GOBE.PlatformType.OTHER,
                cerPath: this._cacertNativeUrl
            });
        }else {
            console.log("aaaaaaaa1 _initMgobe2", token);
            this._client = new GOBE.Client({
                appId: GobeUtil.APP_ID, // 应用ID
                openId: this._openId, // 玩家ID，区别不同用户
                clientId: GobeUtil.CLIENT_ID, // 客户端ID
                clientSecret: GobeUtil.CLIENT_SECRET, // 客户端密钥
                accessToken: token, // AGC接入凭证(推荐)
            });
        }
        
        
        console.log("aaaaaaaa4");
        this._client.onInitResult((resultCode)=>{
            if(resultCode == 0){    
                callback && callback(true);

                // 如果有上次登录的房间
                if(this._lastRoomId){
                    GobeUtil.instance.joinRoom(
                        this._lastRoomId, 
                        ()=>{
                            // 游戏未开始 退出房间
                            if(this._room.customRoomProperties == ROOM_TYPE.READY){
                                this.leaveRoom();
                                this._lastRoomId = null;
                            }else{
                                var info:object = JSON.parse(this._room.customRoomProperties);
                                // 游戏已经结束 退出房间
                                if(info["type"] == ROOM_TYPE.END){
                                    this.leaveRoom();
                                    this._lastRoomId = null;
                                }else{
                                    var time:number = info["time"];
                                    var currTime:number = Math.floor(Constant.GAME_TIME - (new Date().getTime() - time + GobeUtil.instance.serverTimeDis) / 1000);
                                    if(currTime > 5 ){
                                        setTimeout(() => {
                                            // 游戏时间内 重新进入房间
                                            UIManager.instance.showDialog(Constant.PANEL_NAME.READY, null, ()=>{}, true);
                                            UIManager.instance.showTips(Constant.ROOM_TIPS.JOIN_ROOM_SUCCESS);
                                            UIManager.instance.hideDialog(Constant.PANEL_NAME.JOIN_ROOM_PANEL);
                                        }, 500);
                                        
                                        this._isDisJoin = true;
                                    }else{
                                        // 超过游戏时间 退出房间
                                        this.leaveRoom();
                                        this._lastRoomId = null;
                                    }
                                }
                            }

                            console.log("aaaaaaaa2----_lastRoomId reconnect success");
                        }, (error:any)=>{
                            console.log("aaaaaaaa2----_lastRoomId reconnect fail", error);
                        }
                    );
                }
            }
        });

        // 调用Client.init方法进行初始化
        this._client.init().then((client) => {
            // 已完成初始化请求，具体初始化结果通过onInitResult回调获取
            this._ownPlayerId = client.playerId;
            this._lastRoomId = this._client.lastRoomId;
            this.serverTimeDis = client.loginTimestamp - new Date().getTime();
            console.log("aaaaaaaa2 init playerid", client.playerId);
        }).catch((err) => {
            // 初始化请求失败，重新初始化或联系华为技术支持
            console.log("aaaaaaaa2 调用Client.init方法进行初始化error：" , err);
            callback && callback(false);
        });
    }

    /**
     * 开始游戏
     */
    public startGame(){
        if(this._isDisJoin){
            this._isDisJoin = false;
            ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_GAME_START);
        }else{
            this._hammerIndex = 0;
            if(this.wifiType == WIFI_TYPE.STAND_ALONE){
                this._roomAloneInfo.customRoomProperties = JSON.stringify({"type": ROOM_TYPE.START, "time":new Date().getTime()});
                this.roomType = ROOM_TYPE.START;
                this._time = new Date().getTime();
                ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_GAME_START);
            }else{
                if(this._room)
                    this._room.sendToServer(JSON.stringify({'msg': Constant.START_GAME, 'playerId': this._ownPlayerId}));
            }
        }
    }

    /**
     * 创建锤子
     */
    public createHammer(nextTime:number){
        if(this._hammerIndex >= Constant.HAMMER_POS.length){
            return;
        }

        if(this.room){
            this.sendFrame({
                'A' : Constant.ACTION.CREATE_HAMMER, 
                'V' : this._hammerIndex, 
                'X' : Constant.HAMMER_POS[this._hammerIndex][0], 
                'Y' : Constant.HAMMER_POS[this._hammerIndex][1], 
                'Z' : Constant.HAMMER_POS[this._hammerIndex][2],
                'T' : nextTime});
        }
    }

    /**
     * 创建金币
     */
    public createCoin(pos:number[][]){
        if(this.room){
            this.sendFrame({
                'A' : Constant.ACTION.CREATE_ICON,
                'I' : JSON.stringify({'coin_pos': pos})
            })
        }
    }

    /**
     * 结束游戏
     */
    public finishGame(){
        console.log("aaaaaaaa2 finishGame 1");
        if(this._wifiType == WIFI_TYPE.STAND_ALONE){
            console.log("aaaaaaaa2 finishGame 2");
            this._isStartFS = false;
            this._roomAloneInfo.customRoomProperties = JSON.stringify({"type": ROOM_TYPE.END, "time": this._time});
            this._isStartFS = false;
            ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_GAME_END);
        }else{
            console.log("aaaaaaaa2 finishGame 3", this._room && this._room.ownerId == this._ownPlayerId, this._room.ownerId, this._isRoomOwnIn);
            if(this._room && this._room.ownerId == this._ownPlayerId
            || (!this._isRoomOwnIn && this._room.ownerId != this._ownPlayerId)){
                console.log("aaaaaaaa2 finishGame 4");
                if(this._isStartFS){
                    this._isStartFS = false;
                    console.log("aaaaaaaa2 stopFrameSync");
                    this._room.stopFrameSync();
                }
    
                console.log("aaaaaaaa2-------finishGame------")
                this._room.updateRoomProperties({
                    customRoomProperties : JSON.stringify({"type": ROOM_TYPE.END, "time": this._time})
                });
    
                if(!this._isRoomOwnIn){
                    ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_GAME_END);
                }
            }
        }
    }

    
    /**
     * 房间监听信息
     */
    private _enabledEventRoom(){
        this._isStartGame = false;
        this._isOtherStartGame = false;
        this._room.onJoin((playerInfo) => {
            // 加入房间成功，做相关游戏逻辑处理
            console.log("aaaaaaaa2----onJoin 加入", this._room.ownerId, playerInfo.playerId);
            if(this._room.ownerId != playerInfo.playerId){
                ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_OTHER_JOIN_ROOM, playerInfo.playerId);
            }else{
                // 房主加入房间
                this._isRoomOwnIn = true;
            }

            if(playerInfo.playerId != this.ownPlayerId){
                if(this._otherDisInterval > 0){
                    clearInterval(this._otherDisInterval);
                    this._otherDisInterval = 0;
                }
            }

            if(this._room && playerInfo.playerId == this._ownPlayerId
            && this._room.customRoomProperties){
                if(this._room.customRoomProperties == ROOM_TYPE.READY){
                    this.roomType = ROOM_TYPE.READY;
                    this._time = 0;
                }else if(this._room.customRoomProperties == ROOM_TYPE.END){
                    this.roomType = ROOM_TYPE.END;
                    this._time = new Date().getTime() - Constant.GAME_TIME * 1000;
                }else{
                    var info:object = JSON.parse(this._room.customRoomProperties);
                    this.roomType = info["type"];
                    this._time = info["time"];
                }
            }
        });

        // 加入房间失败
        this._room.onJoinFailed((error) => {
            console.log("aaaaaaaa2----onJoinFailed 加入失败", error);
        });

        // 离开房间监听
        this._room.onLeave((player)=>{
               console.log("aaaaaaaa2----onLeave 离开", player.playerId);
                if(player.playerId != this._ownPlayerId){
                    this.updateRoom();
                }
                else{
                    this._room.removeAllListeners();
                }

                if(this._room.ownerId == player.playerId){
                    // 房主离开房间
                    this._isRoomOwnIn = false;
                }
            }
        );

        this._room.onDisconnect((playerInfo) => {
           console.log("aaaaaaaa2 onDisconnect", playerInfo.playerId);
            // 当前玩家断线
            if(playerInfo.playerId === this._room.playerId){
                if(this._room){
                    var interval = setInterval(()=>{
                        console.log("aaaaaaaa2 onDisconnect", interval)
                        if(this._room == null){
                            clearInterval(interval);
                            return;
                        }
                        this._room.reconnect().then(()=>{
                            clearInterval(interval);
                            console.log("aaaaaaaa2----reconnect success");
                        }).catch(()=>{
                            console.log("aaaaaaaa2----reconnect fail");
                        });
                    }, 1000);
                }
            }else{
                this.updateRoom();

                if(this.roomType == ROOM_TYPE.READY){
                    this._isReadyDis = true;
                    var time:number = 10;
                    this._otherDisInterval = setInterval(()=>{
                        UIManager.instance.showTips(Constant.ROOM_TIPS.PLAYER_LEAVE_1 + time + Constant.ROOM_TIPS.PLAYER_LEAVE_2);
                        
                        time--;
                        if(time <= 0){
                            ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_GAME_END);
                            this._room.updateRoomProperties({
                                customRoomProperties : JSON.stringify({"type": ROOM_TYPE.END, "time": 0})
                            });
                            clearInterval(this._otherDisInterval);
                        }
                    }, 1000);
                }
            }

            if(this._room.ownerId == playerInfo.playerId){
                // 房主掉线
                this._isRoomOwnIn = false;
            }
        });

        this._room.onRoomPropertiesChange((roomInfo:RoomInfo)=>{
            console.log("aaaaaaaa2 onRoomPropertiesChange", roomInfo.customRoomProperties);
            var info:object = JSON.parse(roomInfo.customRoomProperties);
            this.roomType = info["type"];
            this._time = info["time"];
            if(info["type"] == ROOM_TYPE.START){
                // 游戏开始
                ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_GAME_START);
            }else if(info["type"] == ROOM_TYPE.END){
                // 游戏结束
                ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_GAME_END);
            }else if(info["type"] == ROOM_TYPE.READY){
                // 游戏结束
            }

            this.updateRoom();
        });

        this._room.onStartFrameSync(()=>{
            console.log("aaaaaaaa2 onStartFrameSync");
            this._isStartFS = true;
            if(!this._isAi){
                this.joinTeamRoom(this._room.ownerId);
                this.joinGroupChannel(this._room.ownerId);
            }
        });

        this._room.onStopFrameSync(()=>{
            console.log("aaaaaaaa2----onStopFrameSync结束帧同步");
            this._isStartFS = false;
            this._currFrame = 0;
            this._recvMap = new Map();
            GobeUtil.instance.mediaLeaveRoom();
            GobeUtil.instance.leaveChannel();
            UIManager.instance.hideDialog(Constant.PANEL_NAME.MEDIA_PANEL);
        });

        this._room.onRecvFromServer((recvFromServerInfo: RecvFromServerInfo)=>{
            console.log("aaaaaaaa2----onRecvFromServer 服务端数据", recvFromServerInfo.msg);
            var msg:string = recvFromServerInfo.msg;
            var info = JSON.parse(msg);
            if(info){
                if(info["msg"] == Constant.START_GAME){
                    if(info["playerId"] != this._ownPlayerId){
                        this._isOtherStartGame = true;
                    }else {
                        this._isStartGame = true;
                    }

                    if(this._room.ownerId == this._ownPlayerId){
                        if(this._isOtherStartGame && this._isStartGame){
                            this._room.sendToServer(Constant.START_GAME_TIME);
    
                            // this._room.startFrameSync();
                            // this._room.updateRoomProperties({
                            //     customRoomProperties : JSON.stringify({"type": ROOM_TYPE.START, "time" : new Date().getTime()})
                            // });
                        }
                    }
                }else if(info["msg"] == Constant.START_GAME_TIME){
                    this.serverTimeDis = info["time"] - new Date().getTime();
                    if(this._room.ownerId == this._ownPlayerId){
                        this._room.startFrameSync();
                        this._room.updateRoomProperties({
                            customRoomProperties : JSON.stringify({"type": ROOM_TYPE.START, "time" : info["time"], "serverTimeDis": this.serverTimeDis})
                        });
                    }
                }
            }
        });

        this._room.onRecvFrame((msg)=>{
            if(msg instanceof Array){
                for(var index:number = 0; index < msg.length; index++){
                    this._time = msg[index].time;
                    if(msg[index].frameInfo){
                        this._recvMap.set(msg[index].currentRoomFrameId, msg[index].frameInfo);
                    }
                }

                this._currFrame = msg[msg.length - 1].currentRoomFrameId;
                ClientEvent.dispatchEvent(Constant.EVENT_NAME.ON_RECV_SYNC);
            }
            else{
                this._time = msg.time;
                if(msg.frameInfo){
                    this._recvMap.set(msg.currentRoomFrameId, msg.frameInfo);
                }

                this._currFrame = msg.currentRoomFrameId;
            }
        });
    }

    /**
     * 创建房间
     * @param callback 创建房间回调函数
     * @returns 
     */
    public createRoomAI(callback:Function, errorCallback:Function) {
        this.serverTimeDis = 0;
        this._isAi = true;
        this._wifiType = WIFI_TYPE.STAND_ALONE;
        this._currFrame = 0;
        this._recvMap = new Map();
        console.log("aaaaaaaa2----createRoomAI 创建房间");
        this._roomAloneInfo = new RoomAloneInfo();
        this._roomAloneInfo.ownerId = this._ownPlayerId;
        this._roomAloneInfo.roomCode = "0001" + Math.floor(Math.random() * 100);
        this._roomAloneInfo.players = [];
        this._roomAloneInfo.players.push({
            playerId : this._ownPlayerId,
            customPlayerProperties : PlayerData.instance.playerInfo["playerName"],
        });
        Util.randomName(1).then((playerName)=>{
            this._roomAloneInfo.players.push({
                playerId : "ai00000",
                customPlayerProperties : playerName,
            });
        });
        
        this._roomAloneInfo.customRoomProperties = JSON.stringify({"type": ROOM_TYPE.READY, "time":0});
        this.roomType = ROOM_TYPE.READY;
        this._time = 0;
        this._isStartFS = true;
        callback && callback();
    }

    /**
     * 创建房间
     * @param callback 创建房间回调函数
     * @returns 
     */
    public createRoom(callback:Function, errorCallback:Function) {
        this._currFrame = 0;
        this._recvMap = new Map();
        this._isAi = false;
        this._wifiType = WIFI_TYPE.WIFI;
        console.log("aaaaaaaa2----createRoom 创建房间");
        this._client.createRoom({
                maxPlayers: 2
            },{customPlayerStatus: 0, customPlayerProperties: PlayerData.instance.playerInfo["playerName"]}).then((room) => {
                this._room = room;
                this._lastRoomId = room.roomId;
                this._enabledEventRoom();

                console.log("aaaaaaaa2 -------READY------")
                this._room.updateRoomProperties({
                    customRoomProperties : JSON.stringify({"type": ROOM_TYPE.READY, "time":0})
                });
                
                callback && callback();
                console.log("aaaaaaaa2----创建房间成功");
            }).catch((e) => {
                errorCallback && errorCallback();

                console.log("aaaaaaaa2----创建房间失败 错误", e);
            }
        );
    }

    /**
     * 加入房间
     * @param roomId 房间号
     */
    public joinRoom(roomId:string, callback:Function,  errorCallback:Function) {
        this._currFrame = 0;
        this._recvMap = new Map();
        this._isAi = false;
        this._wifiType = WIFI_TYPE.WIFI;
        console.log("aaaaaaaa2----joinRoom 加入房间");
        this._client.joinRoom(roomId,
            {customPlayerStatus: 0, customPlayerProperties: PlayerData.instance.playerInfo["playerName"]}).then((room) => {
                // 加入房间中
                this._room = room;
                this._lastRoomId = room.roomId;
                this._enabledEventRoom();

                // 如果加入房间 默认房主在房间里
                if(this._room.players.length == Constant.MAX_PLAYER){
                    this._isRoomOwnIn = true;
                }
                
                console.log("aaaaaaaa2 加入房间成功");
                callback && callback();
            }).catch((e) => {
                console.log("aaaaaaaa2 申请加入房间 错误", e);
                errorCallback && errorCallback(e);
            }
        );
    }

    /**
     * 开始匹配房间
     */
    public matchRoom(callback:Function, errCallback:Function){
        this._currFrame = 0;
        this._recvMap = new Map();
        this._isAi = false;
        this._wifiType = WIFI_TYPE.WIFI;
        console.log("aaaaaaaa2----matchRoom 开始匹配房间");
        this._client.matchRoom({
            matchParams: {},
            maxPlayers: 2,
            customRoomProperties: JSON.stringify({"type": ROOM_TYPE.READY, "time":0})
        },{customPlayerStatus: 0, customPlayerProperties: PlayerData.instance.playerInfo["playerName"]}).then((room:Room)=>{
            console.log("aaaaaaaa2----matchRoom success");
            this._room = room;
            this._lastRoomId = room.roomId;
            this._enabledEventRoom();
            // 如果加入房间 默认房主在房间里
            if(this._room.players.length == Constant.MAX_PLAYER){
                this._isRoomOwnIn = true;
            }

            callback && callback();
        }).catch((e)=>{
            errCallback && errCallback();
            console.log("aaaaaaaa2----matchRoom error", e)
        });
    }

    /**
     * 更新房间信息
     * 
     * @returns 
     */
    public updateRoom(){
        if(this._room == null){
            return;
        }

        this._room.update().then((room) => {
            this._room = room;

            console.log("aaaaaaaa2 updateRoom", room);
        }).catch((e) => {
            // 获取玩家房间最新信息失败
           console.log("aaaaaaaa2 更新房间信息 error", e)
        });
    }

    /**
     * 离开房间
     */
    public leaveRoom(callback?:Function, errorCallback?:Function, isLeaveMedia:boolean = true){
        if(this._isReadyDis ){
            this._isReadyDis = false;
            if(this._room)
                this._room.sendToServer(Constant.DISMISS);
        }

        if(this._lastRoomId && this._client){
            this._client.leaveRoom().then((client)=>{
                console.log("aaaaaaaa2离开房间 成功")
                this._client = client;
                this._client.removeAllListeners();
                this._room && this._room.removeAllListeners();
                this._room = null;
                callback && callback();
            }).catch((e)=>{
                errorCallback && errorCallback(e);
    
               console.log("aaaaaaaa2离开房间 error", e)
            });

            if(isLeaveMedia){
                this.leaveChannel();
                this.mediaLeaveRoom();
                UIManager.instance.hideDialog(Constant.PANEL_NAME.MEDIA_PANEL);
            }
        }else{
            this._roomAloneInfo = null;
            callback && callback();
        }
    }

    /**
     * 判断是否初始化
     * @returns 
     */
    public isInited() {
        // 初始化成功后才有玩家ID
        return !!this._ownPlayerId;
    }

    /**
     * 离开游戏
     */
    public leaveGame(){
        this.isHwLogin = false;
        this._ownPlayerId = "";
        this._roomAloneInfo = null;
        if(this._client){
            this._client.destroy();
            this._client = null;
            
            this._room = null;
            this._ownPlayerId = "";

            this.leaveChannel();
            this.mediaLeaveRoom();
            this.destoryMedia();
            UIManager.instance.hideDialog(Constant.PANEL_NAME.MEDIA_PANEL);

            PlayerData.instance.isInit = false;
        }
    }


    private _isOpenMedia:boolean = false;
    public get isOpenMedia(){
        return this._isOpenMedia;
    }

    public set isOpenMedia(value:boolean){
        this._isOpenMedia = value;
    }

    private _isRemoveMedia:boolean = false;
    public get isRemoveMedia(){
        return this._isRemoveMedia;
    }

    public set isRemoveMedia(value:boolean){
        this._isRemoveMedia = value;
    }

    private _isRemoveChannel:boolean = false;
    public get isRemoveChannel(){
        return this._isRemoveChannel;
    }

    public set isRemoveChannel(value:boolean){
        this._isRemoveChannel = value;
    }

    /**
     * 开启 Media
     */
    public startMedia(openId:string){
        if(sys.platform == sys.Platform.ANDROID){
            console.log("time startMedia:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "startMediaEngine", "(Ljava/lang/String;)V", openId); 
        }
    }

    /**
     * destory Media
     */
    public destoryMedia(){
        if(sys.platform == sys.Platform.ANDROID){
            console.log("time destoryMedia:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "destoryMediaEngine", "()V"); 
        }
    }

     /**
     * 开启 Media
     */
    public joinTeamRoom(roomId:string){
        if(this.isInitMedia && sys.platform == sys.Platform.ANDROID){
            console.log("time joinTeamRoom:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "joinTeamRoom", "(Ljava/lang/String;)V", roomId); 
        }
    }

    /**
     * 离开 Media 房间
     */
    public mediaLeaveRoom(){
        this._msgLst = [];

        if(sys.platform == sys.Platform.ANDROID){
            var obj:object = PlayerData.instance.getSetting("TeamRoom");
            if(obj){
                var roomId = obj[GobeUtil.instance.openId];
                if(roomId && roomId != ""){
                    console.log("time mediaLeaveRoom:" + new Date().getTime());
                    native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "leaveRoom", "(Ljava/lang/String;)V", roomId); 
                }
            }

            this._isOpenMedia = false;
        }
    }

    /**
     * 开启 禁停 四周音
     * @param isOpen  rue禁言 false解禁
     */
    public mediaMuteAllPlayers(isOpen:boolean){
        if(sys.platform == sys.Platform.ANDROID){
            var obj:object = PlayerData.instance.getSetting("TeamRoom");
            if(obj){
                var roomId = obj[GobeUtil.instance.openId];
                if(roomId && roomId != ""){
                    console.log("time mediaMuteAllPlayers:" + new Date().getTime());
                    native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "muteAllPlayers", "(Ljava/lang/String;I)V", roomId, isOpen? 0 : 1); 
                }
            }
        }
    }


    /**
     * 开启/关闭玩家自身麦克风
     * 
     * @param isOpen true开启 false关闭
     */
    public mediaEnableMic(isOpen:boolean){
        if(sys.platform == sys.Platform.ANDROID){
            console.log("time mediaEnableMic:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "enableMic", "(I)V", isOpen? 0 : 1); 
        }
    }

    /**
     * 加入im房间
     * @param roomId 
     */
    public joinGroupChannel(roomId:string){
        if(sys.platform == sys.Platform.ANDROID){
            console.log("time joinGroupChannel:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "joinGroupChannel", "(Ljava/lang/String;)V", roomId); 
        }
    }

    /**
     * 离开im房间
     */
    public leaveChannel(){
        if(sys.platform == sys.Platform.ANDROID){
            var obj:object = PlayerData.instance.getSetting("JoinChannel");
            if(obj){
                var roomId = obj[GobeUtil.instance.openId];
                if(roomId && roomId != ""){
                    console.log("time leaveChannel:" + new Date().getTime());
                    native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "leaveChannel", "(Ljava/lang/String;)V", roomId); 
                }
            }
        }
    }

    /**
     * 发送文本信息
     * @param msg 
     */
    public sendTextMsg(msg:string){
        if(sys.platform == sys.Platform.ANDROID){
            var obj:object = PlayerData.instance.getSetting("JoinChannel");
            var roomId = obj[GobeUtil.instance.openId];
            if(roomId && roomId != ""){
                console.log("time sendTextMsg:" + new Date().getTime());
                native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "sendTextMsg", "(Ljava/lang/String;Ljava/lang/String;)V", roomId, msg); 
            }
        }
    }

    public startRecordAudioToText(){
        if(sys.platform == sys.Platform.ANDROID){
            console.log("time startRecordAudioToText:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "startRecordAudioToText", "()V"); 
        }
    }
    
    public stopRecordAudioToText(){
        if(sys.platform == sys.Platform.ANDROID){
            console.log("time stopRecordAudioToText:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/MediaEngine', "stopRecordAudioToText", "()V"); 
        }
    }

    /**
     * 初始化 内置服务器
     */
    public startForumPage(){
        if(sys.platform == sys.Platform.ANDROID){
            this._isOpenPgs = false;
            console.log("time startForumPage:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/ForumPage', "startPgs", "()V"); 
        }
    }

    /**
     * 打开社区
     */
    public openForumPage(){
        if(sys.platform == sys.Platform.ANDROID){
            console.log("time openForumPage:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/ForumPage', "openForumPage", "()V"); 
        }
    }

     /**
     * check推荐 - 进入
     */
    public forumPageCheckScene(){
        if(sys.platform == sys.Platform.ANDROID){
            console.log("time openForumPage:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/ForumPage', "checkScene", "()V"); 
        }
    }

     /**
     * 开启 Media
     */
     public forumPagePublish(){
        if(sys.platform == sys.Platform.ANDROID){
            console.log("time openForumPage:" + new Date().getTime());
            native.reflection.callStaticMethod('com/cocos/game/ForumPage', "publish", "()V"); 
        }
    }

    /**
     * 检查media是否上次掉线未关闭
     * @returns 
     */
    public checkInitMedia(){
        var obj:object = PlayerData.instance.getSetting("TeamRoom");
        if(obj && obj[GobeUtil.instance.openId]){
            var roomId = obj[GobeUtil.instance.openId];
            if(roomId != '' && roomId != Constant.WORLD_ID){
                GobeUtil.instance.isRemoveMedia = true;
                GobeUtil.instance.joinTeamRoom(roomId);

                return;
            }
        }

        ClientEvent.dispatchEvent(Constant.EVENT_NAME.INIT_MEDIA);
    }

    /**
     * 检查channel是否上次掉线未关闭
     * @returns 
     */
    public checkInitChannel(){
        var obj:object = PlayerData.instance.getSetting("JoinChannel");
        if(obj && obj[GobeUtil.instance.openId]){
            var roomId = obj[GobeUtil.instance.openId];
            if(roomId != '' && roomId != Constant.WORLD_ID){
                GobeUtil.instance.joinGroupChannel(roomId);
                GobeUtil.instance.isRemoveChannel = true;

                return;
            }
        }

        ClientEvent.dispatchEvent(Constant.EVENT_NAME.INIT_CHANNEL);
    }

    // /**
    //  * 初始化obs
    //  */
    // public startObs(){
    //     if(sys.platform == sys.Platform.OHOS){
    //         console.log("time startMedia:" + new Date().getTime());
    //         native.reflection.callStaticMethod('com/example/cocosdemo/ObsControl', "initObs", "()V"); 
    //     }
    // }

    /**
     * 上传排行榜
     */
    public inputRank(){
        var info = JSON.stringify({
            "id":PlayerData.instance.playerInfo["playerId"], 
            "score":PlayerData.instance.playerInfo["score"], 
            "name":PlayerData.instance.playerInfo["playerName"], 
            "icon":"https://huawei-hunter.obs.cn-north-4.myhuaweicloud.com/icon"+PlayerData.instance.playerInfo["icon"]+".png", 
            "staticId":PlayerData.instance.playerInfo["staticId"]});

        var url = 'https://service-nhdz5z7l-1251720271.sh.apigw.tencentcs.com/release/postRank?info=' + info;
        const p = fetch(url, {method:'POST'})
        p.then(res=>res.text()).then(async res=>{
            console.log(res);
        });

        // if(sys.platform == sys.Platform.OHOS){
        //     var json:string = JSON.stringify(PlayerData.instance.playerInfo);
        //     native.reflection.callStaticMethod('com/example/cocosdemo/ObsControl', "putRanks", "(Ljava/lang/String;)V", json); 
        // }
    }

    public hwSignIn(){
        if(sys.platform == sys.Platform.ANDROID){
            native.reflection.callStaticMethod('com/cocos/game/JosAppControl', "signIn", "()V"); 
        }
    }

    public initHuawei(){
        if(sys.platform == sys.Platform.ANDROID){
            native.reflection.callStaticMethod('com/cocos/game/JosAppControl', "initHuawei", "()V"); 
        }
    }
}

// 语音识别
window["callbackToGMMCreate"] = (code:number, msg:string) => {
    console.log("time callbackToGMMCreate:" + new Date().getTime());
    if(code == 0){
        GobeUtil.instance.isInitMedia = true;
        GobeUtil.instance.checkInitMedia();
        GobeUtil.instance.checkInitChannel();
    }

    console.log("-------callbackToGMMCreate", code, msg);
}

window["callbackToGmmJoin"] = (code:number, roomId:string, msg:string) =>{
    console.log("time callbackToGmmJoin:" + new Date().getTime());
    if(code == 0){
        var obj:object = PlayerData.instance.getSetting("TeamRoom");
        if(!obj){
            obj = {};
        }
        obj[GobeUtil.instance.openId] = roomId;
        PlayerData.instance.setSetting("TeamRoom", obj);

        GobeUtil.instance.isOpenMedia = true;
        GobeUtil.instance.mediaEnableMic(false);
        GobeUtil.instance.mediaMuteAllPlayers(false);

        if(GobeUtil.instance.isRemoveMedia){
            GobeUtil.instance.mediaLeaveRoom();

            return;
        }
    }else{
        UIManager.instance.showTips("实时语音开启异常：" + code);
    }

    console.log("------callbackToGmmJoin", code, msg);
    ClientEvent.dispatchEvent(Constant.EVENT_NAME.OPEN_MEDIA);
}

window["callbackToGmmMic"] = (roomId:number, openId:string, isMute:boolean) =>{
    console.log("callbackToGmmMic", roomId, openId, isMute);
}

window["callbackToGmmLeave"] = (code:number, roomId:string, msg:string) =>{
    if(code == 0){
        var obj:object = PlayerData.instance.getSetting("TeamRoom");
        obj[GobeUtil.instance.openId] = "";
        PlayerData.instance.setSetting("TeamRoom", obj);
        if(GobeUtil.instance.isRemoveMedia){
            GobeUtil.instance.isRemoveMedia = false;
            ClientEvent.dispatchEvent(Constant.EVENT_NAME.INIT_MEDIA);
            return;
        }
    }
}

window["callbackToJoinChannel"] = (code:number, roomId:string, msg:string) =>{
    if(code == 0){
        var obj:object = PlayerData.instance.getSetting("JoinChannel");
        if(!obj){
            obj = {};
        }

        obj[GobeUtil.instance.openId] = roomId;
        PlayerData.instance.setSetting("JoinChannel", obj);

        GobeUtil.instance.isChannelId = true;

        if(GobeUtil.instance.isRemoveChannel){
            GobeUtil.instance.leaveChannel();
            return;
        }
    }else{
        UIManager.instance.showTips("文本语音开启异常：" + code);
    }

    console.log("---------callbackToJoinChannel", code, msg);
    ClientEvent.dispatchEvent(Constant.EVENT_NAME.OPEN_CHANNEL);
}

window["callbackToLeaveChannel"] = (code:number, roomId:string, msg:string) =>{
    console.log("time callbackToLeaveChannel:" + new Date().getTime());
    if(code == 0){
        var obj:object = PlayerData.instance.getSetting("JoinChannel");
        obj[GobeUtil.instance.openId] = "";
        PlayerData.instance.setSetting("JoinChannel", obj);

        GobeUtil.instance.isChannelId = false;

        if(GobeUtil.instance.isRemoveChannel){
            GobeUtil.instance.isRemoveChannel = false;
            ClientEvent.dispatchEvent(Constant.EVENT_NAME.INIT_CHANNEL);
        }
    }

    console.log("---------callbackToLeaveChannel", code, msg);
}

window["callbackToSendMsg"] = (content:string, sendId:string) =>{
    console.log("time callbackToSendMsg:" + new Date().getTime());
    GobeUtil.instance.msgLst.push({isOwn:true, content:content, sendId:sendId.substring(5)});
    ClientEvent.dispatchEvent(Constant.EVENT_NAME.SEND_MSG);
}

window["callbackToRecvMsg"] = (content:string, sendId:string) =>{
    console.log("time callbackToRecvMsg:" + new Date().getTime());
    GobeUtil.instance.msgLst.push({isOwn:false, content:content, sendId:sendId.substring(5)});
    ClientEvent.dispatchEvent(Constant.EVENT_NAME.SEND_MSG);

    console.log("callbackToRecvMsg", content);
}

window["callbackToVT"] = (code:number, msg:string) =>{
    console.log("time callbackToVT:" + new Date().getTime());
    if(code == 0){
        ClientEvent.dispatchEvent(Constant.EVENT_NAME.SEND_VT, msg);
    }else{
        ClientEvent.dispatchEvent(Constant.EVENT_NAME.SEND_VT, "");
    }

    console.log("callbackToVT", msg);
}

window["callbackToNoPer"] = () =>{
    console.log("time callbackToNoPer:" + new Date().getTime());
    UIManager.instance.showTips(Constant.ROOM_TIPS.MEDIA_FAIL);
}

window["callbackObsSuccess"] = () =>{
    
}

window["callbackToStartPgs"] = () =>{
    GobeUtil.instance.isOpenPgs = true;
    ClientEvent.dispatchEvent(Constant.EVENT_NAME.OPEN_PGS);
}

window["callbackToJosInit"] = (code:number, msg:string) =>{
    if(code == Constant.HUAWEI_LOGIN.INIT_SUCCESS){
        GobeUtil.instance.isHwInit = true;
    }

    ClientEvent.dispatchEvent(Constant.EVENT_NAME.HUAWEI_LOGIN_MSG, code, msg);
}

