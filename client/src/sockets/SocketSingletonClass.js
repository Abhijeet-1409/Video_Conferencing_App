// SocketSingletonClass.js react

import { io } from "socket.io-client";

const backend_url = import.meta.env.VITE_BACKEND_URL;

class Socket {

    static instance = null;
    socket = null;

    constructor() {
        if (!Socket.instance) {
            this.socket = io(backend_url, {
                transports: ['websocket'], // Ensure only websocket transport is used
                withCredentials: false, // Disable sending cookies in cross-origin requests
                extraHeaders: {
                    "Access-Control-Allow-Origin": "*", // Set CORS header explicitly
                },
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