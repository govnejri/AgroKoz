import React, { useEffect } from 'react';
import { StatusBar, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import DatabaseService from './src/services/DatabaseService';
import MLService from './src/services/MLService';

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Инициализация базы данных
      await DatabaseService.init();
      console.log('Database initialized');

      // Инициализация ML сервиса
      await MLService.init();
      console.log('ML Service initialized');
    } catch (error) {
      console.error('App initialization error:', error);
      Alert.alert(
        'Ошибка инициализации',
        'Не удалось запустить приложение. Попробуйте перезапустить.'
      );
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
