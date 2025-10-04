import express from 'express';
import http from 'http';
import findNearestPolygon from './helpers/LocationToRoom.js';
import SocketServerInit from './helpers/WebSockets.js';

// location imports
import fs from "fs";
const geojson = JSON.parse(
  fs.readFileSync(new URL("./locations/SFU.geojson", import.meta.url), "utf8")
);

// Server starting
const app = express();
const server = http.createServer(app);
const port = 3000
const socketServer = SocketServerInit(server, port)

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/locations', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon query params required as numbers' });
  }

  // IMPORTANT: function expects (lon, lat)
  const location = findNearestPolygon(geojson, lon, lat);
  return res.json(location);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});