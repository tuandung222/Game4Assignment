import GOBERTS, {FrameInfo} from './GOBERTS';

const gameServer: GOBERTS.GameServer = {
    onDestroyRoom(args: GOBERTS.ActionArgs): void {
        // do something
    },
    onCreateRoom(args: GOBERTS.ActionArgs): void {
        args.SDK.getRoomInfo().then( rommInfo => {
            // 获取房间信息成功
        }).catch( err => {
            // 获取房间信息失败
        });
    },
    onRealTimeServerConnected(args: GOBERTS.ActionArgs): void {
        // do something
    },
    onRealTimeServerDisconnected(args: GOBERTS.ActionArgs): void {
        // do something
    },
    onConnect(args: GOBERTS.ActionArgs): void {
        // do something
    },
    onDisconnect(args: GOBERTS.ActionArgs): void {
        // do something
    },

    onJoin(playerInfo: GOBERTS.FramePlayerInfo, args: GOBERTS.ActionArgs): void {
        // do something
    },
    onLeave(playerInfo: GOBERTS.FramePlayerInfo, args: GOBERTS.ActionArgs): void {
        // do something
    },
    onRecvFrame(msg:GOBERTS.RecvFrameMessage | GOBERTS.RecvFrameMessage[], args: GOBERTS.ActionArgs):void {
        let unhandleFrames: GOBERTS.RecvFrameMessage[] = Array.isArray(msg)? msg : [msg];

        unhandleFrames.forEach(message => {
            // seed frames which do not have user data
            if (!message.frameInfo || message.frameInfo.length < 1) {

                return;
            };

            // frames which have user data
            message.frameInfo.forEach((frameData: FrameInfo) => {
                let frameDataList: string[] = frameData.data;
                if (frameDataList && frameDataList.length > 0) {
                    frameDataList.forEach(res => {
                        args.SDK.log.info('frameData=' + res);
                    });
                }
            });
        });
    },
    onRecvFromClient(args: GOBERTS.ActionArgs): void {
        args.SDK.getCache('example').then( value => {
            // 获取缓存成功
        }).catch( err => {
            // 获取缓存失败
        });
    },
    onRecvFromClientV2(msg: GOBERTS.RecvFromClientInfo, args: GOBERTS.ActionArgs): void {
        // do something, onRecvFromClientV2和onRecvFromClient使用一个即可，推荐使用V2
    },
    onRoomPropertiesChange(msg: GOBERTS.FrameRoomInfo, args: GOBERTS.ActionArgs): void {
        // do something
    },
    onStartFrameSync(args: GOBERTS.ActionArgs): void {
        // do something
    },
    onStopFrameSync(args: GOBERTS.ActionArgs): void {
        // do something
    },
    onUpdateCustomProperties(player: GOBERTS.FramePlayerPropInfo, args: GOBERTS.ActionArgs): void {
        // do something
    },
    onUpdateCustomStatus(msg: GOBERTS.FramePlayerStatusInfo, args: GOBERTS.ActionArgs): void {
        // do something
    },
    onRequestFrameError(error: GOBERTS.GOBEError, args: GOBERTS.ActionArgs): void {
        // do something
    }
}

export const gobeDeveloperCode = {
    gameServer: gameServer,
    appId: 'your appId',
};