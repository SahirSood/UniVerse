import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Polygon, Circle, LatLng, MapType, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import geojsonData from '../../assets/SFU.json';
import { useUserLocation } from '../../hooks/useUserLocation';

type Ring = [number, number][];
type Feature = {
  type: 'Feature';
  id?: string | number;
  properties?: Record<string, any>;
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: Ring[] | Ring[][] };
};
type FC = { type: 'FeatureCollection'; features: Feature[] };

// ---------- helpers ----------
const ringToLatLng = (ring: Ring): LatLng[] =>
  ring.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));

const centroid = (pts: LatLng[]) => {
  let x = 0, y = 0;
  for (const p of pts) { x += p.latitude; y += p.longitude; }
  const n = Math.max(pts.length, 1);
  return { latitude: x / n, longitude: y / n } as LatLng;
};

const firstDefined = (obj: Record<string, any>, keys: string[]) => {
  for (const k of keys) if (obj[k] != null) return obj[k];
  return undefined;
};
const keyify = (s: string) => s.trim().replace(/\s+/g, '_').toUpperCase(); // "Dining Commons" -> "DINING_COMMONS"

// point-in-polygon (even-odd)
function pointInRing(point: LatLng, ring: LatLng[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].longitude, yi = ring[i].latitude;
    const xj = ring[j].longitude, yj = ring[j].latitude;
    const intersect =
      (yi > point.latitude) !== (yj > point.latitude) &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / ((yj - yi) || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
const pointInPolygon = (pt: LatLng, outer: LatLng[], holes: LatLng[][]) =>
  pointInRing(pt, outer) && !holes.some(h => pointInRing(pt, h));

// scale bar helpers
const { width: SCREEN_W } = Dimensions.get('window');
function metersPerPixel(region: Region) {
  const degPerPx = region.longitudeDelta / SCREEN_W;
  const metersPerDegLon = 111320 * Math.cos((region.latitude * Math.PI) / 180);
  return degPerPx * metersPerDegLon;
}
function niceScaleMeters(targetMeters: number) {
  const bases = [1, 2, 5];
  const pow = Math.pow(10, Math.floor(Math.log10(targetMeters)));
  let best = bases[0] * pow;
  for (const b of bases) {
    const val = b * pow;
    if (Math.abs(val - targetMeters) < Math.abs(best - targetMeters)) best = val;
  }
  if (best < targetMeters / 2) best *= 2;
  if (best > targetMeters * 2) best /= 2;
  return best;
}
function formatMeters(m: number) {
  if (m >= 1000) {
    const km = m / 1000;
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
  }
  return `${Math.round(m)} m`;
}

// ---------- polygons prep (robust id/name) ----------
function usePreparedPolygons(fc: FC) {
  return useMemo(() => {
    const out: { id: string; name: string; outer: LatLng[]; holes: LatLng[][]; center: LatLng }[] = [];

    for (const f of fc.features) {
      const props = f.properties ?? {};
      const nameProp = firstDefined(props, ['name', 'Name', 'title', 'Title']);
      const shortProp = firstDefined(props, ['short', 'Short', 'SHORT']);
      const anyIdProp = firstDefined(props, ['id', 'Id', 'ID']);

      // prefer short -> keyified name -> feature.id
      const idRaw =
        (typeof shortProp === 'string' && shortProp) ||
        (typeof nameProp === 'string' && keyify(nameProp)) ||
        (f.id != null ? String(f.id) : (anyIdProp != null ? String(anyIdProp) : Math.random().toString(36)));

      const displayName =
        (typeof nameProp === 'string' && nameProp) ||
        (typeof shortProp === 'string' && shortProp) ||
        String(idRaw);

      const baseId = String(idRaw); // normalize to string

      if (f.geometry.type === 'Polygon') {
        const [outer, ...holes] = f.geometry.coordinates as Ring[];
        const o = ringToLatLng(outer);
        out.push({ id: baseId, name: displayName, outer: o, holes: holes.map(r => ringToLatLng(r)), center: centroid(o) });
      } else if (f.geometry.type === 'MultiPolygon') {
        const polys = f.geometry.coordinates as Ring[][];
        polys.forEach((poly, idx) => {
          const [outer, ...holes] = poly;
          const o = ringToLatLng(outer);
          out.push({
            id: `${baseId}-${idx}`,
            name: displayName,
            outer: o,
            holes: holes.map(r => ringToLatLng(r)),
            center: centroid(o),
          });
        });
      }
    }
    return out;
  }, [fc]);
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { coords, start, stop } = useUserLocation({ distanceInterval: 10, timeInterval: 1500 });
  const polys = usePreparedPolygons(geojsonData as FC);

  // manual vs auto selection
  const [autoZoneId, setAutoZoneId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const activeZoneId = selectedZoneId ?? autoZoneId;

  // dwell for auto
  const candidateRef = useRef<string | null>(null);
  const sinceRef = useRef<number>(0);
  const DWELL_MS = 1500;

  // map type + region/scale bar
  const [mapType, setMapType] = useState<MapType>('standard');
  const initialRegion: Region = {
    latitude: 49.2797,
    longitude: -122.9196,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };
  const [region, setRegion] = useState<Region>(initialRegion);

  const mPerPx = metersPerPixel(region);
  const targetPx = 100;
  const niceMeters = niceScaleMeters(mPerPx * targetPx);
  const scaleWidthPx = Math.max(30, Math.min(180, Math.round(niceMeters / mPerPx)));
  const scaleLabel = formatMeters(niceMeters);

  useEffect(() => { start(); return () => stop(); }, []);

  useEffect(() => {
    if (!coords || polys.length === 0) return;

    let candidate: string | null = null;
    for (const p of polys) {
      if (pointInPolygon(coords, p.outer, p.holes)) { candidate = p.id; break; }
    }
    if (!candidate) {
      let best: { id: string; d: number } | null = null;
      for (const p of polys) {
        const d = Math.hypot(coords.latitude - p.center.latitude, coords.longitude - p.center.longitude);
        if (!best || d < best.d) best = { id: p.id, d };
      }
      candidate = best?.id ?? null;
    }

    const now = Date.now();
    if (candidateRef.current !== candidate) {
      candidateRef.current = candidate;
      sinceRef.current = now;
      return;
    }
    if (now - sinceRef.current >= DWELL_MS && autoZoneId !== candidate) {
      setAutoZoneId(candidate);
      if (!selectedZoneId) {
        const poly = polys.find(z => z.id === candidate);
        if (poly && mapRef.current) {
          mapRef.current.fitToCoordinates(poly.outer, {
            edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
            animated: true,
          });
        }
      }
    }
  }, [coords, polys, autoZoneId, selectedZoneId]);

  const centerOnUser = () => {
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.002,   // was 0.008
          longitudeDelta: 0.002,  // was 0.008
        },
        700 // optional: faster animation
      );
    }
  };

  const onPolygonPress = (id: string | number) => {
    const sid = String(id);
    setSelectedZoneId(sid);
    const poly = polys.find(z => z.id === sid);
    if (poly && mapRef.current) {
      mapRef.current.fitToCoordinates(poly.outer, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  };

  const toggleMapType = () => setMapType(t => (t === 'standard' ? 'hybrid' : 'standard'));

  // resolve active name safely, with hardcoded 0 -> Dining Commons as requested
  const idLabelOverrides: Record<string, string> = { '0': 'Dining Commons' };
  const activePoly =
    activeZoneId != null ? polys.find(z => z.id === String(activeZoneId)) : undefined;
  const activeName =
    activePoly?.name ??
    (activeZoneId != null ? (idLabelOverrides[String(activeZoneId)] ?? `Zone ${String(activeZoneId)}`) : 'Select a zone');

  // FAB sizes
  const FAB_SIZE = 56;
  const GAP = 12;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={mapType}
        showsCompass
        showsBuildings
        initialRegion={initialRegion}
        onRegionChange={(r) => setRegion(r)}            // <— continuous scalebar updates
        onRegionChangeComplete={(r) => setRegion(r)}    // still capture final region
      >
        {polys.map((p) => (
          <Polygon
            key={p.id}
            coordinates={p.outer}
            holes={p.holes}
            tappable
            onPress={() => onPolygonPress(p.id)}
            fillColor={p.id === (activeZoneId ?? '') ? 'rgba(60,120,255,0.40)' : 'rgba(255,0,0,0.25)'}
            strokeColor={p.id === (activeZoneId ?? '') ? 'rgba(60,120,255,1)' : 'rgba(255,0,0,1)'}
            strokeWidth={2}
          />
        ))}

        {coords && (
          <>
            <Circle
              center={{ latitude: coords.latitude, longitude: coords.longitude }}
              radius={coords.accuracy ?? 20}
              fillColor="rgba(0,122,255,0.25)"
              strokeColor="rgba(0,122,255,0.9)"
              strokeWidth={2}
            />
            <Circle
              center={{ latitude: coords.latitude, longitude: coords.longitude }}
              radius={3}
              fillColor="#007AFF"
              strokeColor="#ffffff"
              strokeWidth={2}
            />
          </>
        )}
      </MapView>

      {/* Centered title under the notch */}
      <View pointerEvents="none" style={[styles.hudWrap, { paddingTop: insets.top + 8 }]}>
        <View style={styles.hudPill}>
          <Text style={styles.hudTitle} numberOfLines={1} ellipsizeMode="tail">
            {activeName}
          </Text>
        </View>
      </View>

      {/* Custom scale bar – bottom-left above logo (continuous updates) */}
      <View
        pointerEvents="none"
        style={[styles.scaleWrap, { bottom: insets.bottom + 26 }]}
      >
        <Text style={styles.scaleText}>{scaleLabel}</Text>
        <View style={[styles.scaleBar, { width: scaleWidthPx }]}>
          <View style={styles.scaleHalfLight} />
          <View style={styles.scaleHalfDark} />
        </View>
      </View>

      {/* 🛰 left of 📍 */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 30, right: 20 + FAB_SIZE + GAP }]}
        onPress={toggleMapType}
      >
        <Text style={styles.fabText}>{mapType === 'standard' ? '🛰️' : '🗺️'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fab, { bottom: 30, right: 20 }]}
        onPress={centerOnUser}
      >
        <Text style={styles.fabText}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0b' },
  map: { width: '100%', height: '100%' },

  // top-centered title
  hudWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    alignItems: 'center',
  },
  hudPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  hudTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: 0.3,
  },

  // bottom-left scale
  scaleWrap: {
    position: 'absolute',
    left: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  scaleBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'transparent',
    flexDirection: 'row',
  },
  scaleHalfLight: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  scaleHalfDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  scaleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 2,
  },

  // floating buttons
  fab: {
    position: 'absolute',
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  fabText: { fontSize: 22 },
});
