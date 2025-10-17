import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CameraScreen from '../screens/CameraScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          headerShown: false,
          title: 'Камера',
          tabBarIcon: ({ color }) => (
            <TabIcon icon="📷" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerShown: false,
          title: 'История',
          tabBarIcon: ({ color }) => (
            <TabIcon icon="📋" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          headerShown: false,
          title: 'Аналитика',
          tabBarIcon: ({ color }) => (
            <TabIcon icon="📊" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            title: 'Результат анализа',
            headerStyle: { backgroundColor: '#22c55e' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Простой компонент иконки для табов
const TabIcon: React.FC<{ icon: string; color: string }> = ({ icon }) => {
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
};

export default AppNavigator;
