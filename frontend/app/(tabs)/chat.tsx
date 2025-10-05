import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: number;
  user: string;
  text: string;
  time: string;
  type: 'coffee' | 'help' | 'study' | 'normal';
  isMe: boolean;
}

// Update this to your backend URL - use your local network IP, not localhost
// You can find this IP in your Expo output (exp://YOUR_IP:8081)
const SOCKET_URL = 'http://172.16.203.31:3000';

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  // TODO: Replace with actual user ID (from auth system)
  const userId = 'user_' + Math.random().toString(36).substr(2, 9);
  
  // TODO: Replace with actual room selection logic
  // Room must match a key from LocationIds enum in backend (e.g., 'SUB', 'LIBRARY', 'DINING_COMMONS')
  const currentRoom = 'SUB'; // Using SUB as an example - this should come from location detection
  const currentRoomDisplay = 'Student Union Building'; // Human-readable name for display
  const [userCount, setUserCount] = useState(0);

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
      
      // Join the room after connection
      socket.emit('joinRoom', userId, currentRoom);
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Chat Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <View style={styles.roomNameRow}>
              <Text style={styles.roomName}>{currentRoomDisplay}</Text>
              <View style={[styles.statusDot, isConnected && styles.statusDotConnected]} />
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
  header: {
    backgroundColor: '#FFF5F7',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
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