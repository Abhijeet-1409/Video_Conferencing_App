// HomePage.jsx

import styles from './HomePage.module.css';
import Button from '../../components/button/Button';
import fallbackProfile from '../../assets/profile.png';;
import SlideShow from '../../components/slideShow/SlideShowComponent';
import DialogBox from '../../components/dialogBox/DialogBoxComponent';
import Cookies from 'js-cookie';
import { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../store/app-context';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import useIsMobile from '../../hooks/useIsMobile';

export default function HomePage() {
    const { userData, socketConnection, setRoomId, setUserData, setParticipants } = useContext(AppContext);
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isMobile, currentWidth] = useIsMobile(500);
    const [localRoomId, setLocalRoomId] = useState("");
    const [imageKey, setImageKey] = useState(Date.now());
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();
    const inputRef = useRef();

    let MsgTag = <><h2>{msg}</h2></>;

    const handleLogout = () => {
        googleLogout();
        setUserData(null);
        setRoomId("");
        setParticipants([]);
    };

    const handleCreate = () => {
        if (userData) {
            socketConnection.createRoom();
        }
        else {
            setIsModelOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModelOpen(false);
        setLocalRoomId("");
        setMsg("");
    };

    const handleJoin = () => {
        let inputValue = inputRef.current.value.trim();
        if (userData) {
            Cookies.set("roomId", inputValue);
            socketConnection.joinRoom(inputValue, userData);
        }
        else {
            setIsModelOpen(true);
        }
        inputRef.current.value = '';
    };

    useEffect(() => {
        const handleRoom = (roomId) => {
            setLocalRoomId(roomId);
            setIsModelOpen(true);
        };

        const handleJoinRoomSucc = (participants) => {
            setRoomId(Cookies.get("roomId"));
            setParticipants(participants);
            navigate('/join');
        };

        const handleJoinRoomUnSucc = (msg) => {
            setMsg(msg);
            setIsModelOpen(true);
            Cookies.remove("roomId");
        };

        socketConnection.socket.on("roomCreatedSuccessfully", handleRoom);
        socketConnection.socket.on("joinRoomSuccessfully", handleJoinRoomSucc);
        socketConnection.socket.on("joinRoomUnSuccessful", handleJoinRoomUnSucc);
        return () => {
            socketConnection.socket.off("roomCreatedSuccessfully", handleRoom);
            socketConnection.socket.off("joinRoomSuccessfully", handleJoinRoomSucc);
            socketConnection.socket.off("joinRoomUnSuccessful", handleJoinRoomUnSucc);
        };

    }, []);

    return (
        <>
            <DialogBox open={isModelOpen} closeModal={handleCloseModal}>
                {userData ? (
                    localRoomId.length === 0 && msg.length > 0 ? (
                        MsgTag
                    ) : (
                        localRoomId.length > 0 && msg.length === 0 && (
                            isMobile ? (
                                <>
                                    <h2>Here's your joining info</h2>
                                    <p>
                                        Send this to people you want to meet with.
                                        Be sure to save it so you can use it <span className={styles.nowrap}>later, too.</span>
                                    </p>
                                    <p><strong>code</strong> : {localRoomId}</p>
                                </>
                            ) : (
                                <>
                                    <h2>Here's your joining info</h2>
                                    <p>Send this to people you want to meet with.</p>
                                    <p>Be sure to save it so you can use it <span className={styles.nowrap}>later, too.</span></p>
                                    <p><strong>code</strong> : {localRoomId}</p>
                                </>
                            )
                        )
                    )
                ) : (
                    msg.length > 0 ? (
                        MsgTag
                    ) : (
                        <>
                            <h2>Please login first</h2>
                            <p>Click on the profile picture on the top right corner</p>
                        </>
                    )
                )}
            </DialogBox>
            <main className={styles.gridContainer}>
                <div className={styles.gridItemOne}>
                    {userData ? (<button className={styles.imageButton} onClick={handleLogout}>
                        <img
                            src={userData?.picture}
                            alt="profile"
                            key={imageKey}
                            onError={(e) => {
                                e.currentTarget.src = fallbackProfile;
                            }}
                        />
                    </button>) : (<GoogleLogin onSuccess={
                        (credentialResponse) => {
                            let credential = credentialResponse.credential;
                            let userInfo = jwtDecode(credential);
                            setUserData(userInfo);
                        }}
                        onError={(err) => {
                            console.log(`failed to login ${err}`)
                        }}
                    />)
                    }

                </div>
                <div className={styles.gridItemTwo}>
                    <SlideShow></SlideShow>
                    <div className={styles.container}>
                        <Button handleClick={handleCreate}>Create</Button>
                        <Button handleClick={handleJoin}>Join</Button>
                        <input type="text" name="roomId" id="roomId" ref={inputRef} className={styles.inputBox} />

                    </div>
                </div>
            </main>
        </>
    );
}
