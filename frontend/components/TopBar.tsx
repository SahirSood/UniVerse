import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function TopBar({ currentRoom, userCount }: { currentRoom: string; userCount: number }) {
  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={styles.logo}><Text style={{ color: '#fff', fontWeight: '700' }}>CC</Text></View>
        <View>
          <Text style={styles.small}>Currently in</Text>
          <Text style={styles.room}>{currentRoom}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.iconButton}>
        <Feather name="bell" size={18} color="#444" />
        <View style={styles.unreadDot} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#fdeeee', backgroundColor: '#fff' },
  logo: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#B71C1C', alignItems: 'center', justifyContent: 'center' },
  small: { fontSize: 12, color: '#666' },
  room: { fontWeight: '700' },
  iconButton: { padding: 8 },
  unreadDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#B71C1C' },
});
