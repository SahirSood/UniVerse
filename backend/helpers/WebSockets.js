import { Server as SocketIOServer } from "socket.io";

function SocketServerInit(server, port) {
    const io = new SocketIOServer(server, {
    // cors: {
    //     origin: [process.env.CLIENT_URL],
    //     credentials: true,
    // }
    });

    io.on("connection", (socket) => {
        console.log("Client connected: ", socket.id)
    })

    
}
 
// WebSocket 

export default SocketServerInit