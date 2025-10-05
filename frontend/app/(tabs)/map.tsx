import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Geojson, Marker, Circle } from 'react-native-maps';
import geojsonData from '../../assets/SFU.json';
import { useUserLocation } from '../../hooks/useUserLocation';

export default function TestScreen() {
  const mapRef = useRef<MapView>(null);
  const { status, coords, error, start, stop } = useUserLocation({
    distanceInterval: 15,
    timeInterval: 5000,
  });

  useEffect(() => {
    start();
    return () => stop();
  }, []);
  const centerOnUser = () => {
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.0005,
        longitudeDelta: 0.0005,
      }, 1000);
    }
  };
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
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
            radius={coords.accuracy ?? 20}
            fillColor="rgba(0, 122, 255, 0.3)"
            strokeColor="rgba(0, 122, 255, 0.8)"
            strokeWidth={2}
        />
        )} {/* Small dot in center */}
        {coords && (
        <Circle
            center={{
            latitude: coords.latitude,
            longitude: coords.longitude,
            }}
            radius={3}
            fillColor="#007AFF"
            strokeColor="white"
            strokeWidth={2}
        />
        )}
      </MapView>

      {/* Find Me Button */}
      <TouchableOpacity 
        style={styles.findMeButton}
        onPress={centerOnUser}
      >
        <Text style={styles.findMeText}>📍</Text>
      </TouchableOpacity>
  

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
  findMeButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  findMeText: {
    fontSize: 24,
  },
});