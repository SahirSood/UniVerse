import { View, Text, StyleSheet } from 'react-native';
import MapView, { Geojson } from 'react-native-maps';
import geojsonData from '../../assets/SFU.json';

export default function TestScreen() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
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
      </MapView>
    
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
  text: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
  },
});