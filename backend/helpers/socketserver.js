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
            cors: {
                origin: "*", // In production, specify your client URL
                methods: ["GET", "POST"]
            }
        });
        console.log("Socket server successfully initialized");
    } catch(err) {
        console.error("Failed to initialize socket server.", err);
        return {
            success: false,
            message: "Socket server failed to initialize"
        }
    }

    io.on("connection", (socket) => {
        console.log("Client connected: ", socket.id);

        // requires the userId and the room value
        socket.on("joinRoom", (userId, room) => {
            if (LocationIds[room]) {
                rooms[room].push(userId);
                socket.userId = userId;
                socket.room = room;
                socket.join(room);
                console.log(`User ${userId} joined room: ${room}`);
                socket.emit("joinedRoom", { room: room });
                
                // Optionally notify others in room
                socket.to(room).emit("userJoined", { 
                    userId: userId,
                    userCount: rooms[room].length 
                });
            } else {
                console.warn(`INVALID: User ${socket.id} tried to join invalid room: ${room}`);
                socket.emit("error", { message: "Invalid room name" });
            }
        });

        socket.on("sendMessage", (userId, room, message) => {
            if (LocationIds[room]) {
                console.log(`Message from ${userId} in ${room}:`, message.text);
                // Broadcast to everyone in the room EXCEPT the sender
                socket.to(room).emit("recieveMessage", message);
            } else {
                console.warn(`INVALID: User ${socket.id} tried to send to invalid room: ${room}`);
                socket.emit("error", { message: "Invalid room name" });
            } 
        });

        socket.on("disconnect", () => {
            const { userId, room } = socket;
            if (userId && room && rooms[room]) {
                rooms[room] = rooms[room].filter((id) => id !== userId);
                console.log(`User ${userId} removed from ${room}`);
                
                // Notify others in room
                socket.to(room).emit("userLeft", { 
                    userId: userId,
                    userCount: rooms[room].length 
                });
            }
        });
    });

    return {
        success: true,
        io: io
    };
}

export default SocketServerInit;