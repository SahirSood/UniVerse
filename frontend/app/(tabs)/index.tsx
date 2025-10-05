import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    'food-delivery': false,
  };

  // Example incoming broadcasts
  const allIncoming: Broadcast[] = [
    { id: 'b1', type: 'coffee', title: 'Coffee Run', message: 'Grabbing iced lattes. Want one?', from: 'Sarah M.', time: '2m', location: 'Tim Hortons - Main' },
    { id: 'b2', type: 'help', title: 'Need Calculator', message: 'Forgot calculator for MATH 101', from: 'Mike T.', time: '5m', location: 'Library 2F' },
    { id: 'b3', type: 'study', title: 'Finals Study Group', message: 'CS201 study in 10 mins', from: 'Emma L.', time: '8m', location: 'Student Center' },
    { id: 'b4', type: 'lost-found', title: 'Lost Water Bottle', message: 'Blue Hydroflask near gym', from: 'Alex P.', time: '12m', location: 'Gym Entrance' },
  ];

  const [incoming, setIncoming] = useState<Broadcast[]>(allIncoming);
  const [commitments, setCommitments] = useState<Broadcast[]>([
    // Example pre-committed item
    { id: 'c1', type: 'help', title: 'Lab Partner', message: 'Helping with lab wiring', from: 'You', time: 'Today', location: 'ENG Building' },
  ]);

  const filteredIncoming = useMemo(
    () => incoming.filter(b => preferences[b.type]),
    [incoming]
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
    const meta = typeMeta[b.type];
    return (
      <View style={styles.card}>
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
});