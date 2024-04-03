import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { v4 as uuid } from 'uuid'

const port = 8080;
const app = express();

app.use(cors());

const server = http.createServer(app);

const socketServer = new Server(server, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST']
    },
});


// rooms
const rooms: Record<string, string[]> = {};
// chats
interface IMessage {
    content: string,
    author?: string,
    timestamp: number
}
const chats: Record<string, IMessage[]> = {};

socketServer.on("connection", (socket: Socket) => {
    console.log("user connected");

    // event handlers
    const createRoom = () => {
        const roomId = uuid();
        rooms[roomId] = [] //declare an array for peers of a particular room
        socket.emit("room-created", { roomId });
    }

    const leaveRoom = ({ peerId, roomId }: any) => {
        rooms[roomId] = rooms[roomId].filter(id => id !== peerId);
        socket.to(roomId).emit("user-disconnected", peerId);
    }

    const joinRoom = ({ roomId, peerId }: any) => {
        if (!rooms[roomId]) rooms[roomId] = [];
        if(!chats[roomId]) chats[roomId] = [];

        socket.emit("get-messages", chats[roomId]);
        
        console.log("user has join the toom");
        rooms[roomId].push(peerId);
        socket.join(roomId);

        socket.to(roomId).emit("user-joined", { peerId });

        socket.emit('get-users', {
            roomId,
            participants: rooms[roomId]
        })

        socket.on("disconnect", () => {
            console.log("user left the room", peerId);
            leaveRoom({ roomId, peerId });
        })

    }

    const addMessage = (roomId:string , messageData:IMessage) => {
        console.log(messageData);
        
        if (chats[roomId]) {
            chats[roomId].push(messageData);
        } else {
            chats[roomId] = [messageData];
        }

        socket.to(roomId).emit('add-message', messageData)

    }

    // different events
    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
    socket.on("send-message", addMessage)


    socket.on("disconnect", () => {
        console.log("user disconnected");
    })
})

server.listen(port, () => {
    console.log("server is running on port:", port);
})


