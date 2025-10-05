import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

export default function RoomJoinModal({ visible, room, onClose, onJoin }: any) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>{room?.name}</Text>
            <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
          </View>

          <Text style={{ color: '#666', marginTop: 8 }}>{room?.users} students nearby</Text>

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <TouchableOpacity onPress={onClose} style={styles.btnAlt}><Text>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={onJoin} style={styles.btnPrimary}><Text style={{ color: '#fff' }}>Join & Chat</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  btnAlt: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', alignItems: 'center', marginRight: 8 },
  btnPrimary: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#B71C1C', alignItems: 'center' },
});
