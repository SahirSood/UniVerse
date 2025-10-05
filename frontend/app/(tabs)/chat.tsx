import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useUserLocation } from '../../hooks/useUserLocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserId } from '../../hooks/useUserId';

interface Message {
  id: number;
  user: string;
  text: string;
  time: string;
  type: 'coffee' | 'help' | 'study' | 'lost' | 'rideshare' | 'food' | 'normal';
  isMe: boolean;
}

interface LocationData {
  inside: boolean;
  polygon: {
    properties: {
      name?: string;
      Name?: string;
      short: string;
    };
  };
  polygonId: number;
  distance: number;
}

interface LocationInfo {
  id: string;
  name: string;
}

// Location mapping from backend
const LOCATIONS: LocationInfo[] = [
  { id: 'DINING_COMMONS', name: 'Dining Commons' },
  { id: 'WEST_MALL', name: 'West Mall' },
  { id: 'RESIDENCE', name: 'Residence' },
  { id: 'SHRUM_SCIENCE', name: 'Shrum Science' },
  { id: 'STRAND_HALL', name: 'Strand Hall' },
  { id: 'BLUSSON_HALL', name: 'Blusson Hall' },
  { id: 'AQ', name: 'AQ' },
  { id: 'EDUCATION_BUILDING', name: 'Education Building' },
  { id: 'LIBRARY', name: 'Library' },
  { id: 'SUB', name: 'Student Union Building' },
  { id: 'APPLIED_SCIENCE_BUILDING', name: 'Applied Science Building' },
  { id: 'HIGH_STREET', name: 'High Street' },
  { id: 'TECHNOLOGY_AND_SCIENCE_BUILDING', name: 'Technology and Science Building' },
  // Temporary rooms
  { id: 'coffee', name: 'Coffee' },
  { id: 'help', name: 'Help' },
  { id: 'study', name: 'Study' },
  { id: 'lost', name: 'Lost' },
  { id: 'rideshare', name: 'Rideshare' },
  { id: 'food', name: 'Food' },
];

// Update this to your backend URL - use your local network IP, not localhost
// You can find this IP in your Expo output (exp://YOUR_IP:8081)
const SOCKET_URL = 'http://172.16.203.31:3000';
const API_URL = 'http://172.16.203.31:3000';

