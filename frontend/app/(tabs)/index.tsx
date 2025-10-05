import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';

export default function HomeScreen() {
  const handleEnter = () => {
    // Navigate to the map tab
    router.push('/(tabs)/map');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Welcome to CampusCircle
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Connect with your campus community
        </ThemedText>
        
        <TouchableOpacity style={styles.enterButton} onPress={handleEnter}>
          <ThemedText style={styles.buttonText}>Enter</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#2D2D2D',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 48,
    color: '#6B7280',
  },
  enterButton: {
    backgroundColor: '#CC0633',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
