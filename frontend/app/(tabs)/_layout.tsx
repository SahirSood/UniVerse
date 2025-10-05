// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MapPin, MessageCircle, Radio, User, Home } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#CC0633',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#FFE0E6',
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#FFE0E6',
        },
        headerTintColor: '#2D2D2D',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Home color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MapPin color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MessageCircle color={color} size={size} />
          ),
          tabBarBadge: 3,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <User color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="location-debug" options={{ title: 'Location' }} />
    </Tabs>
  );
}