import express from 'express';
import { Server as SocketIOServer } from "socket.io";

const server = express();
const port = 3000

// WebSocket 
const io = new SocketIOServer(server, {
    // cors: {
    //     origin: [process.env.CLIENT_URL],
    //     credentials: true,
    // }
});

server.get('/', (req, res) => {
  res.send('Hello World!')
});

server.get('/locate', (req, res) => {
  
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});