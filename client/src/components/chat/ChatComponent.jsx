// ChatComponent react
import style from './ChatComponent.module.css';
import { AppContext } from '../../store/app-context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useContext, useRef, useState, useEffect } from 'react';
import { faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

function ChatComponent({ isChatOpen, closeChat }) {
    const { socketConnection, userData, roomId } = useContext(AppContext);
    const [messages, setMessages] = useState([]);
    const inputRef = useRef();

    const handleSendMessageByEnter = (event) => {
        const value = inputRef.current.value.trim();
        if (event.key === 'Enter' && value.length > 0) {
            const msgObj = { info: value, senderName: userData.name };
            setMessages((pervMessages) => {
                inputRef.current.value = '';
                return [...pervMessages, msgObj];
            });
            socketConnection.sendMessage(roomId, msgObj);
        }
    }

    const handleSendMessage = () => {
        const value = inputRef.current.value.trim();

        if (value.length > 0) {
            const msgObj = { info: value, senderName: userData.name };
            setMessages((pervMessages) => {
                inputRef.current.value = '';
                return [...pervMessages, msgObj];
            });
            socketConnection.sendMessage(roomId, msgObj);
        }
    };

    useEffect(() => {

        const handleMessageRecieved = (msgObj) => {
            console.log('message recieved', msgObj);
            setMessages((pervMessages) => {
                return [...pervMessages, msgObj];
            });
        }

        socketConnection.socket.on("message_Recieved", handleMessageRecieved);

        return () => {
            socketConnection.socket.off("message_Recieved", handleMessageRecieved);
        };

    }, [])

    return (
        <div className={isChatOpen ? style.chat : style.chatClose}>
            <div className={style.mainGrid}>
                <div className={style.chatItem}>
                    <h2>In-call-message</h2>
                    <button className={style.closeButton} onClick={closeChat}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className={style.message}>
                    {
                        messages.map((msg, index) => {
                            return (<div key={index} className={style.messageInfo} >
                                <h4>{msg?.senderName}</h4>
                                <p>{msg?.info}</p>
                            </div>);
                        })
                    }
                </div>
                <div className={style.messageInput}>
                    <input
                        type="text"
                        placeholder="Type your message..."
                        ref={inputRef}
                        onKeyDown={handleSendMessageByEnter}
                    />
                    <button className={style.sendButton} onClick={handleSendMessage}>
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            </div>
        </div>
    );
}


export default ChatComponent