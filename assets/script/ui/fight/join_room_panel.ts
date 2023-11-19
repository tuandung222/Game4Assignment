import { _decorator, Component, EditBox } from 'cc';
import { GobeUtil } from '../../core/gobeUtil';
import { UIManager } from '../../framework/uiManager';
import { Constant } from '../../framework/constant';
const { ccclass, property } = _decorator;

@ccclass('JoinRoomPanel')
export class JoinRoomPanel extends Component {
    
    @property(EditBox)
    editBox:EditBox = null!;

    private _callback:Function = null!;

    show(callback:Function){
        this.editBox.string = "";
        this._callback = callback;
    }

    onJoinRoom(){
        if(this.editBox.string == ""){
            UIManager.instance.showTips(Constant.ROOM_TIPS.NO_ROOM_ID);

            return;
        }

        GobeUtil.instance.joinRoom(
            this.editBox.string, 
            ()=>{
                UIManager.instance.showDialog(Constant.PANEL_NAME.READY);
                UIManager.instance.showTips(Constant.ROOM_TIPS.JOIN_ROOM_SUCCESS);
                UIManager.instance.hideDialog(Constant.PANEL_NAME.JOIN_ROOM_PANEL);

                this._callback && this._callback();
            }, (error:any)=>{
                UIManager.instance.showTips(Constant.ROOM_TIPS.NO_ROOM_ID);
            }
        );
    }

    onClose(){
        UIManager.instance.hideDialog(Constant.PANEL_NAME.JOIN_ROOM_PANEL);
    }
    

}

