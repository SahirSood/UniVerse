import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../components/TopBar';
import RoomJoinModal from '../../components/RoomJoinModal';

interface Room {
  id: number;
  name: string;
  users: number;
  x: number;
  y: number;
  active: boolean;
}

export default function MapScreen() {
  const [currentRoom, setCurrentRoom] = useState('Tim Hortons - Main Floor');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const rooms: Room[] = [
    { id: 1, name: 'Tim Hortons - Main Floor', x: 45, y: 60, users: 12, active: true },
    { id: 2, name: 'Library - 2nd Floor', x: 65, y: 35, users: 24, active: false },
    { id: 3, name: 'Engineering Building', x: 30, y: 40, users: 8, active: false },
    { id: 4, name: 'Student Center', x: 55, y: 70, users: 15, active: false },
    { id: 5, name: 'Gym - Main Entrance', x: 75, y: 65, users: 6, active: false },
  ];

  const handleRoomPress = (room: Room) => {
    if (!room.active) {
      setSelectedRoom(room);
    }
  };

  const handleJoinRoom = () => {
    if (selectedRoom) {
      setCurrentRoom(selectedRoom.name);
      setSelectedRoom(null);
      // Navigate to chat tab would go here
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar currentRoom={currentRoom} userCount={12} />
      
      <View style={styles.mapContainer}>
        <View style={styles.map}>
          {/* Map Background */}
          <View style={styles.mapBackground} />
          
          {/* Room Markers */}
          {rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.roomMarker,
                { left: `${room.x}%`, top: `${room.y}%` },
                room.active && styles.activeMarker,
              ]}
              onPress={() => handleRoomPress(room)}
            >
              <Ionicons
                name="location"
                size={room.active ? 32 : 28}
                color={room.active ? '#CC0633' : '#FF6B85'}
              />
              <View style={styles.userBadge}>
                <Ionicons name="people" size={10} color="#666" />
                <Text style={styles.userCount}>{room.users}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Activity Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Activity</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#4ADE80' }]} />
              <Text style={styles.legendText}>High</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#FBBF24' }]} />
              <Text style={styles.legendText}>Med</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
              <Text style={styles.legendText}>Low</Text>
            </View>
          </View>
        </View>
      </View>

      <RoomJoinModal
        visible={selectedRoom !== null}
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
        onJoin={handleJoinRoom}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF5F7',
  },
  map: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE0E6',
    overflow: 'hidden',
    position: 'relative',
  },
  mapBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FEFEFE',
  },
  roomMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  activeMarker: {
    transform: [{ translateX: -16 }, { translateY: -16 }, { scale: 1.2 }],
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0E6',
    marginTop: 4,
    gap: 4,
  },
  userCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  legend: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0E6',
    gap: 8,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666666',
  },
});