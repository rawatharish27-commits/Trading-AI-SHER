
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BrainCircuit, Activity, ShieldCheck } from 'lucide-react-native';

export default function AIPanel({ signal, prob, reasons }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BrainCircuit color="#3b82f6" size={20} />
        <Text style={styles.headerTitle}>NEURAL AUDIT</Text>
      </View>

      <View style={styles.signalRow}>
        <View style={[styles.badge, { backgroundColor: signal === 'BUY' ? '#10b98120' : '#ef444420' }]}>
          <Text style={[styles.badgeText, { color: signal === 'BUY' ? '#10b981' : '#ef4444' }]}>{signal}</Text>
        </View>
        <View style={styles.probBox}>
           <Text style={styles.probLabel}>PROBABILITY</Text>
           <Text style={styles.probValue}>{prob}%</Text>
        </View>
      </View>

      <View style={styles.reasonsList}>
        {reasons.map((r: string, i: number) => (
          <View key={i} style={styles.reasonItem}>
            <Activity color="#3b82f6" size={12} />
            <Text style={styles.reasonText}>{r}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <ShieldCheck color="#10b981" size={14} />
        <Text style={styles.footerText}>Risk Shard: SECURE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#111827', padding: 24, borderRadius: 32, borderWidth: 1, borderColor: '#1f2937' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1f2937', paddingBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  signalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 14, fontWeight: '900' },
  probBox: { alignItems: 'flex-end' },
  probLabel: { color: '#4b5563', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  probValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  reasonsList: { gap: 12, marginBottom: 20 },
  reasonItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reasonText: { color: '#9ca3af', fontSize: 11, fontWeight: '500' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1f2937' },
  footerText: { color: '#10b981', fontSize: 9, fontWeight: '900', letterSpacing: 1 }
});
