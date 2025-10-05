import { Server as SocketIOServer } from "socket.io";
import LocationIds from "../enums/location_id.js";

function SocketServerInit(server, port) {
    let io;

    // Room data initialized here as a dictionary. Usually we would use firebase but I'm lazy.
    const rooms = {};
    for (const location of Object.keys(LocationIds)) {
        rooms[location] = [];
    }
    
    // Log all available rooms for debugging
    console.log("Available rooms:", Object.keys(LocationIds));
    
    try {
        io = new SocketIOServer(server, {
            cors: {
                origin: "*", // Allow all origins in development
                methods: ["GET", "POST"]
            }
        });
        console.log("Socket server succesfully initialized");
    } catch(err) {
        console.error("Failed to initialize socket server.")
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
                console.log(`User ${userId} joined room: ${room}`);
                socket.emit("joinedRoom", { room: room });
            } else {
                console.warn(`INVALID: User ${socket.id} tried to join room: ${room}`)
                socket.emit("error", { message: "Invalid room name" });
            }
        });

        socket.on("leaveRoom", (userId, room) => {
            if (LocationIds[room]) {
                // Remove user from room array
                if (rooms[room]) {
                    rooms[room] = rooms[room].filter((id) => id !== userId);
                }
                // Leave the socket.io room
                socket.leave(room);
                console.log(`User ${userId} left room: ${room}`);
                socket.emit("leftRoom", { room: room });
            } else {
                console.warn(`INVALID: User ${socket.id} tried to leave room: ${room}`)
            }
        });

        socket.on("sendMessage", (userId, room, message) => {
            if (LocationIds[room]) {
                // Broadcast message to all users in the room except the sender
                socket.broadcast.to(room).emit("recieveMessage", message);
                console.log(`Message sent in room ${room} by user ${userId}`);
            } else {
                console.warn(`INVALID: User ${socket.id} tried to send message to room: ${room}`)
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