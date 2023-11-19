import { _decorator, Component, JsonAsset, Label, randomRange, Node } from 'cc';
import { GobeUtil, WIFI_TYPE } from '../../core/gobeUtil';
import { UIManager } from '../../framework/uiManager';
import { Constant } from '../../framework/constant';
import { PlayerData } from '../../framework/playerData';
import { ClientEvent } from '../../framework/clientEvent';
import { ResourceUtil } from '../../framework/resourceUtil';
import { Util } from '../../framework/util';
const { ccclass, property } = _decorator;

@ccclass('SelectPanel')
export class SelectPanel extends Component {
    
    @property(Label)
    txtName:Label = null!;

    @property(Label)
    txtCoin:Label = null!;

    @property(Node)
    btnStrategy:Node = null!;

    @property(Node)
    btnCommunity:Node = null!;

    @property(Node)
    btnShare:Node = null!;

    show(){
        if(PlayerData.instance.playerInfo["playerName"] == ""){
            var staticId = PlayerData.instance.playerInfo["playerName"];
            // 随机名字
            Util.randomName(staticId).then((playerName:string)=>{
                this.txtName.string = playerName;
                PlayerData.instance.updatePlayerInfo("playerName", playerName);
            })
        }else{
            this.txtName.string = PlayerData.instance.playerInfo["playerName"];
        }
        
        UIManager.instance.showDialog(Constant.PANEL_NAME.MEDIA_PANEL);
        if(!PlayerData.instance.isInit){
            PlayerData.instance.isInit = true;
            
            GobeUtil.instance.startMedia(GobeUtil.instance.openId);
            GobeUtil.instance.startForumPage();
        }else{
            GobeUtil.instance.joinTeamRoom(Constant.WORLD_ID);
            GobeUtil.instance.joinGroupChannel(Constant.WORLD_ID);
        }

        // 开启 分享
        this._onOpenPgs();
    }
    
    protected onEnable(): void {
        ClientEvent.on(Constant.EVENT_NAME.INIT_MEDIA, this._onInitMedia, this);
        ClientEvent.on(Constant.EVENT_NAME.INIT_CHANNEL, this._onSendChannel, this);
        ClientEvent.on(Constant.EVENT_NAME.OPEN_PGS, this._onOpenPgs, this);
    }

    protected onDisable(): void {
        ClientEvent.off(Constant.EVENT_NAME.INIT_MEDIA, this._onInitMedia, this);
        ClientEvent.off(Constant.EVENT_NAME.INIT_CHANNEL, this._onSendChannel, this);
        ClientEvent.off(Constant.EVENT_NAME.OPEN_PGS, this._onOpenPgs, this);

        UIManager.instance.hideDialog(Constant.PANEL_NAME.MEDIA_PANEL);
    }

    /**
     * 开启分享
     */
    private _onOpenPgs(){
        this.btnCommunity.active = GobeUtil.instance.isOpenPgs;
        this.btnStrategy.active = GobeUtil.instance.isOpenPgs && GobeUtil.instance.isHwLogin;
        this.btnShare.active = GobeUtil.instance.isOpenPgs && GobeUtil.instance.isHwLogin;
    }

    private _onInitMedia(){
        GobeUtil.instance.joinTeamRoom(Constant.WORLD_ID);
    }

    private _onSendChannel(){
        GobeUtil.instance.joinGroupChannel(Constant.WORLD_ID);
    }

    public onOpenForumPage(){
        GobeUtil.instance.openForumPage();
    }

    public onForumPageCheckScene(){
        GobeUtil.instance.forumPageCheckScene();
    }

    public onForumPagePublish(){
        GobeUtil.instance.forumPagePublish();
    }

    /**
     * 人机模式
     */
    onCreateRoomAi(){
        GobeUtil.instance.createRoomAI(()=>{
            UIManager.instance.showDialog(Constant.PANEL_NAME.READY);
        },()=>{
            UIManager.instance.showTips(Constant.ROOM_TIPS.CREATE_ROOM_ERROR);
        });
    }

    /**
     * 创建room
     */
    onCreateRoom(){
        GobeUtil.instance.createRoom(()=>{
            UIManager.instance.showDialog(Constant.PANEL_NAME.READY);
        },()=>{
            UIManager.instance.showTips(Constant.ROOM_TIPS.CREATE_ROOM_ERROR);
        });
    }

    /**
     * 加入room
     */
    onJoinRoom(){
        UIManager.instance.showDialog(Constant.PANEL_NAME.JOIN_ROOM_PANEL,[()=>{
            // UIManager.instance.hideDialog(Constant.PANEL_NAME.SELECT_GAME);
        }]);
    }

    /**
     * 随机匹配
     */
    onMatchRoom(){
        UIManager.instance.showDialog(Constant.PANEL_NAME.MATCH_PANEL);
        GobeUtil.instance.matchRoom(()=>{
            UIManager.instance.showDialog(Constant.PANEL_NAME.READY);
            UIManager.instance.showTips(Constant.ROOM_TIPS.JOIN_ROOM_SUCCESS);
            UIManager.instance.hideDialog(Constant.PANEL_NAME.MATCH_PANEL);
        },()=>{
            // UIManager.instance.showTips(Constant.ROOM_TIPS.MATCH_ROOM_ERROR);
            // UIManager.instance.hideDialog(Constant.PANEL_NAME.MATCH_PANEL);
        });
    }

    /**
     * 退出账号
     */
    onLeaveClient(){
        UIManager.instance.showDialog(Constant.PANEL_NAME.TIP_PANEL, [Constant.ROOM_TIPS.LEAVE_GAME, ()=>{
            GobeUtil.instance.leaveGame();
            UIManager.instance.hideDialog(Constant.PANEL_NAME.SELECT_GAME);
            UIManager.instance.showDialog(Constant.PANEL_NAME.START_GAME);
        }]);
    }
}

