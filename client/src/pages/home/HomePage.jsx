import styles from './HomePage.module.css';
import Button from '../../components/button/Button';
import profile from '../../assets/profile.png';
import SlideShow from '../../components/slideShow/SlideShowComponent';
import DialogBox from '../../components/dialogBox/DialogBoxComponent';
import Cookies from 'js-cookie';
import { useContext, useEffect, useRef, useState } from 'react';
const clientId = import.meta.env.VITE_CLIENT_ID;
import { AppContext } from '../../store/app-context';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
    const { userData, socketConnection, setRoomId, setUserData, setParticipants } = useContext(AppContext);
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [localRoomId, setLocalRoomId] = useState("");
    const [imageKey, setImageKey] = useState(Date.now());
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();
    const inputRef = useRef();

    const handleClick = () => {
        if (userData) {
            handleLogout();
            return;
        }
        const callbackUrl = `${window.location.origin}`;
        Cookies.set('callbackUrl', callbackUrl);
        const targetUrl = `https://accounts.google.com/o/oauth2/auth?redirect_uri=${encodeURIComponent(
            callbackUrl
        )}&response_type=token&client_id=${clientId}&scope=openid%20email%20profile`;

        window.location.href = targetUrl;
    };

    const handleLogout = () => {
        Cookies.remove('callbackUrl');
        Cookies.remove('access_token');
        Cookies.remove("roomId");
        setUserData(null);
        setRoomId("");
        setParticipants([]);
    };

    const getUserDetails = async (accessToken) => {
        try {
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`);
            const data = await response.json();
            setUserData(data);
            setImageKey(Date.now()); // Update the imageKey state to force a re-render
            // console.log(data.picture);
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    useEffect(() => {
        const accessTokenRegex = /access_token=([^&]+)/;
        const isMatch = window.location.href.match(accessTokenRegex);
        const access_token = Cookies.get('access_token');
        if (access_token) {
            getUserDetails(access_token);
        }
        if (isMatch && !access_token) {
            const accessToken = isMatch[1];
            Cookies.set("access_token", accessToken);
            const callbackUrl = Cookies.get('callbackUrl');
            window.location.href = callbackUrl;
        }

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

    let MsgTag = <><h2>{msg}</h2></>;
    
    return (
        <>
            <DialogBox open={isModelOpen} closeModal={handleCloseModal}>
                {userData ? (
                    localRoomId.length === 0 && msg.length > 0 ? (
                        MsgTag
                    ) : (
                        localRoomId.length > 0 && msg.length === 0 && (
                            <>
                                <h2>Here's your joining info</h2>
                                <p>Send this to people you want to meet with. Be sure to save it so you can use it later, too.</p>
                                <p>http://localhost:5173/roomid={localRoomId}</p>
                                <p><strong>code</strong> : {localRoomId}</p>
                            </>
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
                    <button className={styles.imageButton} onClick={handleClick}>
                        <img
                            src={userData?.picture ? userData.picture : profile}
                            alt="profile"
                            key={imageKey}
                        />
                    </button>
                </div>
                <div className={styles.gridItemTwo}>
                    <SlideShow></SlideShow>
                    <div className={styles.container}>
                        <Button handleClick={handleCreate}>Create</Button>
                        <div>
                            <Button handleClick={handleJoin}>Join</Button>
                            <input type="text" name="roomId" id="roomId" ref={inputRef} className={styles.inputBox} />
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
