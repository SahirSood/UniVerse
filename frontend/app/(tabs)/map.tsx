import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Geojson, Marker, Circle } from 'react-native-maps';
import geojsonData from '../../assets/SFU.json';
import { useUserLocation } from '../../hooks/useUserLocation';

export default function TestScreen() {
  const { status, coords, error, start, stop } = useUserLocation({
    distanceInterval: 15,
    timeInterval: 5000,
  });

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: coords?.latitude || 49.2781,
          longitude: coords?.longitude || -122.9199,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Geojson
          geojson={geojsonData as any}
          strokeColor="red"
          fillColor="rgba(255,0,0,0.3)"
          strokeWidth={2}
        />
        
        {/* Show user location marker */}
        {coords && (
        <Circle
        center={{
            latitude: coords.latitude,
            longitude: coords.longitude,
        }}
        radius={50} // 50 meters
        fillColor="rgba(0, 122, 255, 0.3)"
        strokeColor="rgba(0, 122, 255, 0.8)"
        strokeWidth={2}
        />
        )}
      </MapView>
      
      {/* Optional: Show status */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  errorBox: {
    position: 'absolute',
    top: 50,
    backgroundColor: 'rgba(255,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  },
});