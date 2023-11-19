import { _decorator, Component, EditBox, Label, Node, Prefab, ProgressBar, ScrollView, UITransform } from 'cc';
import { UIManager } from '../../framework/uiManager';
import { Constant } from '../../framework/constant';
import { GobeUtil } from '../../core/gobeUtil';
import { ClientEvent } from '../../framework/clientEvent';
import { PoolManager } from '../../framework/poolManager';
import { MessageItem } from './message_item';
const { ccclass, property } = _decorator;

@ccclass('MessagePanel')
export class MessagePanel extends Component {
    @property(Node)
    content: Node = null!;

    @property(Prefab)
    leftPrefab:Prefab = null!;
    
    @property(Prefab)
    rightPrefab:Prefab = null!;

    @property(Node)
    startNode:Node = null!;

    @property(Node)
    inputNode:Node = null!;

    @property(EditBox)  
    editBox:EditBox = null!;

    private _currY:number = -45;

    @property(Node)
    voiceInputNode:Node = null!;

    @property(Node)
    voiceNode:Node = null!;

    @property(ProgressBar)
    bar:ProgressBar = null!;

    @property(Label)
    barTxt:Label = null!;

    @property(Label)
    inputTxt:Label = null!;

    @property(UITransform)
    inputSpUIF:UITransform = null!;
    
    @property(UITransform)
    inputTxtUIF:UITransform = null!;

    @property(ScrollView)
    scrollView:ScrollView = null!;

    @property(Label)
    labelTxt:Label = null!;

    // 上一条显示完全
    private _isMsgShow:boolean = false;

    show(isClear:boolean){
        this.startNode.active = true;
        this.inputNode.active = false;
        this.voiceInputNode.active = false;
        this.voiceNode.active = false;

        if(GobeUtil.instance.room == null
        || GobeUtil.instance.room.players.length < 2){
            this.labelTxt.string = Constant.ROOM_TIPS.WORLD_LABEL;
        }else{
            this.labelTxt.string = Constant.ROOM_TIPS.ROOM_LABEL + GobeUtil.instance.room.roomCode;
        }

        if(isClear){
            this._clearItem();
            this._currY = -45;
        }
        
        this._onSendMsg();
    }

    protected onEnable(): void {
        ClientEvent.on(Constant.EVENT_NAME.SEND_MSG, this._onSendMsg, this);
        ClientEvent.on(Constant.EVENT_NAME.SEND_MSG_HEIGHT, this._onSendMsgHeight, this);
        ClientEvent.on(Constant.EVENT_NAME.SEND_VT, this._onSendVT, this);
    }

    protected onDisable(): void {
        ClientEvent.off(Constant.EVENT_NAME.SEND_MSG, this._onSendMsg, this);
        ClientEvent.off(Constant.EVENT_NAME.SEND_MSG_HEIGHT, this._onSendMsgHeight, this);
        ClientEvent.off(Constant.EVENT_NAME.SEND_VT, this._onSendVT, this);
    }

    public onControlIM(){
        this.startNode.active = true;
        this.inputNode.active = false;
        this.voiceInputNode.active = false;

        this.editBox.string = "";
    }

    public onStartIM(){
        this.startNode.active = false;
        this.inputNode.active = true;
    }

    public onClickInput(){
        if(this.editBox.string == ""){
            UIManager.instance.showTips(Constant.ROOM_TIPS.INPUT_MSG);
            return;
        }

        GobeUtil.instance.sendTextMsg(this.editBox.string);
        this.editBox.string = "";

        this.voiceNode.active = false;
        this.voiceInputNode.active = false;
        this.inputNode.active = false;
        this.startNode.active = true;
    }

    public onClickVInput(){
        if(this.inputTxt.string == ""){
            UIManager.instance.showTips(Constant.ROOM_TIPS.INPUT_MSG);
            return;
        }

        GobeUtil.instance.sendTextMsg(this.inputTxt.string);
        this.inputTxt.string = "";

        this.voiceNode.active = false;
        this.voiceInputNode.active = false;
        this.inputNode.active = false;
        this.startNode.active = true;
    }

    /**
     * 显示msg
     */
    private _onSendMsg(){
        if(this._isMsgShow){
            return
        }

        if(GobeUtil.instance.msgLst.length > 0){
            this._isMsgShow = true;    
            var msg:object = GobeUtil.instance.msgLst[0];
            if(msg["isOwn"]){
                var rightN:Node = PoolManager.instance.getNode(this.rightPrefab, this.content);
                rightN.setPosition(45, this._currY, 0);
                rightN.getComponent(MessageItem).show(msg);
            }else{
                var rightN:Node = PoolManager.instance.getNode(this.leftPrefab, this.content);
                rightN.setPosition(45, this._currY, 0);
                rightN.getComponent(MessageItem).show(msg);
            }
            
            GobeUtil.instance.msgLst.splice(0, 1);
       }
    }

    /**
     * 更新height
     * @param height 
     */
    private _onSendMsgHeight(height:number){
        this._isMsgShow = false;
        this._currY -= height - 10;

        this.content.getComponent(UITransform)?.setContentSize(424, this._currY * -1);
        if(this._currY < -570){
            this.scrollView.scrollToBottom(); 
        }

        this._onSendMsg();
    }

    protected update(dt: number): void {
        if(this._isRecording){
            this._recordTime += dt;

            this.bar.progress = this._recordTime * 0.2;
            this.barTxt.string = this._recordTime.toFixed(2) + "秒";

            if(this._recordTime >= 5){
                this.onStopVoice();   
            }
        }
    }

    private _onSendVT(msg:string){
        if(msg == ""){
            UIManager.instance.showTips(Constant.ROOM_TIPS.VT_ERROR);

            this.voiceNode.active = false;
            this.voiceInputNode.active = false;
            this.inputNode.active = false;
            this.startNode.active = true;
            this._isEffectRecording = false;
            
            return;
        }

        if(this._isEffectRecording){
            this.voiceNode.active = false;
            this.voiceInputNode.active = true;
            
            this.inputTxt.string = msg;
            setTimeout(()=>{
                this.inputSpUIF.setContentSize(314, this.inputTxtUIF.contentSize.height + 7);
            });
        }

        this._isEffectRecording = false;
    }

    private _isRecording:boolean = false;
    private _isEffectRecording = false;
    private _recordTime:number = 0;

    public onClickStartVoice(){
        this.voiceNode.active = true;
        this.startNode.active = false;

        GobeUtil.instance.startRecordAudioToText();

        this._isRecording = true;
        this._isEffectRecording = true;
        this._recordTime = 0;
    }

    public onCancelVoice(){
        GobeUtil.instance.stopRecordAudioToText();
        this.voiceNode.active = false;
        this.voiceInputNode.active = false;
        this.startNode.active = true;

        this._isRecording = false;
        this._isEffectRecording = false;
    }

    public onStopVoice(){
        GobeUtil.instance.stopRecordAudioToText();

        this._isRecording = false;
    }

    private _clearItem(){
        var count:number = this.content.children.length;
        for(var index:number = count - 1; index > -1; index --){
            PoolManager.instance.putNode(this.content.children[index]);
        }
    }


}

