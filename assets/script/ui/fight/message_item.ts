import { _decorator, Component, Label, Node, UITransform } from 'cc';
import { GobeUtil } from '../../core/gobeUtil';
import { ClientEvent } from '../../framework/clientEvent';
import { Constant } from '../../framework/constant';
const { ccclass, property } = _decorator;

@ccclass('MessageItem')
export class MessageItem extends Component {

    @property(Node)
    headBoy: Node = null!;

    @property(Node)
    headGirl: Node = null!;

    @property(UITransform)
    messageUITF:UITransform = null!;

    @property(Node)
    msgTxtNode:Node = null!;

    @property(Label)
    nameTxt:Label = null!;

    // @property(UITransform)
    msgTxtUITF:UITransform = null!;

    // @property(Label)
    msgTxt:Label = null!;

    public show(msg:object){
        if(this.msgTxtUITF == null){
            this.msgTxtUITF = this.msgTxtNode.getComponent(UITransform);
        }
        if(this.msgTxt == null){
            this.msgTxt = this.msgTxtNode.getComponent(Label);
        }

        this.nameTxt.string = msg["sendId"];

        if(msg["isOwn"]){
            if(GobeUtil.instance.room == null){
                this.headBoy.active = false;
                this.headGirl.active = true;
            }
            else if( GobeUtil.instance.checkIsRoomOwner(GobeUtil.instance.ownPlayerId)){
                this.headBoy.active = true;
                this.headGirl.active = false;
            }else{
                this.headBoy.active = false;
                this.headGirl.active = true;
            }
        }else{
            if(GobeUtil.instance.room == null){
                this.headBoy.active = true;
                this.headGirl.active = false;
            }
            else if(GobeUtil.instance.checkIsRoomOwner(GobeUtil.instance.ownPlayerId)){
                this.headBoy.active = false;
                this.headGirl.active = true;
            }else{
                this.headBoy.active = true;
                this.headGirl.active = false;
            }
        }

        this.msgTxt.string = msg["content"];
        
        setTimeout(()=>{
            var height:number = this.msgTxtUITF.contentSize.height;
            this.messageUITF.setContentSize(291, height + 10);

            if(height < 60){
                height = 60;
            }

            ClientEvent.dispatchEvent(Constant.EVENT_NAME.SEND_MSG_HEIGHT, height + 50);
        }, 100);
    }
}

