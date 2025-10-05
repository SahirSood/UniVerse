import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type BroadcastType = 'coffee' | 'help' | 'study' | 'lost-found' | 'rideshare' | 'food-delivery';

export default function ProfileScreen() {
  const user = { name: 'John Doe', major: 'Computer Science Major', karma: 247, helpsGiven: 42, coffeeRuns: 18 };

  const [broadcastPreferences, setBroadcastPreferences] = useState<Record<BroadcastType, boolean>>({
    'coffee': true, 'help': true, 'study': true, 'lost-found': true, 'rideshare': false, 'food-delivery': false,
  });

  const broadcastTypes: { id: BroadcastType; title: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { id: 'coffee', title: 'Coffee Runs', icon: 'cafe', color: '#CC0633' },
    { id: 'help', title: 'Help Requests', icon: 'help-circle', color: '#CC0633' },
    { id: 'study', title: 'Study Groups', icon: 'book', color: '#CC0633' },
    { id: 'lost-found', title: 'Lost & Found', icon: 'search', color: '#CC0633' },
    { id: 'rideshare', title: 'Ride Sharing', icon: 'car', color: '#3B82F6' },
    { id: 'food-delivery', title: 'Food Delivery', icon: 'restaurant', color: '#10B981' },
  ];

  const toggle = (id: BroadcastType) => setBroadcastPreferences(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}><Text style={styles.avatarText}>JD</Text></View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.major}>{user.major}</Text>
        </View>

        <View style={styles.karmaCard}>
          <View style={styles.karmaHeader}>
            <Ionicons name="star" size={24} color="#CC0633" />
            <Text style={styles.karmaLabel}>Karma Points</Text>
          </View>
          <Text style={styles.karmaValue}>{user.karma}</Text>
          <Text style={styles.karmaSubtext}>Keep helping others to earn more!</Text>
        </View>

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

        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Broadcast Preferences</Text>
          <View style={styles.prefGrid}>
            {broadcastTypes.map(bt => {
              const enabled = broadcastPreferences[bt.id];
              return (
                <View key={bt.id} style={[styles.prefItem, enabled && styles.prefItemActive]}>
                  <View style={[styles.prefIconWrap, { backgroundColor: `${bt.color}14` }]}>
                    <Ionicons name={bt.icon} size={18} color={bt.color} />
                  </View>
                  <Text style={styles.prefTitle}>{bt.title}</Text>
                  <Ionicons
                    name={enabled ? 'toggle' : 'toggle-outline'}
                    size={28}
                    color={enabled ? '#10B981' : '#9CA3AF'}
                    onPress={() => toggle(bt.id)}
                    style={{ marginLeft: 'auto' }}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 16, paddingTop: 4 },
  avatarContainer: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#CC0633', marginBottom: 8 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 28 },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  major: { fontSize: 13, color: '#6B7280' },

  karmaCard: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F3D5DC', backgroundColor: '#FFF5F7', padding: 14 },
  karmaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  karmaLabel: { fontWeight: '700', color: '#1F2937' },
  karmaValue: { fontSize: 28, fontWeight: '800', color: '#CC0633' },
  karmaSubtext: { color: '#6B7280', marginTop: 2, fontSize: 12 },

  statsGrid: { flexDirection: 'row', gap: 12, marginTop: 12 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', padding: 12, position: 'relative', overflow: 'hidden' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  statIcon: { position: 'absolute', right: 10, bottom: 10 },

  preferencesSection: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  prefGrid: { gap: 10 },
  prefItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 12 },
  prefItemActive: { borderColor: '#CC0633', backgroundColor: '#FFF5F7' },
  prefIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  prefTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
});