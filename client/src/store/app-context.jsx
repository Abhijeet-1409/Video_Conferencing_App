//app-context.jsx
import { createContext, useReducer } from "react";
import SocketEventManager from "../sockets/SocketEventManager";
import { createMultiplePeerConnectionsObj } from "../webRTC/webRTC-utilities";

export const AppContext = createContext({
  roomId: "",
  offers: [],
  answers: [],
  userData: {},
  localStream: {},
  participants: [],
  peerConnections: [],
  socketConnection: {},
  setRoomId: () => { },
  setOffers: () => { },
  setAnswers: () => { },
  setUserData: () => { },
  setLocalStream: () => { },
  setParticipants: () => { },
  addPeerConnection: () => { },
  loadPeerConnections: () => { },
  removeRemoteSocketId: () => { },
  updatePeerConnections: ()=> { },
  deletePeerConnections: () => { },
});

function AppReducer(state, action) {
  switch (action.type) {

    case 'SET_ROOM_ID': {
      const { roomId } = action.payload;
      return { ...state, roomId: roomId };
    }

    case 'SET_USER_DATA': {
      const { userData } = action.payload;
      return { ...state, userData: userData };
    }

    case 'SET_LOCAL_STREAM': {
      const { stream } = action.payload;
      return { ...state, localStream: stream };
    }

    case 'SET_PARTICIPANTS': {
      const { participants } = action.payload;
      return { ...state, participants };
    }

    case 'ADD_PEER_CONNECTION': {
      const { peerConnectionObj } = action.payload;
      return { ...state, peerConnections: [...state.peerConnections, peerConnectionObj] };
    }

    case 'LOAD_PEER_CONNECTIONS': {
      const { participants, socketConnection, localStream, userData, roomId } = state;
      const peerConnectionsObjList = createMultiplePeerConnectionsObj({ participants, socketConnection, localStream, userData, roomId });
      return { ...state, peerConnections: [...peerConnectionsObjList] };
    }

    case 'DELETE_PEER_CONNECTIONS': {
      return { ...state, peerConnections: [] };
    }

    case 'REMOVE_SOCKET_ID': {
      const { socketId } = action.payload;
      const newParticiipants = state.participants.filter(member => member.socketId !== socketId);
      const newPeerConnections = state.peerConnections.filter(connection => connection.remoteSocketId !== socketId);
      return { ...state, participants: newParticiipants, peerConnections: newPeerConnections };
    }
     
    case 'SET_OFFERS' : {
      const  {offerObj} = action.payload;
      return { ...state, offers : [...state.offers,offerObj]};
    }

    case 'SET_ANSWERS' : {
      const {answerObj} = action.payload;
      return { ...state, answers : [...state.answers,answerObj]};
    }

    case 'UPDATE_PEER_CONNECTIONS' : {
       const {newPeerConnections} = action.payload;
       return {...state,peerConnections : newPeerConnections };
    }

    default:
      return state;
  }
}

export default function AppContextProvider({ children }) {
  const [appState, appDispatch] = useReducer(AppReducer, {
    roomId: "",
    userData: null,
    offers : [],
    answers : [],
    participants: [],
    localStream: null,
    peerConnections: [],
    socketConnection: SocketEventManager,
  });

  const setRoomId = (roomId) => {
    appDispatch({ type: 'SET_ROOM_ID', payload: { roomId } });
  }

  const setUserData = (userData) => {
    appDispatch({ type: 'SET_USER_DATA', payload: { userData } });
  };

  const setLocalStream = (stream) => {
    appDispatch({ type: 'SET_LOCAL_STREAM', payload: { stream } });
  }

  const setParticipants = (participants) => {
    appDispatch({ type: 'SET_PARTICIPANTS', payload: { participants } });
  }

  const addPeerConnection = (peerConnectionObj) => {
    appDispatch({ type: 'ADD_PEER_CONNECTION', payload: { peerConnectionObj } });
  }

  const loadPeerConnections = () => {
    appDispatch({ type: 'LOAD_PEER_CONNECTIONS' });
  }

  const deletePeerConnections = () => {
    appDispatch({ type: 'DELETE_PEER_CONNECTIONS' });
  }

  const removeRemoteSocketId = (socketId) => {
    appDispatch({ type: 'REMOVE_SOCKET_ID', payload: { socketId } });
  }


  const setOffers = (offerObj) => {
    appDispatch({ type: 'SET_OFFERS', payload: { offerObj } }); 
  }

  const setAnswers = (answerObj) => {
    appDispatch({ type: 'SET_ANSWERS', payload: { answerObj } });
  }

  const updatePeerConnections = (newPeerConnections) => {
    appDispatch({type: 'UPDATE_PEER_CONNECTIONS', payload : {newPeerConnections}});
  }

  const ctxValue = {
    ...appState,
    setRoomId,
    setOffers,
    setAnswers,
    setUserData,
    setLocalStream,
    setParticipants,
    addPeerConnection,
    loadPeerConnections,
    deletePeerConnections,
    removeRemoteSocketId,
    updatePeerConnections,
  };

  return (
    <AppContext.Provider value={ctxValue}>
      {children}
    </AppContext.Provider>
  );
}
