// index.js (Node.js server)
require('dotenv').config();
const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('http');
const cors = require('cors');
const { off } = require('process');
const app = express();
const server = createServer(app);
const io = new Server(server);
const mongoose = require('mongoose');
const crypto = require('crypto');

const MONGOUSERNAME = process.env.MONGOUSERNAME;
const MONGOPASSWORD = process.env.MONGOPASSWORD;
const MONGODBNAME = process.env.MONGODBNAME;
const PORT = process.env.PORT || 8080;
const MODE = process.env.MODE;
const CLIENT_URL = MODE == "production" ? process.env.CLIENT_URL : "http://localhost:5173"

const URI = `mongodb+srv://${MONGOUSERNAME}:${MONGOPASSWORD}@cluster0.pnufpgg.mongodb.net/${MONGODBNAME}?retryWrites=true&w=majority&appName=Cluster0`;

const Room = require('./models/Room');
const Participant = require('./models/Participant');
const Message = require('./models/Message');

let inMemoryParticipants = [
  /*
  {
    roomId: string
    socketId : string,
    userData : {},
    ICE_Candidates : [],
  }
  */
]

let inMemoryOffers = [
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

let inMemoryAnswers = [
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

// Generate unique roomId
async function generateUniqueRoomId() {
  let roomId;
  let exists = true;
  while (exists) {
    roomId = crypto.randomBytes(4).toString('hex');
    const room = await Room.findOne({ roomId });
    exists = !!room;
  }
  return roomId;
}

const corsOptions = {
  origin: CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is up and running.');
});

io.on("connection", (socket) => {


  socket.on('createRoom', async () => {
    try {
      const roomId = await generateUniqueRoomId();
      await Room.create({ roomId, participants: [] });
      socket.emit('roomCreatedSuccessfully', roomId);
    }
    catch (error) {
      console.error("Error creating room:", error.message);
    }
  });

  socket.on('joinRoom', async ({ roomId, userData }) => {
    try {
      const room = await Room.findOne({ roomId });

      if (!room) {
        socket.emit('joinRoomUnSuccessful', `no room with id ${roomId} found`);
        return
      }

      socket.join(roomId)

      inMemoryParticipants.push({
        socketId: socket.id,
        userData,
        roomId,
        ICE_Candidates: [],
      })
      const roomParticipants = inMemoryParticipants.filter(inMemoParticpant => inMemoParticpant.roomId === roomId);

      socket.broadcast.to(roomId).emit('newUserJoined', {
        roomParticipants,
        remoteSocketId: socket.id,
        remoteUserData: userData
      });
      socket.emit('joinRoomSuccessfully', roomParticipants);

      const participant = await Participant.create({
        socketId: socket.id,
        userData,
        roomId,
      })
      room.participants.push(participant._id);
      await room.save();

    } catch (error) {
      console.error('Join room error:', error.message);
    }
  });

  socket.on("message_Sent", async ({ roomId, msgObj }) => {
    try {
      socket.to(roomId).emit('message_Recieved', msgObj);
      const { info, senderName } = msgObj;
      await Message.create({ roomId, info, senderName });
    } catch (error) {
      console.error('Message sent error:', error.message);
    }
  });

  socket.on("send_ICE_Candidate", ({ roomId, userData, iceCandidate }) => {
    let msg = `there is no user with socketId : ${socket.id} and userName : ${userData.name} to add ICE Candidate`;
    const participant = inMemoryParticipants.find(
      inMemoParticpant => (
        inMemoParticpant.roomId === roomId &&
        inMemoParticpant.socketId === socket.id
      )
    );
    if (participant) {
      participant.ICE_Candidates.push(iceCandidate);
      msg = `ICE Candidate add Successfully`;
      socket.to(roomId).emit("add_ice_candidate", { remoteSocketId: socket.id, iceCandidate });
    }
    socket.emit("received_ICE_Candidate", msg);
  });

  socket.on("offer", ({ roomId, offer, receiver_SocketId }) => {
    const offerObj = { responded: false, roomId, offer, sender_SocketId: socket.id, receiver_SocketId };
    inMemoryOffers.push(offerObj);
    io.to(receiver_SocketId).emit('received_offer_for_you', offerObj);
  });

  socket.on("answer", ({ roomId, answer, receiver_SocketId }, ackFunc) => {
    const participant = inMemoryParticipants.find(
      inMemoParticpant => (
        inMemoParticpant.roomId === roomId &&
        inMemoParticpant.socketId === receiver_SocketId
      )
    );
    const answerObj = { responded: false, roomId, answer, receiver_SocketId, sender_SocketId: socket.id };
    inMemoryAnswers.push(answerObj);
    ackFunc(participant?.ICE_Candidates || []);
    io.to(receiver_SocketId).emit('received_answer_for_you', answerObj);
  });

  socket.on("ask_For_ICE_Candidate", ({ roomId, receiver_SocketId }, ackFunc) => {
    const participant = inMemoryParticipants.find(
      inMemoParticpant => (
        inMemoParticpant.roomId === roomId &&
        inMemoParticpant.socketId === receiver_SocketId
      )
    );
    ackFunc(participant?.ICE_Candidates || []);
  });


  socket.on("LeaveRoom", ({ roomId }) => {
    const roomParticipants = inMemoryParticipants.filter(
      inMemoParticpant => (
        inMemoParticpant.roomId === roomId &&
        inMemoParticpant.socketId !== socket.id
      )
    );
    inMemoryParticipants = inMemoryParticipants.filter(inMemoParticpant => inMemoParticpant.socketId !== socket.id);
    inMemoryOffers = inMemoryOffers.filter(inMemoOfferObj => inMemoOfferObj.sender_SocketId !== socket.id);
    inMemoryAnswers = inMemoryAnswers.filter(inMemoAnswerObj => inMemoAnswerObj.sender_SocketId !== socket.id);
    socket.broadcast.to(roomId).emit("participantLeave", { participants: roomParticipants, leaveSocketId: socket.id });
    socket.leave(roomId);
  });

  socket.on("offer_Responded", (offerObj) => {
    let msg = 'offer is not updated';
    const actualOffer = inMemoryOffers.find(
      inMemoOfferObj => (
        inMemoOfferObj.roomId === offerObj.roomId &&
        inMemoOfferObj.sender_SocketId == offerObj.sender_SocketId
      )
    );
    if (actualOffer) {
      msg = 'offer is updated';
      actualOffer.responded = true;
    }
    socket.emit("offer_Update", msg);
  });

  socket.on("answer_Responded", (answerObj) => {
    let msg = 'answer is not updated';
    const actualAnswer = inMemoryAnswers.find(
      inMemoAnswerObj => (
        inMemoAnswerObj.roomId === answerObj.roomId &&
        inMemoAnswerObj.sender_SocketId === answerObj.sender_SocketId
      )
    );
    if (actualAnswer) {
      msg = 'answer is updated';
      actualAnswer.responded = true;
    }
    socket.emit("answer_Update", msg);
  });

  socket.on("toggleVideo", (roomId) => {
    socket.broadcast.to(roomId).emit("msgToToggleVideo", socket.id);
  });

  socket.on("toggleAudio", (roomId) => {
    socket.broadcast.to(roomId).emit("msgTotoggleAudio", socket.id);
  });

  socket.on("intial_Mic_Or_Camera_Status", ({ kind, value, remoteSocketId }) => {
    io.to(remoteSocketId).emit("receive_Intial_Mic_Or_Camera_Status", { kind, value, sender_SocketId: socket.id });
  });

  socket.on("ask_For_Initial_Camera_Or_Mic_Status", ({ kind, remoteSocketId }) => {
    io.to(remoteSocketId).emit("receive_Request_For_Inital_Media_Device_Status", { kind, sender_SocketId: socket.id });
  });

  socket.on("disconnect", () => {

    const participant = inMemoryParticipants.find(
      inMemoParticipant => inMemoParticipant.socketId === socket.id
    );

    if (!participant) return;

    const roomId = participant.roomId;

    const roomParticipants = inMemoryParticipants.filter(
      inMemoParticipant =>
        inMemoParticipant.roomId === roomId &&
        inMemoParticipant.socketId !== socket.id
    );

    inMemoryParticipants = inMemoryParticipants.filter(
      inMemoParticipant => inMemoParticipant.socketId !== socket.id
    );

    inMemoryOffers = inMemoryOffers.filter(
      inMemoOfferObj => inMemoOfferObj.sender_SocketId !== socket.id
    );

    inMemoryAnswers = inMemoryAnswers.filter(
      inMemoAnswerObj => inMemoAnswerObj.sender_SocketId !== socket.id
    );

    socket.broadcast.to(roomId).emit("participantLeave", {
      participants: roomParticipants,
      leaveSocketId: socket.id
    });

    socket.leave(roomId);
  });

});

mongoose.connect(URI,)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(' MongoDB connection error:', error.message);
  });

