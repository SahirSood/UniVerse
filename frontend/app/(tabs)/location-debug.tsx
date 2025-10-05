import React, { useEffect } from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet } from 'react-native';
import { useUserLocation } from '../../hooks/useUserLocation';

export default function LocationDebug() {
  const { status, coords, error, start, stop } = useUserLocation({
    distanceInterval: 15,
    timeInterval: 5000,
  });

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Location Debug</Text>
      <Text style={styles.text}>Status: {status}</Text>
      {error ? <Text style={styles.err}>Error: {error}</Text> : null}
      {coords ? (
        <View style={styles.card}>
          <Text style={styles.text}>lat: {coords.latitude.toFixed(6)}</Text>
          <Text style={styles.text}>lon: {coords.longitude.toFixed(6)}</Text>
          {coords.accuracy != null && <Text style={styles.text}>accuracy: ~{Math.round(coords.accuracy)} m</Text>}
        </View>
      ) : (
        <Text style={styles.text}>Waiting for GPS…</Text>
      )}
      <View style={styles.row}>
        <Button title="Start" onPress={start} />
        <View style={{ width: 12 }} />
        <Button title="Stop" onPress={stop} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  err: { color: 'red' },
  card: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', gap: 6 },
  row: { flexDirection: 'row', marginTop: 12 },
  text: { color: 'white' },
});
