import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';

interface Signal {
  id: string;
  symbol: string;
  probability: number;
  confidence: string;
  evidenceList: string[];
}

interface SignalsProps {
  data: Signal[];
}

export default function Signals({ data }: SignalsProps) {
  const renderItem = ({ item }: { item: Signal }) => (
    <View style={styles.card}>
      <Text style={styles.symbol}>{item.symbol}</Text>
      <Text style={styles.label}>Probability: {item.probability}%</Text>
      <Text style={styles.label}>Confidence: {item.confidence}</Text>
      <Text style={styles.label}>Evidence: {item.evidenceList.length} factors</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  symbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 4,
  },
});
