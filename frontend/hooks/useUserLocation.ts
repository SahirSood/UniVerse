import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

type Coords = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
};

type UseUserLocationOpts = {
  distanceInterval?: number; // meters between updates
  timeInterval?: number;     // ms between updates
  accuracy?: Location.LocationAccuracy;
};

export function useUserLocation(opts: UseUserLocationOpts = {}) {
  const {
    distanceInterval = 15,
    timeInterval = 5000,
    accuracy = Location.Accuracy.Balanced,
  } = opts;

  const [status, setStatus] = useState<'idle'|'denied'|'granted'|'watching'>('idle');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  // ask permission + get initial fix
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status: s } = await Location.requestForegroundPermissionsAsync();
        if (s !== 'granted') {
          setStatus('denied');
          setError('Location permission not granted');
          return;
        }
        setStatus('granted');

        const pos = await Location.getCurrentPositionAsync({ accuracy });
        if (!cancelled) {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to get location');
      }
    })();
    return () => { cancelled = true; };
  }, [accuracy]);

  // start continuous updates
  const start = async () => {
    try {
      if (subRef.current) return; // already running
      setStatus('watching');
      subRef.current = await Location.watchPositionAsync(
        { accuracy, distanceInterval, timeInterval },
        (loc) => {
          setCoords({
            latitude:  loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy:  loc.coords.accuracy,
            heading:   loc.coords.heading,
            speed:     loc.coords.speed,
          });
        }
      );
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start location watch');
    }
  };

  const stop = () => {
    subRef.current?.remove();
    subRef.current = null;
    setStatus('granted');
  };

  useEffect(() => () => stop(), []);

  return { status, coords, error, start, stop };
}
