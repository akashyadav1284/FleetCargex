"use client";
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { API_URL } from '@/lib/config';
import { useAdmin } from '../layout';

// Lazy-load the heavy Recharts bundle — excluded from initial JS payload
const AnalyticsCharts = dynamic(() => import('@/components/AnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-80 animate-pulse bg-surfaceHighlight" />)}
    </div>
  ),
});

export default function AnalyticsPage() {
  const { fetchOpts, handleLogout } = useAdmin();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/analytics?period=${period}`, fetchOpts());
        if (res.status === 401) return handleLogout();
        if (res.ok) setData(await res.json());
      } catch (e) { console.error('Failed to load analytics', e); }
      finally { setLoading(false); }
    };
    loadData();
  }, [period]);

  // Memoize top drivers list to prevent unnecessary re-renders
  const topDriversList = useMemo(() => {
    if (!data?.topDrivers) return [];
    return data.topDrivers;
  }, [data?.topDrivers]);

  if (loading) return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center"><div className="w-48 h-8 bg-surfaceHighlight rounded animate-pulse" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-80 animate-pulse bg-surfaceHighlight" />)}
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted text-sm mt-1">Platform performance insights</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className="bg-surface border border-border rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-accent shadow-sm">
          <option value="daily">Last 30 Days</option>
          <option value="weekly">Last 12 Weeks</option>
          <option value="monthly">Last 12 Months</option>
        </select>
      </div>

      {/* Dynamically loaded charts — code-split away from the main bundle */}
      <AnalyticsCharts data={data} period={period} />

      {/* Top Earnings Leaderboard */}
      <div className="card space-y-4">
        <h2 className="font-bold text-lg">Top Earning Drivers</h2>
        <div className="space-y-3">
          {topDriversList.map((d: any, i: number) => (
            <div key={i} className="flex items-center gap-4 bg-surfaceHighlight p-3 rounded-xl border border-border/50">
              <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-sm shrink-0">#{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{d.fullName}</p>
                <p className="text-xs text-muted mt-0.5">{d.completedRides} Rides • ⭐ {d.ratings?.averageRating?.toFixed(1) || 0}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-accent">₹{(d.earnings?.totalEarnings || 0).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {topDriversList.length === 0 && <p className="text-sm text-center text-muted py-8">No data available</p>}
        </div>
      </div>
    </div>
  );
}
