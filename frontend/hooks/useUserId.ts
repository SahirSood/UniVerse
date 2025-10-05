import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const initializeUserId = async () => {
      try {
        let storedUserId = await AsyncStorage.getItem('userId');
        
        if (!storedUserId) {
          storedUserId = 'user_' + Math.random().toString(36).substr(2, 9);
          await AsyncStorage.setItem('userId', storedUserId);
        }
        
        setUserId(storedUserId);
      } catch (error) {
        console.error('Error with userId:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeUserId();
  }, []);

  return { userId, loading };
};