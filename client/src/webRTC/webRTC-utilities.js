const peerConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302'
            ]
        }
    ]
};

export function createPeerConnetionObj({localStream, socketConnection, roomId, userData, remoteSocketId, remoteUserData}) {
    console.log("createPeerConnetionObj");
    let remoteStream = new MediaStream();
    let peerConnection = new RTCPeerConnection(peerConfiguration);

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            socketConnection.sendIceCandidate({
                roomId,
                userData,
                iceCandidate: event.candidate,
            });
        }
    });

    return {
        remoteStream,
        peerConnection,
        remoteSocketId,
        remoteUserData
    };
}

export function createMultiplePeerConnectionsObj({participants, socketConnection, localStream, userData, roomId}) {
    console.log("createMultiplePeerConnectionsObj");
    const peerConnections = participants
        .filter(member => member.socketId !== socketConnection.socket.id)
        .map(member => createPeerConnetionObj({
            localStream,
            userData,
            roomId,
            socketConnection,
            remoteUserData: member.userData,
            remoteSocketId: member.socketId,
        }));
    return peerConnections;
}


export async function createPeerConnAndOffer({localStream, socketConnection, roomId, userData, remoteSocketId, remoteUserData,replace}) {
    console.log("createPeerConnAndOffer");
    try {  
        const peerConnectionObj = createPeerConnetionObj({localStream, socketConnection, roomId, userData, remoteSocketId, remoteUserData});
        const offer = await peerConnectionObj.peerConnection.createOffer();
        await peerConnectionObj.peerConnection.setLocalDescription(offer);
        if(replace){
            socketConnection.replacePeer(roomId,offer,remoteSocketId);
        }
        else{
            socketConnection.sendOffer(roomId, offer, remoteSocketId);
        }
        return peerConnectionObj;
    } catch (error) {
       console.log(error.message); 
    }
}


export async function ResponseOffer({peerConnections, offerObj, socketConnection}) {
    console.log("ResponseOffer");
    try {
        const peerConnectionObj = peerConnections.find(connection => connection.remoteSocketId === offerObj.sender_SocketId);
        if(!peerConnectionObj){
           throw new Error(`no peer-connection with remoteSocketId : ${offerObj.sender_SocketId}`);
        }
        await peerConnectionObj.peerConnection.setRemoteDescription(offerObj.offer);
        socketConnection.offerIsResponded(offerObj);
        const answer = await peerConnectionObj.peerConnection.createAnswer();
        await peerConnectionObj.peerConnection.setLocalDescription(answer);
        const ICE_Candidates = await socketConnection.sendAnswer(offerObj.roomId, answer, offerObj.sender_SocketId);
        const candidatePromises = ICE_Candidates.map(candidate => {
            return peerConnectionObj.peerConnection.addIceCandidate(candidate)
                .then(() => {
                    console.log('ICE candidate added successfully after answer is created');
                })
                .catch((error) => {
                    console.error('Error adding ICE candidate after answer is created:', error);
                });
        });

        await Promise.all(candidatePromises);
        
    } catch (error) {
      console.log(error.message); 
    }
}

export async function ResponseAnswer({peerConnections, answerObj, socketConnection}) {
    console.log("ResponseAnswer");
    try {
        
        const peerConnectionObj = peerConnections.find(connection => connection.remoteSocketId === answerObj.sender_SocketId);
        if(!peerConnectionObj){
            throw new Error(`no peer-connection with remoteSocketId : ${answerObj.sender_SocketId}`);
         }
        await peerConnectionObj.peerConnection.setRemoteDescription(answerObj.answer);
        socketConnection.answerIsResponded(answerObj);
        const ICE_Candidates = await socketConnection.askForCandidate(answerObj.roomId, answerObj.sender_SocketId);
        const candidatePromises = ICE_Candidates.map(candidate => {
            return peerConnectionObj.peerConnection.addIceCandidate(candidate)
                .then(() => {
                    console.log('ICE candidate added successfully after answer is created');
                })
                .catch((error) => {
                    console.error('Error adding ICE candidate after answer is created:', error);
                });
        });

        await Promise.all(candidatePromises);

    } catch (error) {
        console.log(error.message);  
    }
}


export async function AddRemoteIceCandidate({remoteSocketId, iceCandidate, peerConnections}) {
    console.log("AddRemoteIceCandidate");
    let peerConnectionObj = peerConnections.find(connection => connection.remoteSocketId === remoteSocketId);

    try {
        if (peerConnectionObj?.peerConnection && peerConnectionObj.peerConnection.remoteDescription) {
            await peerConnectionObj.peerConnection.addIceCandidate(iceCandidate);
        } else {
            throw new Error(`No peer connection with socketId: ${remoteSocketId}`);
        }
        console.log('ICE candidate added successfully to the peer connection');
    } catch (error) {
        console.log(error.message);
    }
}

export async function reNegotiateConnections({ participants, socketConnection, roomId ,userData,localStream}) {
    console.log("reNegotiateConnection");
    try {
        
        const newPeerConnections = participants
                                   .filter(member => member.socketId !== socketConnection.socket.id)
                                   .map( member => {
                                      return createPeerConnetionObj({
                                        localStream,
                                        roomId,
                                        userData,
                                        socketConnection,
                                        remoteUserData: member.userData,
                                        remoteSocketId: member.socketId,
                                      });
                                   });

        await Promise.all(newPeerConnections);

        return newPeerConnections;
        
    } catch (error) {
        console.log(error.message);
    }
   
}


