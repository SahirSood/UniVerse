import React, { useRef, useMemo, useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useUserId } from '../../hooks/useUserId';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BroadcastType = 'coffee' | 'help' | 'study' | 'lost' | 'rideshare' | 'food';

type Broadcast = {
  id: string;
  type: BroadcastType;
  title: string;
  message: string;
  from: string;
  time: string;
  location?: string;
};

const typeMeta: Record<BroadcastType, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  'coffee': { color: '#CC0633', icon: 'cafe', label: 'Coffee' },
  'help': { color: '#CC0633', icon: 'help-buoy', label: 'Help' },
  'study': { color: '#CC0633', icon: 'book', label: 'Study' },
  'lost-found': { color: '#CC0633', icon: 'search', label: 'Lost & Found' },
  'rideshare': { color: '#3B82F6', icon: 'car', label: 'Rideshare' },
  'food-delivery': { color: '#10B981', icon: 'restaurant', label: 'Food' },
};

export default function HomeScreen() {
  // Hardcoded preferences; later replace with shared state from Profile
  const preferences: Record<BroadcastType, boolean> = {
    'coffee': true,
    'help': true,
    'study': true,
    'lost-found': true,
    'rideshare': false,
    'food': false,
  };

  const broadcastTypes: BroadcastPreference[] = [
    { id: 'coffee', title: 'Coffee Runs', icon: 'cafe', color: '#CC0633' },
    { id: 'help', title: 'Help Requests', icon: 'help-circle', color: '#CC0633' },
    { id: 'study', title: 'Study Groups', icon: 'book', color: '#CC0633' },
    { id: 'lost', title: 'Lost & Found', icon: 'search', color: '#CC0633' },
    { id: 'rideshare', title: 'Ride Sharing', icon: 'car', color: '#3B82F6' },
    { id: 'food', title: 'Food Delivery', icon: 'restaurant', color: '#10B981' },
  ];
  const { userId, loading } = useUserId();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
      
      socketRef.current.on('connect', () => {
        console.log('Connected to socket server');
        setIsSocketConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsSocketConnected(false);
      });

      socketRef.current.on('joinedRoom', (data) => {
        console.log('Joined room:', data.room);
      });

      socketRef.current.on('leftRoom', (data) => {
        console.log('Left room:', data.room);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Load saved preferences on component mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Sync preferences with socket when userId changes or socket connects
  useEffect(() => {
    if (userId && socketRef.current && isSocketConnected && !hasSynced) {
      // Only sync once on initial connection
      syncPreferencesWithSocket();
      setHasSynced(true);
    }
  }, [userId, isSocketConnected, hasSynced]);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem('roomPreferences');
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setBroadcastPreferences(prev => 
          Object.keys(prev).reduce((acc, key) => {
            acc[key as BroadcastType] = parsed[key] || false;
            return acc;
          }, {} as Record<BroadcastType, boolean>)
        );
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (preferences: Record<BroadcastType, boolean>) => {
    try {
      await AsyncStorage.setItem('roomPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const syncPreferencesWithSocket = () => {
    if (!socketRef.current || !userId || !isSocketConnected) return;

    Object.entries(broadcastPreferences).forEach(([room, enabled]) => {
      if (enabled) {
        socketRef.current!.emit('joinRoom', userId, room);
      } else {
        socketRef.current!.emit('leaveRoom', userId, room);
      }
    });
  };

  const toggleBroadcastPreference = async (type: BroadcastType) => {
    const newValue = !broadcastPreferences[type];
    
    const updatedPreferences = {
      ...broadcastPreferences,
      [type]: newValue
    };
    
    setBroadcastPreferences(updatedPreferences);
    
    // Save preferences to AsyncStorage
    await savePreferences(updatedPreferences);
  
    if (socketRef.current && userId && isSocketConnected) {
      if (newValue) {
        // Join room when toggled ON
        socketRef.current.emit('joinRoom', userId, type);
        console.log(`Joined room: ${type}`);
      } else {
        // Leave room when toggled OFF
        socketRef.current.emit('leaveRoom', userId, type);
        console.log(`Left room: ${type}`);
      }
    } else if (!isSocketConnected) {
      console.log('Socket not connected, room preference saved but not synced yet');
    }
  };
  const menuItems = [
    { id: 1, title: 'Edit Profile', icon: 'person-outline' as const },
    { id: 2, title: 'Settings', icon: 'settings-outline' as const },
    { id: 3, title: 'Privacy', icon: 'lock-closed-outline' as const },
    { id: 4, title: 'Notifications', icon: 'notifications-outline' as const },
    { id: 5, title: 'Help & Support', icon: 'help-circle-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={styles.cardTitle}>{b.title}</Text>
          <View style={styles.spacer} />
          <Text style={styles.time}>{b.time}</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isSocketConnected ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {isSocketConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
        <Text style={styles.message}>{b.message}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>From: {b.from}</Text>
          {b.location ? <Text style={styles.metaText}> • {b.location}</Text> : null}
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.declineBtn} onPress={() => declineBroadcast(b.id)}>
            <Text style={styles.declineText}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptBroadcast(b.id)}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const CommitmentCard = ({ b }: { b: Broadcast }) => {
    const meta = typeMeta[b.type];
    return (
      <View style={styles.commitCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: `${meta.color}14` }]}>
            <Ionicons name={meta.icon as any} size={18} color={meta.color} />
          </View>
          <Text style={styles.cardTitle}>{b.title}</Text>
          <View style={styles.spacer} />
          <Text style={styles.time}>{b.time}</Text>
        </View>
        <Text style={styles.message}>{b.message}</Text>
        <View style={styles.metaRow}>
          {b.location ? <Text style={styles.metaText}>{b.location}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Incoming Broadcasts</Text>
        <View style={styles.list}>
          {filteredIncoming.length === 0 ? (
            <Text style={styles.emptyText}>No new broadcasts</Text>
          ) : (
            filteredIncoming.map(b => <BroadcastCard key={b.id} b={b} />)
          )}
        </View>

        <Text style={[styles.heading, { marginTop: 12 }]}>Your Commitments</Text>
        <View style={styles.list}>
          {commitments.length === 0 ? (
            <Text style={styles.emptyText}>No commitments yet</Text>
          ) : (
            commitments.map(b => <CommitmentCard key={b.id} b={b} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  list: { gap: 10 },
  card: {
    borderWidth: 1, borderColor: '#F3D5DC', borderRadius: 12, padding: 12, backgroundColor: '#FFF5F7',
  },
  commitCard: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, backgroundColor: '#F9FAFB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  time: { fontSize: 12, color: '#6B7280' },
  spacer: { flex: 1 },
  message: { fontSize: 14, color: '#374151', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6B7280' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  declineBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F3F4F6' },
  declineText: { color: '#111827', fontWeight: '600' },
  acceptBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#CC0633' },
  acceptText: { color: '#fff', fontWeight: '700' },

  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 8 },
  // Connection Status Styles
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});