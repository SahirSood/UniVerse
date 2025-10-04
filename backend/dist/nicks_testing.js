import fs from "fs";
import * as d3 from "d3-geo";
import findNearestPolygon from "./helpers/locations.js";
// const geojson = JSON.parse(
//   fs.readFileSync(new URL("./locations/SFU.geojson", import.meta.url), "utf8")
// );
// for (const ft of geojson.features) {
//     console.log(ft);
// }
// const x = findNearestPolygon(geojson, 1.0, 1.0)
// console.log(x)
import LocationIds from "./enums/location_id.ts";
for (const feature of LocationIds) {
    console.log(feature);
}
//# sourceMappingURL=nicks_testing.js.map