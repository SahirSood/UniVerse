import * as d3 from "d3";
import * as turf from "@turf/turf";

// Inefficient, but works for a small-scale project.
// returns the nearestpolygon, if its actually inside said polygon, id, and distance
function findNearestPolygon(geojson, lon, lat) {
  const point = turf.point([lon, lat]);
  let insidePolygon = null;
  let nearestPolygon = null;
  let minDistance = Infinity;

  geojson.features.forEach(feature => {
    const polygon = feature.geometry;

    if (turf.booleanPointInPolygon(point, polygon)) {
      insidePolygon = feature;
    }

    const centroid = turf.centroid(polygon);
    const distance = turf.distance(point, centroid);

    if (distance < minDistance) {
      minDistance = distance;
      nearestPolygon = feature;
    }
  });

  return {
    inside: insidePolygon ? true : false,
    polygon: insidePolygon ? insidePolygon : nearestPolygon,
    polygonId: insidePolygon ? insidePolygon.id : nearestPolygon.id,
    distance: minDistance
  };
}


export default findNearestPolygon