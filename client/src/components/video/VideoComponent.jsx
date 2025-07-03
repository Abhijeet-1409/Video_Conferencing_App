import { useEffect, useRef, useState, useContext } from "react";
import style from './VideoComponent.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import { AppContext } from "../../store/app-context";
import fallbackProfile from '../../assets/profile.png';

export default function VideoComponent({ connection }) {
    const { socketConnection } = useContext(AppContext);
    const [camera, setCamera] = useState(false);
    const [mic, setMic] = useState(false);
    const divRef = useRef(null);
    const iconRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(()=>{
        if (videoRef.current) {
            videoRef.current.srcObject = connection.remoteStream;
        }
    },[videoRef.current,connection.remoteStream]);

    useEffect(() => {
        const handleTrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                console.log(`Track added: ${track.kind}`);
                connection.remoteStream.addTrack(track);
                socketConnection.askForInitialCameraOrMicStatus({kind : track.kind,remoteSocketId : connection.remoteSocketId});
            });
        };

        const handleToggleVideo = (remoteSocketId) => {
            if (connection.remoteSocketId === remoteSocketId) {
                console.log("handleToggleVideo");
                setCamera((prevCamera) => !prevCamera);
            }
        };

        const handleToggleAudio = (remoteSocketId) => {
            if (connection.remoteSocketId === remoteSocketId) {
                console.log("handleToggleAudio");
                setMic((prevMic) => !prevMic);
            }
        };

        const handleInitialMicAndCamera = ({ isMicActive, isCameraActive, sender_SocketId }) => {
            if (connection.remoteSocketId === sender_SocketId) {
                setMic(isMicActive);
                setCamera(isCameraActive);
            }
        };

        const handleInitialMicOrCamera =({kind,value,sender_SocketId}) =>{
            if(connection.remoteSocketId === sender_SocketId){
                if(kind === 'video'){
                  setCamera(value);
                }
                else{
                  setMic(value);
                }
            }
        };

        socketConnection.socket.on("msgToToggleVideo", handleToggleVideo);
        socketConnection.socket.on("msgTotoggleAudio", handleToggleAudio);
        connection.peerConnection.addEventListener('track', handleTrack);
        socketConnection.socket.on("receive_Intial_Mic_Or_Camera_Status",handleInitialMicOrCamera);

        return () => {
            socketConnection.socket.off("msgToToggleVideo", handleToggleVideo);
            socketConnection.socket.off("msgTotoggleAudio", handleToggleAudio);
            connection.peerConnection.removeEventListener('track', handleTrack);
            socketConnection.socket.off("receive_Intial_Mic_Or_Camera_Status",handleInitialMicOrCamera);
        };
    }, []);

    useEffect(() => {
        const micDisplayZindex = mic ? 2 : -2;
        const imageDisplayZindex = !camera ? 1 : -1;

        if (iconRef.current) {
            iconRef.current.style.zIndex = micDisplayZindex;
        }

        if (divRef.current) {
            divRef.current.style.zIndex = imageDisplayZindex;
        }

        console.log(`micDisplay: ${micDisplayZindex}, imageDisplay: ${imageDisplayZindex}`);
    }, [camera, mic]);

    return (
        <div className={style.mediaDevice}>
            <FontAwesomeIcon icon={faMicrophoneSlash} ref={iconRef} className={style.fontIcon} />
            <video ref={videoRef} autoPlay className={style.videotag}></video>
            <div ref={divRef} className={style.imageContainer}>
                <img
                    className={style.userProfile}
                    src={connection.remoteUserData.picture}
                    alt="user-profile"
                    onError={(e) => {
                        e.currentTarget.src = fallbackProfile;
                    }}
                />
            </div>
        </div>
    );
}
