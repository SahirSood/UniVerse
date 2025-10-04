import express from 'express';
import { Server as SocketIOServer } from "socket.io";
import LocationId from './enums/location_id';
import findNearestPolygon from './helpers/LocationToRoom';

// location imports
import geojson from "../locations/SFU.geojson"



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

server.get('/locations', (req, res) => {
  const location = findNearestPolygon(geojson, req.lat, req.lon);
  res.send(location);
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});