//EventManager.js

import socketInstance from "./SocketSingletonClass.js";

class SocketEventManager {

    constructor() {
        this.socket = socketInstance.getSocket();
    }

    createRoom() {
        console.log("createRoom");
        this.socket.emit('createRoom');

    }

    joinRoom(roomId,userData) {
        this.socket.emit('joinRoom',{roomId,userData});
    }

    toggleAudio(roomId){
        this.socket.emit('toggleAudio',roomId);
    }

    toggleVideo(roomId){
        this.socket.emit("toggleVideo",roomId);
    }
 

    hangUp(roomId){
        this.socket.emit("LeaveRoom",{roomId});
    }
    
    sendOffer(roomId,offer,receiver_SocketId){
        this.socket.emit("offer",{roomId,offer,receiver_SocketId});
    }
    
    sendAnswer(roomId,answer,receiver_SocketId){
       return this.socket.emitWithAck("answer",{roomId,answer,receiver_SocketId});
    }

    sendIceCandidate({roomId,userData,iceCandidate}){
        this.socket.emit("send_ICE_Candidate",{roomId,userData,iceCandidate});
    }
    
    askForCandidate(roomId,receiver_SocketId){
        return this.socket.emitWithAck("ask_For_ICE_Candidate",{roomId,receiver_SocketId});
    }
   
    answerIsResponded(answerObj){
       this.socket.emit("answer_Responded",answerObj);
    }

    offerIsResponded(offerObj){
       this.socket.emit("offer_Responded",offerObj);  
    }

    replacePeer(roomId,offer,receiver_SocketId){
        this.socket.emit("replace_Peer",{roomId,offer,receiver_SocketId});   
    }
    
    sendMessage(roomId,msgObj){
        this.socket.emit('message_Sent',{roomId,msgObj});
    }
    
    initialMicAndCamera({isMicActive,isCameraActive,remoteSocketId}){
       this.socket.emit('intial_Mic_Camera_Status',{isMicActive,isCameraActive,remoteSocketId});  
    }

}

export default new SocketEventManager();
