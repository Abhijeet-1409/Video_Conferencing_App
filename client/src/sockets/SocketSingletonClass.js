// SocketSingletonClass.js react

import { io } from "socket.io-client";

const vite_mode = import.meta.env.VITE_MODE;

const backend_url = vite_mode == "production" ? import.meta.env.VITE_BACKEND_URL : "http://localhost:8000";

class Socket {

    static instance = null;
    socket = null;

    constructor() {
        if (!Socket.instance) {
            this.socket = io(backend_url, {
                transports: ['websocket'], // Ensure only websocket transport is used
                withCredentials: true, // Disable sending cookies in cross-origin requests
            });
            Socket.instance = this;
        }
        return Socket.instance;
    }

    getSocket() {
        return this.socket;
    }

}

const socketInstance = new Socket();

Object.freeze(socketInstance);

export default socketInstance;