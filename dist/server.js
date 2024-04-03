"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const port = 8080;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const socketServer = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST']
    },
});
// rooms
const rooms = {};
const chats = {};
socketServer.on("connection", (socket) => {
    console.log("user connected");
    // event handlers
    const createRoom = () => {
        const roomId = (0, uuid_1.v4)();
        rooms[roomId] = []; //declare an array for peers of a particular room
        socket.emit("room-created", { roomId });
    };
    const leaveRoom = ({ peerId, roomId }) => {
        rooms[roomId] = rooms[roomId].filter(id => id !== peerId);
        socket.to(roomId).emit("user-disconnected", peerId);
    };
    const joinRoom = ({ roomId, peerId }) => {
        if (!rooms[roomId])
            rooms[roomId] = [];
        if (!chats[roomId])
            chats[roomId] = [];
        socket.emit("get-messages", chats[roomId]);
        console.log("user has join the toom");
        rooms[roomId].push(peerId);
        socket.join(roomId);
        socket.to(roomId).emit("user-joined", { peerId });
        socket.emit('get-users', {
            roomId,
            participants: rooms[roomId]
        });
        socket.on("disconnect", () => {
            console.log("user left the room", peerId);
            leaveRoom({ roomId, peerId });
        });
    };
    const addMessage = (roomId, messageData) => {
        console.log(messageData);
        if (chats[roomId]) {
            chats[roomId].push(messageData);
        }
        else {
            chats[roomId] = [messageData];
        }
        socket.to(roomId).emit('add-message', messageData);
    };
    // different events
    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
    socket.on("send-message", addMessage);
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});
server.listen(port, () => {
    console.log("server is running on port:", port);
});
