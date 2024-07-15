// index.js (Node.js server)

const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('http'); // Changed to `http` for createServer
const cors = require('cors');
const { off } = require('process');
const app = express();
const server = createServer(app);
const io = new Server(server);

const rooms = [
  /*
  { 
   roomId : string,
   participants : [
    {
      socketId : string,
      userData : {},
      ICE_Candidates : [],
    }
   ]   
  }  
 */
];

const offers = [
  /*  
   {
     responded : bool,
     roomId : string,
     sender_SocketId : string,
     receiver_SocketId : string, 
     offer : {},
   }  
  */
]

const answers = [
  /*  
   { 
     responded : bool,
     roomId : string,  
     sender_SocketId : string,
     receiver_SocketId : string, 
     answer : {},
   }  
  */
]



app.use(cors());
app.use(express.json());

app.get('', (req, res) => {
  res.send("hello world");
});

io.on("connection", (socket) => {
 

  socket.on('createRoom', () => {
    console.log("createRoom");
    const roomId = Math.floor(Math.random() * 10000000).toString();
    rooms.push({ roomId, 'participants': [] });
    socket.emit('roomCreatedSuccessfully', roomId);
  });

  socket.on('joinRoom', ({ roomId, userData }) => {
    console.log("joinRoom");
    const room = rooms.find((room) => room.roomId === roomId);
    if (room) {
      socket.join(roomId);
      room.participants.push({ socketId: socket.id, userData, ICE_Candidates: [] });
      socket.broadcast.to(roomId).emit('newUserJoined', { roomParticipants: room.participants, remoteSocketId: socket.id ,remoteUserData:userData});
      socket.emit('joinRoomSuccessfully', room.participants);
    } else {
      socket.emit('joinRoomUnSuccessful', `no room with id ${roomId} found`);
    }
  });

  socket.on("message_Sent", ({ roomId,msgObj}) => {
    console.log("message_Sent");
    socket.to(roomId).emit('message_Recieved',msgObj);
  });

  socket.on("send_ICE_Candidate", ({ roomId, userData, iceCandidate }) => {
    // console.log("send_ICE_Candidate");
    let msg = `there is no user with socketId : ${socket.id} and userName : ${userData.name} to add ICE Candidate`;
    const room = rooms.find(room => room.roomId === roomId);
    const user = room.participants.find(user => (user.socketId === socket.id && user.userData.id === userData.id));
    if (user) {
      user.ICE_Candidates.push(iceCandidate);
      msg = `ICE Candidate add Successfully`;
      socket.to(roomId).emit("add_ice_candidate",{remoteSocketId:socket.id,iceCandidate});
    }
    socket.emit("received_ICE_Candidate", msg);
    
  });

  socket.on("offer", ({ roomId, offer, receiver_SocketId }) => {
      console.log("offer");
      const offerObj = {responded : false,roomId,offer,sender_SocketId:socket.id,receiver_SocketId};
      offers.push(offerObj);
      io.to(receiver_SocketId).emit('received_offer_for_you',offerObj);
  });
  
  socket.on("answer",({roomId,answer,receiver_SocketId},ackFunc)=>{
    console.log("answer");
    const room = rooms.find(room => room.roomId === roomId);
    const user = room.participants.find( user => user.socketId === receiver_SocketId);
    const answerObj = {responded:false,roomId,answer,receiver_SocketId,sender_SocketId:socket.id};
    answers.push(answerObj);
    ackFunc(user.ICE_Candidates);
    io.to(receiver_SocketId).emit('received_answer_for_you',answerObj);
  });

  socket.on("ask_For_ICE_Candidate",({roomId,receiver_SocketId},ackFunc)=>{
    console.log("ask_For_ICE_Candidate");
    const room = rooms.find(room => room.roomId === roomId);
    const user = room.participants.find( user => user.socketId === receiver_SocketId);
    ackFunc(user.ICE_Candidates);
  });


  socket.on("LeaveRoom", ({ roomId }) => {
    console.log("leaveRoom");
    const room = rooms.find(room => room.roomId === roomId);
    if (room) {
      room.participants = room.participants.filter(participant => participant.socketId !== socket.id);
      socket.broadcast.to(roomId).emit("participantLeave", { participants: room.participants, leaveSocketId: socket.id });
      socket.leave(roomId);
    }
  });
  
  socket.on("offer_Responded",(offerObj)=>{
    console.log("offer_Responded");
      let msg = 'offer is not updated';
      const actualOffer = offers.find( offerObject => (offerObject.roomId ===  offerObj.roomId && offerObject.sender_SocketId == offerObj.sender_SocketId) );
      if(actualOffer?.roomId?.length > 0){
         msg = 'offer is updated';        
         actualOffer.responded = true;   
      }
      socket.emit("offer_Update",msg);

  });

  socket.on("answer_Responded",(answerObj)=>{
      console.log("answer_Responded");
      let msg = 'answer is not updated';
      const actualAnswer = answers.find( answerObject => (answerObject.roomId === answerObj.roomId && answerObject.sender_SocketId === answerObj.sender_SocketId) );
      if(actualAnswer?.roomId?.length > 0){
         msg = 'answer is updated';
         actualAnswer.responded = true;   
      }
      socket.emit("answer_Update",msg);   
    });

  socket.on("toggleVideo",(roomId)=>{
     console.log("toggleVideo");
     socket.broadcast.to(roomId).emit("msgToToggleVideo",socket.id);
  });
   
  socket.on("toggleAudio",(roomId)=>{
     console.log("toggleAudio");
     socket.broadcast.to(roomId).emit("msgTotoggleAudio",socket.id);
  });
  
  // socket.on("replace_Peer",({roomId, offer, receiver_SocketId })=>{
  //    console.log("replace_Peer");
  //    const offerObj = {replaced : false,responded : false,roomId,offer,sender_SocketId:socket.id,receiver_SocketId};
  //    offers.push(offerObj);
  //    io.to(receiver_SocketId).emit("update_Peer",offerObj);
  // });

  socket.on("intial_Mic_Or_Camera_Status",({kind,value,remoteSocketId})=>{
       console.log("intial_Mic_Or_Camera_Status");
       io.to(remoteSocketId).emit("receive_Intial_Mic_Or_Camera_Status",{kind,value,sender_SocketId : socket.id});
  }); 
  
  socket.on("ask_For_Initial_Camera_Or_Mic_Status",({kind,remoteSocketId})=>{
       console.log("ask_For_Initial_Camera_Or_Mic_Status");
       io.to(remoteSocketId).emit("receive_Request_For_Inital_Media_Device_Status",{kind,sender_SocketId:socket.id});
  });

});




server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
