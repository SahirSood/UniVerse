import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useUserId } from '../../hooks/useUserId';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BroadcastType = 'coffee' | 'help' | 'study' | 'lost' | 'rideshare' | 'food';

interface BroadcastPreference {
  id: BroadcastType;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const SOCKET_URL = 'http://172.16.203.31:3000';
const API_URL = 'http://172.16.203.31:3000';
export default function ProfileScreen() {
  const socketRef = useRef<Socket | null>(null);

  
  const user = {
    name: 'John Doe',
    major: 'Computer Science Major',
    karma: 247,
    helpsGiven: 42,
    coffeeRuns: 18,
  };

  // Broadcast preferences state
  const [broadcastPreferences, setBroadcastPreferences] = useState<Record<BroadcastType, boolean>>({
    'coffee': false,
    'help': false,
    'study': false,
    'lost': false,
    'rideshare': false,
    'food': false,
  });

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
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.major}>{user.major}</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isSocketConnected ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {isSocketConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Karma Section */}
        <View style={styles.karmaCard}>
          <View style={styles.karmaHeader}>
            <Ionicons name="star" size={24} color="#CC0633" />
            <Text style={styles.karmaLabel}>Karma Points</Text>
          </View>
          <Text style={styles.karmaValue}>{user.karma}</Text>
          <Text style={styles.karmaSubtext}>Keep helping others to earn more!</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.helpsGiven}</Text>
            <Text style={styles.statLabel}>Helps Given</Text>
            <Ionicons name="hand-left" size={20} color="#CC0633" style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.coffeeRuns}</Text>
            <Text style={styles.statLabel}>Coffee Runs</Text>
            <Ionicons name="cafe" size={20} color="#CC0633" style={styles.statIcon} />
          </View>
        </View>

        {/* Broadcast Preferences */}
        <View style={styles.preferencesSection}>
          <Text style={styles.preferencesTitle}>Broadcast Alerts</Text>
          <Text style={styles.preferencesSubtitle}>Choose which broadcasts you want to receive alerts for</Text>
          
          <View style={styles.preferencesList}>
            {broadcastTypes.map((type) => (
              <View key={type.id} style={styles.preferenceItem}>
                <View style={styles.preferenceLeft}>
                  <View style={[styles.preferenceIconContainer, { backgroundColor: `${type.color}15` }]}>
                    <Ionicons name={type.icon} size={20} color={type.color} />
                  </View>
                  <Text style={styles.preferenceText}>{type.title}</Text>
                </View>
                <Switch
                  value={broadcastPreferences[type.id]}
                  onValueChange={() => toggleBroadcastPreference(type.id)}
                  trackColor={{ false: '#E5E7EB', true: `${type.color}40` }}
                  thumbColor={broadcastPreferences[type.id] ? type.color : '#9CA3AF'}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={20} color="#CC0633" />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#CC0633" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#CC0633',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  major: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  karmaCard: {
    backgroundColor: '#fff6f6',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fdeeee',
    marginBottom: 16,
  },
  karmaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  karmaLabel: { fontSize: 14, fontWeight: '600', color: '#444' },
  karmaValue: { fontSize: 26, fontWeight: '800', color: '#CC0633', marginTop: 8 },
  karmaSubtext: { color: '#666', marginTop: 4 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#f6f6f6', padding: 12, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#2D2D2D' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 6 },
  statIcon: { marginTop: 8 },
  menuSection: { marginTop: 8 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#f3eded', borderRadius: 10, marginTop: 8, backgroundColor: '#fff' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconContainer: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#fff0f1', alignItems: 'center', justifyContent: 'center' },
  menuItemText: { fontSize: 15, color: '#2D2D2D' },
  logoutButton: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fdeeee', backgroundColor: '#fff' },
  logoutText: { color: '#CC0633', fontWeight: '700' },
  versionText: { marginTop: 12, color: '#999', textAlign: 'center' },
  // Broadcast Preferences Styles
  preferencesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  preferencesSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 16,
  },
  preferencesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D2D2D',
  },
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