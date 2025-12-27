"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "./MetricCard";
import { RevenueChart } from "./components/RevenueChart";
import { SystemHealth } from "./components/SystemHealth";
import { AccuracyChart } from "./components/AccuracyChart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <p>Loading admin dashboard...</p>;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px', color: '#2563eb' }}>
        Admin Dashboard
      </h1>

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
        <MetricCard title="Users" value={data.metrics.totalUsers} />
        <MetricCard title="Signals" value={data.metrics.totalSignals} />
        <MetricCard title="System Health" value={data.metrics.systemHealth} />
        <MetricCard title="Revenue (₹)" value={`₹${data.revenue.toLocaleString()}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '24px', background: '#fff' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#333' }}>
            Signal Accuracy (7 Days)
          </h3>
          <AccuracyChart data={data.accuracyHistory || [
            { date: 'Mon', accuracy: 68 },
            { date: 'Tue', accuracy: 71 },
            { date: 'Wed', accuracy: 74 },
            { date: 'Thu', accuracy: 77 },
            { date: 'Fri', accuracy: 81 },
            { date: 'Sat', accuracy: 78 },
            { date: 'Sun', accuracy: 76 }
          ]} />
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '24px', background: '#fff' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#333' }}>
            Weekly Revenue (₹)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={[
              { name: 'Mon', revenue: 12000 },
              { name: 'Tue', revenue: 15000 },
              { name: 'Wed', revenue: 18000 },
              { name: 'Thu', revenue: 16500 },
              { name: 'Fri', revenue: 22000 },
              { name: 'Sat', revenue: 19000 },
              { name: 'Sun', revenue: 14000 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <RevenueChart revenue={data.revenue} />
        <SystemHealth status={data.metrics.systemHealth} />
      </div>
    </div>
  );
}
