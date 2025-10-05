import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserId } from '../hooks/useUserId';

interface RoomPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const TEMPORARY_ROOMS: RoomPreference[] = [
  {
    id: 'coffee',
    name: 'Coffee',
    description: 'Find coffee shops and cafes nearby',
    enabled: false
  },
  {
    id: 'help',
    name: 'Help',
    description: 'Get help from other students',
    enabled: false
  },
  {
    id: 'study',
    name: 'Study',
    description: 'Find study groups and study spots',
    enabled: false
  },
  {
    id: 'lost',
    name: 'Lost',
    description: 'Help others who are lost on campus',
    enabled: false
  },
  {
    id: 'rideshare',
    name: 'Rideshare',
    description: 'Find or offer rides',
    enabled: false
  },
  {
    id: 'food',
    name: 'Food',
    description: 'Find food recommendations and dining options',
    enabled: false
  }
];

export default function ProfileScreen() {
  const [roomPreferences, setRoomPreferences] = useState<RoomPreference[]>(TEMPORARY_ROOMS);
  const { userId, loading } = useUserId();

  // Load saved preferences on component mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem('roomPreferences');
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setRoomPreferences(prev => 
          prev.map(room => ({
            ...room,
            enabled: parsed[room.id] || false
          }))
        );
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (updatedPreferences: RoomPreference[]) => {
    try {
      const preferencesToSave = updatedPreferences.reduce((acc, room) => {
        acc[room.id] = room.enabled;
        return acc;
      }, {} as Record<string, boolean>);
      
      await AsyncStorage.setItem('roomPreferences', JSON.stringify(preferencesToSave));
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  const toggleRoom = async (roomId: string) => {
    const updatedPreferences = roomPreferences.map(room => 
      room.id === roomId 
        ? { ...room, enabled: !room.enabled }
        : room
    );
    
    setRoomPreferences(updatedPreferences);
    await savePreferences(updatedPreferences);
  };

  const getRoomIcon = (roomId: string) => {
    switch (roomId) {
      case 'coffee':
        return 'cafe-outline';
      case 'help':
        return 'help-circle-outline';
      case 'study':
        return 'book-outline';
      case 'lost':
        return 'location-outline';
      case 'rideshare':
        return 'car-outline';
      case 'food':
        return 'restaurant-outline';
      default:
        return 'chatbubble-outline';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Room Preferences</Text>
        <Text style={styles.subtitle}>Enable rooms you want to join</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {roomPreferences.map((room) => (
          <View key={room.id} style={styles.roomCard}>
            <View style={styles.roomInfo}>
              <View style={styles.roomHeader}>
                <Ionicons 
                  name={getRoomIcon(room.id) as any} 
                  size={24} 
                  color={room.enabled ? '#007AFF' : '#8E8E93'} 
                />
                <Text style={[styles.roomName, room.enabled && styles.roomNameEnabled]}>
                  {room.name}
                </Text>
              </View>
              <Text style={styles.roomDescription}>
                {room.description}
              </Text>
            </View>
            <Switch
              value={room.enabled}
              onValueChange={() => toggleRoom(room.id)}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor={room.enabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Enabled rooms will be available in the chat section
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roomInfo: {
    flex: 1,
    marginRight: 12,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  roomNameEnabled: {
    color: '#007AFF',
  },
  roomDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 32,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
