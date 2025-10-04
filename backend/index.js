import express from 'express';
import findNearestPolygon from './helpers/LocationToRoom';
import SocketServerInit from './helpers/WebSockets';

// location imports
import geojson from "../locations/SFU.geojson"


// Server starting
const server = express();
const port = 3000
const socketServer = SocketServerInit(server, port)


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