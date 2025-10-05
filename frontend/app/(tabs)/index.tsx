import React, { useMemo, useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useUserId } from '../../hooks/useUserId';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { config } from '../../config';

type BroadcastType = 'coffee' | 'help' | 'study' | 'lost-found' | 'rideshare' | 'food-delivery';

type Broadcast = {
  id: string;
  type: BroadcastType;
  title: string;
  message: string;
  from: string;
  time: string;
  location?: string;
};

const SOCKET_URL = config.SOCKET_URL;

export default function HomeScreen() {
  const socketRef = useRef<Socket | null>(null);
  const { userId, loading } = useUserId();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [preferences, setPreferences] = useState<Record<BroadcastType, boolean>>({
    'coffee': false,
    'help': false,
    'study': false,
    'lost-found': false,
    'rideshare': false,
    'food-delivery': false,
  });

  // Example incoming broadcasts
  const allIncoming: Broadcast[] = [
    { id: 'b1', type: 'coffee', title: 'Coffee Run', message: 'Grabbing iced lattes. Want one?', from: 'Sarah M.', time: '2m', location: 'Tim Hortons - Main' },
    { id: 'b2', type: 'help', title: 'Need Calculator', message: 'Forgot calculator for MATH 101', from: 'Mike T.', time: '5m', location: 'Library 2F' },
    { id: 'b3', type: 'study', title: 'Finals Study Group', message: 'CS201 study in 10 mins', from: 'Emma L.', time: '8m', location: 'Student Center' },
    { id: 'b4', type: 'lost-found', title: 'Lost Water Bottle', message: 'Blue Hydroflask near gym', from: 'Alex P.', time: '12m', location: 'Gym Entrance' },
  ];

  const [incoming, setIncoming] = useState<Broadcast[]>([]);
  const [commitments, setCommitments] = useState<Broadcast[]>([
    // Example pre-committed item
    { id: 'c1', type: 'help', title: 'Lab Partner', message: 'Helping with lab wiring', from: 'You', time: 'Today', location: 'ENG Building' },
  ]);

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

      socketRef.current.on('receiveMessage', (broadcastData: Broadcast) => {
        setIncoming(prev => [broadcastData, ...prev]);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Load preferences from AsyncStorage
  useEffect(() => {
    loadPreferences();
  }, []);

  // Reload preferences when home tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadPreferences();
    }, [])
  );

  // Listen for app state changes to reload preferences
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        loadPreferences();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Sync preferences with socket when userId changes or socket connects
  useEffect(() => {
    if (userId && socketRef.current && isSocketConnected) {
      syncPreferencesWithSocket();
    }
  }, [userId, isSocketConnected, preferences]);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem('roomPreferences');
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        console.log('Loading preferences from storage:', parsed);
        setPreferences(prev => 
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

  const syncPreferencesWithSocket = () => {
    if (!socketRef.current || !userId || !isSocketConnected) return;

    Object.entries(preferences).forEach(([room, enabled]) => {
      if (enabled) {
        socketRef.current!.emit('joinRoom', userId, room);
      } else {
        socketRef.current!.emit('leaveRoom', userId, room);
      }
    });
  };

  const filteredIncoming = useMemo(
    () => incoming.filter(b => preferences[b.type]),
    [incoming, preferences]
  );

  const acceptBroadcast = (id: string) => {
    const b = incoming.find(x => x.id === id);
    if (!b) return;
    setIncoming(prev => prev.filter(x => x.id !== id));
    setCommitments(prev => [{ ...b, from: 'You', time: 'Now' }, ...prev]);
  };

  const declineBroadcast = (id: string) => {
    setIncoming(prev => prev.filter(x => x.id !== id));
  };

  const BroadcastCard = ({ b }: { b: Broadcast }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons name="radio" size={18} color="#CC0633" />
          </View>
          <Text style={styles.cardTitle}>{b.title}</Text>
          <View style={styles.spacer} />
          <Text style={styles.time}>{b.time}</Text>
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
    return (
      <View style={styles.commitCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
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
        <View style={styles.header}>
          <Text style={[styles.heading, { marginTop: 0 }]}>Incoming Broadcasts</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isSocketConnected ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {isSocketConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
        
        {/* Active Rooms Indicator */}
        <View style={styles.activeRoomsContainer}>
          <Text style={styles.activeRoomsTitle}>Listening for:</Text>
          <View style={styles.activeRoomsList}>
            {Object.entries(preferences).map(([type, enabled]) => {
              if (!enabled) return null;
              return (
                <View key={type} style={styles.activeRoomTag}>
                  <Ionicons name="radio" size={12} color="#CC0633" />
                  <Text style={styles.activeRoomText}>{type}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.list}>
          {filteredIncoming.length === 0 ? (
            <Text style={styles.emptyText}>No new broadcasts</Text>
          ) : (
            filteredIncoming.map(b => <BroadcastCard key={b.id} b={b} />)
          )}
        </View>

        <Text style={styles.heading}>Your Commitments</Text>
        <View style={styles.list}>
          {commitments.length === 0 ? (
            <Text style={styles.emptyText}>No commitments yet</Text>
          ) : (
            commitments.map(b => <CommitmentCard key={b.id} b={b} />)
          )}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 32 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  heading: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginTop: 12 },
  list: { gap: 10 },
  card: {
    borderWidth: 1, borderColor: '#F3D5DC', borderRadius: 12, padding: 12, backgroundColor: '#FFF5F7',
  },
  commitCard: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, backgroundColor: '#F9FAFB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#CC063315', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
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
  // Active Rooms Styles
  activeRoomsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeRoomsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  activeRoomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activeRoomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#CC063315',
    gap: 4,
  },
  activeRoomText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CC0633',
  },
  bottomSpacing: {
    height: 20,
  },
});