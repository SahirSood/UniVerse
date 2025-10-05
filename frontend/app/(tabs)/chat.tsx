import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: number;
  user: string;
  text: string;
  time: string;
  type: 'coffee' | 'help' | 'study' | 'normal';
  isMe: boolean;
}

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, user: 'Sarah M.', text: 'Anyone grabbing coffee? I\'ll take an iced latte!', time: '2m ago', type: 'coffee', isMe: false },
    { id: 2, user: 'Mike T.', text: 'Need a calculator for MATH 101 exam!', time: '5m ago', type: 'help', isMe: false },
    { id: 3, user: 'You', text: 'I can bring you one, where are you?', time: '4m ago', type: 'normal', isMe: true },
    { id: 4, user: 'Emma L.', text: 'Study group forming for finals in 10 mins!', time: '8m ago', type: 'study', isMe: false },
  ]);

  const currentRoom = 'Tim Hortons - Main Floor';
  const userCount = 12;

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        user: 'You',
        text: message,
        time: 'Just now',
        type: 'normal',
        isMe: true,
      };
      setMessages([...messages, newMessage]);
      setMessage('');
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
            <Text style={styles.roomName}>{currentRoom}</Text>
            <View style={styles.userCountRow}>
              <Ionicons name="people" size={12} color="#666" />
              <Text style={styles.userCountText}>{userCount} people nearby</Text>
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
  roomName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
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