export default function ChatScreen() {
  const [view, setView] = useState<'lobby' | 'chat'>('lobby');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Location and room state
  // Real-time tracking: update every 5 meters or 1 second
  const { status, coords, error: locationError, start, stop } = useUserLocation({
    distanceInterval: 5,
    timeInterval: 1000,
  });
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentRoomDisplay, setCurrentRoomDisplay] = useState<string>('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  
  // TODO: Replace with actual user ID (from auth system)
  const { userId, loading } = useUserId();

  // Start location tracking
  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const fetchCurrentLocation = async () => {
    if (!coords) {
      Alert.alert('Location Required', 'Please enable location services to use this feature');
      return;
    }

    setIsLoadingLocation(true);
    try {
      const response = await fetch(`${API_URL}/locations?lat=${coords.latitude}&lon=${coords.longitude}`);
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }
      const data: LocationData = await response.json();
      
      // Extract room ID from the polygon properties
      const roomId = data.polygon.properties.short;
      const roomName = data.polygon.properties.name || data.polygon.properties.Name || roomId;
      
      console.log('Current location:', roomName, '(Room ID:', roomId, ')');
      console.log('Distance:', data.distance, 'km, Inside:', data.inside);
      
      // Join this room
      joinRoom(roomId, roomName);
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Location Error', 'Failed to determine your current location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const joinRoom = (roomId: string, roomName: string) => {
    // Leave old room if connected and in a different room
    if (currentRoom && currentRoom !== roomId && socketRef.current && isConnected) {
      console.log('Leaving old room:', currentRoom);
      socketRef.current.emit('leaveRoom', userId, currentRoom);
    }
    
    // Update room state
    setCurrentRoom(roomId);
    setCurrentRoomDisplay(roomName);
    
    // Clear old messages when switching rooms
    if (currentRoom !== roomId) {
      setMessages([]);
    }
    
    // Join new room if connected
    if (socketRef.current && isConnected) {
      console.log('Joining room:', roomId);
      socketRef.current.emit('joinRoom', userId, roomId);
    }
    
    // Switch to chat view
    setView('chat');
  };

  const handleLocationSelect = (location: LocationInfo) => {
    joinRoom(location.id, location.name);
  };

  const handleBackToLobby = () => {
    // Leave current room
    if (currentRoom && socketRef.current && isConnected) {
      console.log('Leaving room:', currentRoom);
      socketRef.current.emit('leaveRoom', userId, currentRoom);
    }
    setCurrentRoom(null);
    setCurrentRoomDisplay('');
    setView('lobby');
  };

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      setIsConnected(true);
      
      // Rejoin the room after reconnection (only if room is determined)
      if (currentRoom) {
        console.log('Reconnected - joining room:', currentRoom);
        socket.emit('joinRoom', userId, currentRoom);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to chat server');
    });

    // Room event handlers
    socket.on('joinedRoom', (data) => {
      console.log('Joined room:', data.room);
    });

    socket.on('leftRoom', (data) => {
      console.log('Left room:', data.room);
    });

    // Message event handlers
    socket.on('recieveMessage', (receivedMessage) => {
      console.log('Received message:', receivedMessage);
      
      // Add received message to state
      const newMessage: Message = {
        id: Date.now(),
        user: receivedMessage.user || 'Anonymous',
        text: receivedMessage.text || receivedMessage,
        time: 'Just now',
        type: receivedMessage.type || 'normal',
        isMe: false,
      };
      
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const sendMessage = () => {
    if (!currentRoom) {
      Alert.alert('No Room', 'Please select a room first');
      return;
    }
    
    if (message.trim() && socketRef.current && isConnected) {
      const messageData = {
        user: 'You',
        text: message,
        time: 'Just now',
        type: 'normal',
      };
      
      // Emit message to server
      socketRef.current.emit('sendMessage', userId, currentRoom, messageData);
      
      // Add message to local state immediately
      const newMessage: Message = {
        id: Date.now(),
        user: 'You',
        text: message,
        time: 'Just now',
        type: 'normal',
        isMe: true,
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    } else if (!isConnected) {
      Alert.alert('Not Connected', 'Please wait while we connect to the server');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.isMe && styles.myMessage]}>
      <View style={styles.messageHeader}>
        <Text style={styles.messageUser}>{item.user}</Text>
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
      <Text style={styles.messageText}>{item.text}</Text>
      {item.type === 'coffee' && !item.isMe && (
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Join Coffee Run</Text>
        </TouchableOpacity>
      )}
      {item.type === 'help' && !item.isMe && (
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Offer Help</Text>
        </TouchableOpacity>
      )}
      {item.type === 'study' && !item.isMe && (
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Join Study Group</Text>
        </TouchableOpacity>
      )}
      {item.type === 'lost' && !item.isMe && (
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Help Navigate</Text>
        </TouchableOpacity>
      )}
      {item.type === 'rideshare' && !item.isMe && (
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Join Ride</Text>
        </TouchableOpacity>
      )}
      {item.type === 'food' && !item.isMe && (
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Get Food Info</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLocationButton = ({ item }: { item: LocationInfo }) => (
    <TouchableOpacity
      style={styles.locationButton}
      onPress={() => handleLocationSelect(item)}
    >
      <Ionicons name="location" size={24} color="#CC0633" />
      <Text style={styles.locationButtonText}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (view === 'lobby') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.lobbyContainer}>
          {/* Header */}
          <View style={styles.lobbyHeader}>
            <Text style={styles.lobbyTitle}>Select a Room</Text>
            <Text style={styles.lobbySubtitle}>Choose a location to start chatting</Text>
          </View>

          {/* Current Location Button */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={fetchCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="navigate" size={28} color="#FFFFFF" />
                <Text style={styles.currentLocationButtonText}>Current Location</Text>
                <Text style={styles.currentLocationButtonSubtext}>
                  Find nearest room based on your location
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Location Grid */}
          <FlatList
            data={LOCATIONS}
            renderItem={renderLocationButton}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.locationRow}
            contentContainerStyle={styles.locationGrid}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToLobby}>
          <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View>
            <View style={styles.roomNameRow}>
              <Text style={styles.roomName}>{currentRoomDisplay}</Text>
              <View style={[styles.statusDot, isConnected && currentRoom && styles.statusDotConnected]} />
            </View>
            <View style={styles.userCountRow}>
              <Ionicons name="people" size={12} color="#666" />
              <Text style={styles.userCountText}>
                {isConnected ? `${userCount} people nearby` : 'Connecting...'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#2D2D2D" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Send a message..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  lobbyContainer: {
    flex: 1,
    padding: 16,
  },
  lobbyHeader: {
    marginBottom: 24,
  },
  lobbyTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  lobbySubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  currentLocationButton: {
    backgroundColor: '#CC0633',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 120,
    justifyContent: 'center',
  },
  currentLocationButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  currentLocationButtonSubtext: {
    fontSize: 13,
    color: '#FFE0E6',
    marginTop: 4,
    textAlign: 'center',
  },
  locationGrid: {
    paddingBottom: 16,
  },
  locationRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#FFE0E6',
    minHeight: 100,
    justifyContent: 'center',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#FFF5F7',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  statusDotConnected: {
    backgroundColor: '#10B981',
  },
  userCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userCountText: {
    fontSize: 12,
    color: '#666666',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  myMessage: {
    backgroundColor: '#FFF5F7',
    alignSelf: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageUser: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  messageText: {
    fontSize: 14,
    color: '#2D2D2D',
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#CC0633',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFE0E6',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#FFE0E6',
  },
  sendButton: {
    backgroundColor: '#CC0633',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});