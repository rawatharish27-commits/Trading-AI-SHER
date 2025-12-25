
import React from 'react';
import { View, StatusBar, SafeAreaView } from 'react-native';
import DashboardScreen from './screens/DashboardScreen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0e1117' }}>
      <StatusBar barStyle="light-content" />
      <DashboardScreen />
    </SafeAreaView>
  );
}
