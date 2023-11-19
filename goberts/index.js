'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const gameServer = {
    // 销毁房间回调接口
    onDestroyRoom(args) {
    },
    // 创建房间回调接口
    onCreateRoom(args) {
    },
    // 实时服务器websocket连接建立回调接口
    onRealTimeServerConnected(args) {
    },
    // 实时服务器websocket连接断开回调接口
    onRealTimeServerDisconnected(args) {
    },
    // 建立连接回调接口
    onConnect(args) {
    },
    // 断开连接回调接口
    onDisconnect(args) {
    },
    // 加入房间回调接口
    onJoin(playerInfo, args) {
    },
    // 离开房间回调接口
    onLeave(playerInfo, args) {
    },
    // 接收帧消息回调接口
    onRecvFrame(msg, args) {
    },
    // // 接收客户端消息回调接口
    onRecvFromClient(args) {
        if(args.gameData == "dismiss"){
            // 解散房间
            args.SDK.dismiss().then(() => {

            }).catch(err => {

            })
        }
        else if(args.gameData == "start_game_time"){
            var info = {msg:"start_game_time", time:(new Date).getTime()};
            args.SDK.sendData(JSON.stringify(info)).then( ()=> {
            // 发送游戏数据成功
            }).catch( err => {
                // 发送游戏数据失败
            });
        }
        else{
            args.SDK.sendData(args.gameData).then( ()=> {
            // 发送游戏数据成功
            }).catch( err => {
                // 发送游戏数据失败
            });
        }
    },
    // 房间信息更新回调接口
    onRoomPropertiesChange(msg, args) {
        
    },
    // 开始帧同步回调接口
    onStartFrameSync(args) {

    },
    // 停止帧同步回调接口
    onStopFrameSync(args) {

    },
    // 玩家属性更新回调接口
    onUpdateCustomProperties(player, args) {
    },
    // 玩家状态更新回调接口
    onUpdateCustomStatus(msg, args) {
    },
    // 请求补帧错误回调接口
    onRequestFrameError(error, args) {
    }
};
const gobeDeveloperCode = {
    gameServer: gameServer,
    appId: 'appId', // 需要手动修改
};

exports.gobeDeveloperCode = gobeDeveloperCode;
