import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useUserId } from '../../hooks/useUserId';

type BroadcastType = 'coffee' | 'help' | 'study' | 'lost-found' | 'rideshare' | 'food-delivery';

interface QuickAction {
  id: BroadcastType;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const SOCKET_URL = 'http://172.16.203.31:3000';

export default function BroadcastScreen() {
  const [customMessage, setCustomMessage] = useState('');
  const [selectedType, setSelectedType] = useState<BroadcastType | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { userId, loading } = useUserId();
  const [isSocketConnected, setIsSocketConnected] = useState(false);

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
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const quickActions: QuickAction[] = [
    { id: 'coffee', title: 'Coffee Run', icon: 'cafe', color: '#403838ff' },
    { id: 'help', title: 'Need Help', icon: 'help-circle', color: '#CC0633' },
    { id: 'study', title: 'Study Buddy', icon: 'book', color: '#5d00ffff' },
    { id: 'lost-found', title: 'Lost & Found', icon: 'search', color: '#ffa200ff' },
    { id: 'rideshare', title: 'Ride Share', icon: 'car', color: '#3B82F6' },
    { id: 'food-delivery', title: 'Food Delivery', icon: 'restaurant', color: '#10B981' },
  ];

  const handleQuickAction = (type: BroadcastType) => {
    setSelectedType(type);
    // Pre-fill message based on type
    switch (type) {
      case 'coffee':
        setCustomMessage('Heading to Tim Hortons! Anyone want anything?');
        break;
      case 'help':
        setCustomMessage('Need help with ');
        break;
      case 'study':
        setCustomMessage('Looking for a study buddy for ');
        break;
      case 'lost-found':
        setCustomMessage('Lost my ');
        break;
      case 'rideshare':
        setCustomMessage('Looking for a ride to ');
        break;
      case 'food-delivery':
        setCustomMessage('Ordering food from ');
        break;
    }
  };

  const handleBroadcast = () => {
    if (customMessage.trim() && selectedType && socketRef.current && userId && isSocketConnected) {
      const broadcastData = {
        id: Date.now().toString(),
        type: selectedType,
        title: quickActions.find(action => action.id === selectedType)?.title || 'Broadcast',
        message: customMessage,
        from: 'You', // In a real app, this would be the user's name
        time: 'now',
        timestamp: Date.now()
      };

      // Send broadcast to the specific room (e.g., 'coffee' room)
      socketRef.current.emit('sendMessage', userId, selectedType, broadcastData);
      
      Alert.alert(
        'Message Sent!',
        `Your ${selectedType} broadcast has been sent to all users with this preference enabled.`,
        [{ text: 'OK', onPress: () => {
          setCustomMessage('');
          setSelectedType(null);
        }}]
      );
    } else if (!isSocketConnected) {
      Alert.alert('Connection Error', 'Please check your internet connection and try again.');
    } else if (!selectedType) {
      Alert.alert('Select Type', 'Please select a broadcast type first.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Broadcast</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isSocketConnected ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {isSocketConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.quickActionCard,
                  selectedType === action.id && styles.quickActionCardSelected,
                ]}
                onPress={() => handleQuickAction(action.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Message</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Type your broadcast message..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            value={customMessage}
            onChangeText={setCustomMessage}
            textAlignVertical="top"
          />
        </View>

        {/* Broadcast Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#CC0633" />
          <Text style={styles.infoText}>
            Messages expire after 15 minutes and are only visible to nearby users
          </Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.broadcastButton, (!customMessage.trim() || !selectedType || !isSocketConnected) && styles.broadcastButtonDisabled]}
          onPress={handleBroadcast}
          disabled={!customMessage.trim() || !selectedType || !isSocketConnected}
        >
          <Ionicons name="radio" size={20} color="#FFFFFF" />
          <Text style={styles.broadcastButtonText}>
            {selectedType ? `Broadcast ${quickActions.find(a => a.id === selectedType)?.title}` : 'Select Type to Broadcast'}
          </Text>
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFF5F7',
    borderWidth: 2,
    borderColor: '#FFE0E6',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  quickActionCardSelected: {
    backgroundColor: '#FFE0E6',
    borderColor: '#CC0633',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#FFE0E6',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#2D2D2D',
    minHeight: 120,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666666',
  },
  broadcastButton: {
    backgroundColor: '#CC0633',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  broadcastButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  broadcastButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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