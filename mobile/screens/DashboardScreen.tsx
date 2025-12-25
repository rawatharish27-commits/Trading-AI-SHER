
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator 
} from 'react-native';
import { Zap, TrendingUp, Shield, Activity, Bell, ChevronRight, Brain } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [ltp, setLtp] = useState(2480.50);
  const [signal, setSignal] = useState({ symbol: 'RELIANCE', prob: 64, side: 'BUY' });

  useEffect(() => {
    const inv = setInterval(() => {
      setLtp(prev => prev + (Math.random() - 0.5) * 2);
    }, 1000);
    return () => clearInterval(inv);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>SHER<Text style={{ color: '#3b82f6' }}>.AI</Text></Text>
          <Text style={styles.subBrand}>PRO QUANT NODE</Text>
        </View>
        <TouchableOpacity style={styles.alertBtn}>
          <Bell color="#9ca3af" size={20} />
          <View style={styles.alertBadge} />
        </TouchableOpacity>
      </View>

      {/* Hero PnL */}
      <View style={styles.pnlCard}>
        <Text style={styles.label}>SESSION NET ALPHA</Text>
        <Text style={styles.pnlValue}>+₹12,450.00</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Activity color="#3b82f6" size={12} />
            <Text style={styles.statText}>Latency: 42ms</Text>
          </View>
          <View style={styles.statItem}>
            <Shield color="#10b981" size={12} />
            <Text style={styles.statText}>Risk: SECURE</Text>
          </View>
        </View>
      </View>

      {/* Active Signal Card */}
      <Text style={styles.sectionTitle}>NEURAL DISCOVERY</Text>
      <View style={styles.signalCard}>
        <View style={styles.signalHeader}>
          <View style={styles.symbolInfo}>
            <View style={styles.actionBadge}>
              <Text style={styles.actionText}>{signal.side}</Text>
            </View>
            <Text style={styles.symbolName}>{signal.symbol}</Text>
          </View>
          <Text style={styles.ltpText}>₹{ltp.toFixed(2)}</Text>
        </View>
        
        <View style={styles.probContainer}>
          <View style={styles.probHeader}>
            <Text style={styles.probLabel}>ENSEMBLE PROBABILITY</Text>
            <Text style={styles.probValue}>{signal.prob}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${signal.prob}%` }]} />
          </View>
        </View>

        <TouchableOpacity style={styles.deployBtn}>
          <Zap color="#000" size={16} fill="#000" />
          <Text style={styles.deployText}>DEPLOY ALPHA NODE</Text>
        </TouchableOpacity>
      </View>

      {/* Intelligence Feed */}
      <Text style={styles.sectionTitle}>SYSTEM TELEMETRY</Text>
      {[
        "Neural Link synchronized with NSE core.",
        "Discovery: SBIN accumulating @ 615.",
        "Global Kill-Switch Status: STANDBY."
      ].map((log, i) => (
        <View key={i} style={styles.logItem}>
          <View style={styles.logBullet} />
          <Text style={styles.logText}>{log}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e1117', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  brand: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  subBrand: { color: '#4b5563', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  alertBtn: { width: 44, height: 44, backgroundColor: '#1f2937', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  alertBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4, borderWidth: 2, borderColor: '#0e1117' },
  pnlCard: { backgroundColor: '#111827', padding: 24, borderRadius: 28, borderWidth: 1, borderColor: '#1f2937', marginBottom: 24 },
  label: { color: '#9ca3af', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  pnlValue: { color: '#10b981', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#6b7280', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { color: '#4b5563', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 16, marginTop: 12 },
  signalCard: { backgroundColor: '#111827', borderRadius: 28, padding: 24, borderWidth: 2, borderColor: '#3b82f620' },
  signalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  symbolInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionBadge: { backgroundColor: '#10b98120', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  actionText: { color: '#10b981', fontSize: 10, fontWeight: '900' },
  symbolName: { color: '#fff', fontSize: 20, fontWeight: '900' },
  ltpText: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  probContainer: { marginBottom: 24 },
  probHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  probLabel: { color: '#9ca3af', fontSize: 9, fontWeight: '900' },
  probValue: { color: '#3b82f6', fontSize: 12, fontWeight: '900' },
  progressBar: { height: 4, backgroundColor: '#1f2937', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6' },
  deployBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  deployText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  logItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingLeft: 8 },
  logBullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3b82f6' },
  logText: { color: '#9ca3af', fontSize: 11, fontWeight: '500' }
});
