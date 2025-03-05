//JoinPage.jsx

import { useContext, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faVideo, faComments, faTimes, faPaperPlane, faPhone } from '@fortawesome/free-solid-svg-icons';
import style from './JoinPage.module.css';
import DialogBox from '../../components/dialogBox/DialogBoxComponent';
import media_access_icon from '../../assets/media_access_icon.svg';
import { AppContext } from '../../store/app-context';
import Cookies from 'js-cookie';
import VideoComponent from '../../components/video/VideoComponent';
import { createPeerConnAndOffer, AddRemoteIceCandidate, ResponseOffer, ResponseAnswer, reNegotiateConnections, createPeerConnetionObj } from '../../webRTC/webRTC-utilities';
import ChatComponent from '../../components/chat/ChatComponent';
export default function JoinPage() {
  const { userData, peerConnections, offers, answers,
    roomId, localStream, socketConnection,
    setLocalStream, setRoomId, setUserData, setParticipants,
    deletePeerConnections, addPeerConnection, removeRemoteSocketId,
    loadPeerConnections, setOffers, setAnswers } = useContext(AppContext);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [gridStyle, setGridStyle] = useState({
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr'
  });

  const [isMicActive, setIsMicActive] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [dialogBoxMessage, setDialogBoxMessage] = useState([]);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const mediaRef = useRef();
  const divRef = useRef();

  const maxNoOfDevices = 9;

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const openChat = () => {
    setIsChatOpen(true);
  };

  // Toggle microphone
  const toggleMic = async () => {
    const enabled = !isMicActive;
    setIsMicActive(enabled);

    if (localStream) {
      const audioTracks = localStream.getAudioTracks();

      audioTracks.forEach(track => {
        track.enabled = enabled; // Toggle the enabled state of each audio track
      });
      if (enabled) {
        console.log("turning on Mic");
      }
      else {
        console.log("turning off Mic");
      }
      socketConnection.toggleAudio(roomId);
      // Update each peer connection with the updated tracks

    }
  };



  // Toggle camera
  const toggleCamera = async () => {
    console.log("toggleCamera");
    const enabled = !isCameraActive;
    setIsCameraActive(enabled);
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = enabled;
      })
      if (enabled) {
        console.log("turning on camera");
      }
      else {
        console.log("turning off camera");

      }
      socketConnection.toggleVideo(roomId);
    }
  };




  const handleCloseModal = () => {
    setIsModelOpen(false);
    setDialogBoxMessage([]);
  };

  const checkPermissions = async () => {
    try {
      const videoPermission = await navigator.permissions.query({ name: 'camera' });
      const audioPermission = await navigator.permissions.query({ name: 'microphone' });

      if (videoPermission.state === 'denied' || audioPermission.state === 'denied') {
        setDialogBoxMessage([
          { heading: "Meet is blocked from using your microphone and camera" },
          { para: "Click on the icon on the page depicted in the image." },
          { para: "Turn on microphone and camera." }
        ]);
        setIsModelOpen(true);
      } else {
        requestMediaAccess();
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestMediaAccess = async () => {
    try {
      let stream = await navigator.mediaDevices.getUserMedia({ video: isCameraActive, audio: isMicActive });
      setLocalStream(stream);
      console.log("localStream is set");
      mediaRef.current.srcObject = stream; // Set the video element's srcObject
    } catch (error) {
      console.log('Error accessing media devices:', error.message);
    }
  };


  function handleHangUp() {
    console.log("hangUp");
    Cookies.remove('callbackUrl');
    Cookies.remove('access_token');
    Cookies.remove("roomId");
    setUserData(null);
    setLocalStream(null);
    setRoomId("");
    deletePeerConnections();
    socketConnection.hangUp(roomId);
    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach(track => {
      track.stop();
      localStream.removeTrack(track);
    });
    window.history.back();
  }

  useEffect(() => {
    checkPermissions();
    console.log("checking permission");
  }, []);

  useEffect(() => {
    if (localStream) {
      loadPeerConnections();
      console.log("Loading peer connections");
    }
  }, [localStream]);

  useEffect(() => {
    if (peerConnections.length > 0) {
      offers.forEach((offerObj) => {
        if (!offerObj.responded) {
          const peerConnectionObj = peerConnections.find(connection => connection.remoteSocketId === offerObj.sender_SocketId);
          if (peerConnectionObj?.peerConnection) {
            ResponseOffer({ peerConnections, offerObj, socketConnection });
          }
          offerObj.responded = true;
        }
      });
    }

  }, [offers, peerConnections]);

  useEffect(() => {
    if (peerConnections.length > 0) {
      answers.forEach((answerObj) => {
        if (!answerObj.responded) {
          const peerConnectionObj = peerConnections.find(connection => connection.remoteSocketId === answerObj.sender_SocketId);
          if (peerConnectionObj?.peerConnection) {
            ResponseAnswer({ peerConnections, answerObj, socketConnection });
          }
          answers.responded = false;
        }
      });
    }

  }, [answers, peerConnections]);


  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.srcObject = localStream;
    }

  }, [mediaRef.current]);

  useEffect(() => {
    if (divRef.current) {
      let value = isCameraActive ? -1 : 1;
      divRef.current.style.zIndex = value;
    }
  }, [isCameraActive]);

  useEffect(() => {

    let cols, rows;
    let totalDevice = peerConnections.length + 1;
    cols = (totalDevice > 4 || totalDevice % 3 === 0) ? 3 : (totalDevice % 2 === 0) ? 2 : 1;
    rows = (totalDevice > 6) ? 3 : (totalDevice > 3) ? 2 : 1;

    // Generate device list for grid

    setGridStyle({
      gridTemplateColumns: `repeat(${cols}, auto)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`
    });

    const handleNewUserJoin = async ({ roomParticipants, remoteSocketId, remoteUserData }) => {
      console.log("newUserJoined");
      try {
        const peerConnectionObj = await createPeerConnAndOffer({ localStream, roomId, remoteSocketId, userData, socketConnection, remoteUserData });
        addPeerConnection(peerConnectionObj);
        setParticipants(roomParticipants);
      } catch (error) {
        console.log(error);
      }
    }

    const handleParticipantLeave = ({ participants, leaveSocketId }) => {
      setParticipants(participants);
      removeRemoteSocketId(leaveSocketId);
      console.log(leaveSocketId);

    }

    const handleICECandidate = (msg) => {
      console.log(msg)
    };

    const handleAddICECandidate = async ({ remoteSocketId, iceCandidate }) => {
      AddRemoteIceCandidate({
        remoteSocketId,
        iceCandidate,
        peerConnections,
      });
    };


    const handleRecievedOffer = (offerObj) => {
      console.log("recived offer");
      setOffers(offerObj);
    };

    const handleRecievedAnswer = (answerObj) => {
      console.log("recived answer");
      setAnswers(answerObj);
    };

    const handleOfferUpdate = (msg) => {
      console.log(msg)
    }

    const handleAnswerUpdate = (msg) => {
      console.log(msg)
    }

    const handleIntialMediaDeviceStatus = ({ kind, sender_SocketId }) => {
      console.log("receive_Request_For_Inital_Media_Device_Status");
      const value = kind === 'video' ? isCameraActive : !isMicActive;
      socketConnection.initialMicOrCamera({ kind, value, remoteSocketId: sender_SocketId });
    }


    socketConnection.socket.on("offer_Update", handleOfferUpdate);
    socketConnection.socket.on("newUserJoined", handleNewUserJoin);
    socketConnection.socket.on("answer_Update", handleAnswerUpdate);
    socketConnection.socket.on("add_ice_candidate", handleAddICECandidate);
    socketConnection.socket.on("participantLeave", handleParticipantLeave);
    socketConnection.socket.on("received_ICE_Candidate", handleICECandidate);
    socketConnection.socket.on("received_offer_for_you", handleRecievedOffer);
    socketConnection.socket.on("received_answer_for_you", handleRecievedAnswer);
    socketConnection.socket.on("receive_Request_For_Inital_Media_Device_Status", handleIntialMediaDeviceStatus);

    return () => {
      socketConnection.socket.off("offer_Update", handleOfferUpdate);
      socketConnection.socket.off("newUserJoined", handleNewUserJoin);
      socketConnection.socket.off("answer_Update", handleAnswerUpdate);
      socketConnection.socket.off("add_ice_candidate", handleAddICECandidate);
      socketConnection.socket.off("participantLeave", handleParticipantLeave);
      socketConnection.socket.off("received_ICE_Candidate", handleICECandidate);
      socketConnection.socket.off("received_offer_for_you", handleRecievedOffer);
      socketConnection.socket.off("received_answer_for_you", handleRecievedAnswer);
      socketConnection.socket.off("receive_Request_For_Inital_Media_Device_Status", handleIntialMediaDeviceStatus);
    };

  }, [peerConnections]);


  //  console.log("mediaRef.current : ",mediaRef.current);
  //  console.log("divRef.current : ",divRef.current);

  return (
    <>
      <DialogBox open={isModelOpen} closeModal={handleCloseModal}>
        {dialogBoxMessage.length > 0 && (
          <div className={style.DialogBoxChildren}>
            <div className={style.DialogBoxImage}>
              <img src={media_access_icon} alt="media_access_icon" />
            </div>
            <div className={style.DialogBoxContainer}>
              {dialogBoxMessage.map((obj, index) => (
                obj.heading ? (<h3 key={index}>{obj.heading}</h3>) : (<p key={index}>{obj.para}</p>)
              ))}
            </div>
          </div>
        )}
      </DialogBox>
      <main className={style.mainGrid}>
        <div className={style.mainGridItemOne}>
          <div className={style.devices} style={gridStyle}>
            <div key={socketConnection.socket.id} className={style.mediaDevice}>
              <video ref={mediaRef} autoPlay muted className={style.videotag}></video>
              <div ref={divRef} className={style.imageContainer}>
                <img className={style.userProfile} src={userData.picture} alt="user-profile" />
              </div>
            </div>
            {peerConnections.map(connection => {
              return (<VideoComponent key={connection?.remoteSocketId} connection={connection} />);
            })}
          </div>
          <ChatComponent closeChat={closeChat} isChatOpen={isChatOpen} />
        </div>
        <div className={style.mainGridItemTwo}>
          <button
            className={`${style.controlButton} ${!isMicActive ? style.active : ''}`}
            onClick={toggleMic}
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
          <button
            className={`${style.controlButton} ${!isCameraActive ? style.active : ''}`}
            onClick={toggleCamera}
          >
            <FontAwesomeIcon icon={faVideo} />
          </button>
          <button className={style.controlButton} onClick={openChat}>
            <FontAwesomeIcon icon={faComments} />
          </button>
          <button className={style.phoneButton} onClick={handleHangUp}>
            <FontAwesomeIcon icon={faPhone} />
          </button>
        </div>
      </main>
    </>
  );
}




