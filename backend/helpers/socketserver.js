import { Server as SocketIOServer } from "socket.io";
import LocationIds from "../enums/location_id.js";

function SocketServerInit(server, port) {
    let io;

    // Room data initialized here as a dictionary. Usually we would use firebase but I'm lazy.
    const rooms = {};
    for (const location of Object.keys(LocationIds)) {
        rooms[location] = [];
    }
    
    try {
        io = new SocketIOServer(server, {
        // cors: {
        //     origin: [process.env.CLIENT_URL],
        //     credentials: true,
        // }
        });
        console.log("Socket server succesfully initialized");
    } catch(err) {
        console.err("Failed to initialze socket server.")
        return {
            success: false,
            message: "Socket server failed to initialize"
        }
    }

    io.on("connection", (socket) => {
        console.log("Client connected: ", socket.id)
        let id, room;

        // requires the userId and the room value. should probably add a check function, but oh well.
        socket.on("joinRoom", (userId, room) => {
            if (LocationIds[room]) {
                rooms[room].push(userId)
                socket.userId = userId;
                socket.room = room;
                socket.join(room);
                console.log(`User ${userId} joined room: ${roomName}`);
                socket.emit("joinedRoom", { room: roomName });
            } else {
                console.warn(`INVALID: User ${socket.id} joined room: ${roomName}`)
                socket.emit("error", { message: "Invalid room name" });
            }
        });

        socket.on("sendMessage", (userId, room, message) => {
            if (LocationIds[room]) {
                rooms[room].push(userId)
                socket.broadcast.emit("recieveMessage", message);
            } else {
                console.warn(`INVALID: User ${socket.id} joined room: ${roomName}`)
                socket.emit("error", { message: "Invalid room name" });
            } 
        });

        socket.on("disconnect", () => {
            const { userId, room } = socket;
            if (userId && room && rooms[room]) {
                rooms[room] = rooms[room].filter((id) => id !== userId);
                console.log(`User ${userId} removed from ${room}`);
            }
            
        });
    })

    
}
 
// WebSocket 

export default SocketServerInit