"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { useAdmin } from './layout';

export default function OverviewPage() {
  const { fetchOpts, handleLogout } = useAdmin();
  const router = useRouter();
  const [stats, setStats] = useState({ totalUsers: 0, totalDrivers: 0, totalRevenue: 0, platformCommission: 0, pendingApprovals: 0, activeBookings: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentDrivers, setRecentDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, bRes, dRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/stats`, fetchOpts()),
          fetch(`${API_URL}/api/admin/bookings?limit=6`, fetchOpts()),
          fetch(`${API_URL}/api/admin/drivers?limit=5&status=pending`, fetchOpts()),
        ]);
        if (sRes.status === 401) return handleLogout();
        if (sRes.ok) setStats(await sRes.json());
        if (bRes.ok) { const d = await bRes.json(); setRecentBookings(d.bookings || []); }
        if (dRes.ok) { const d = await dRes.json(); setRecentDrivers(d.drivers || []); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: 'Total Users',       value: stats.totalUsers,                                      icon: '👤', color: 'text-info',    bg: 'bg-info/10',    href: '/dashboard/users' },
    { label: 'Total Drivers',     value: stats.totalDrivers,                                    icon: '🚚', color: 'text-accent',  bg: 'bg-accent/10',  href: '/dashboard/drivers' },
    { label: 'Total Revenue',     value: `₹${(stats.totalRevenue || 0).toLocaleString()}`,      icon: '💰', color: 'text-accent',  bg: 'bg-accent/10',  href: '/dashboard/analytics' },
    { label: 'Commission (20%)',  value: `₹${(stats.platformCommission || 0).toLocaleString()}`,icon: '📈', color: 'text-warning', bg: 'bg-warning/10', href: '/dashboard/analytics' },
    { label: 'Pending Approvals', value: stats.pendingApprovals,                                icon: '⏳', color: 'text-warning', bg: 'bg-warning/10', href: '/dashboard/drivers?status=pending' },
    { label: 'Active Bookings',   value: stats.activeBookings,                                  icon: '🔄', color: 'text-info',    bg: 'bg-info/10',    href: '/dashboard/bookings' },
  ];

  const statusColor = (s: string) =>
    s === 'completed'   ? 'bg-accent/10 text-accent' :
    s === 'in_progress' ? 'bg-info/10 text-info' :
    s === 'cancelled'   ? 'bg-danger/10 text-danger' :
                          'bg-warning/10 text-warning';

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted text-sm mt-1">Welcome back. Here's what's happening today.</p>
        </div>
        <Link href="/dashboard/live" className="flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent px-4 py-2 rounded-xl text-sm font-bold hover:bg-accent/20 transition-colors">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />Live Monitor
        </Link>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-surfaceHighlight" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STAT_CARDS.map((s, i) => (
            <Link key={i} href={s.href} className="card hover:border-accent/50 transition-all group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center text-xl shrink-0`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`text-3xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Bookings</h2>
            <Link href="/dashboard/bookings" className="text-xs text-accent font-bold hover:underline">View all →</Link>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Vehicle</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b, i) => (
                  <tr key={i} onClick={() => router.push(`/dashboard/bookings?id=${b._id}`)}
                    className="border-b border-border/50 hover:bg-surfaceHighlight transition-colors cursor-pointer">
                    <td className="py-3 px-4 font-mono text-xs text-muted">{b._id?.slice(-8)}</td>
                    <td className="py-3 px-4 font-medium">{b.userId?.fullName || '—'}</td>
                    <td className="py-3 px-4 text-muted">{b.vehicleType || 'N/A'}</td>
                    <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full font-bold ${statusColor(b.status)}`}>{b.status}</span></td>
                    <td className="py-3 px-4 text-right font-bold text-accent">₹{b.price?.total || 0}</td>
                  </tr>
                ))}
                {recentBookings.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">No bookings yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Driver Approvals */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Pending Approvals</h2>
            <Link href="/dashboard/drivers?status=pending" className="text-xs text-accent font-bold hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentDrivers.length === 0 && (
              <div className="card text-center text-muted text-sm py-8">
                <div className="text-3xl mb-3">✅</div>
                All drivers approved
              </div>
            )}
            {recentDrivers.map((d, i) => (
              <div key={i} className="card p-4 hover:border-warning/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center text-warning font-bold shrink-0">
                    {d.fullName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{d.fullName}</p>
                    <p className="text-xs text-muted">{d.phone}</p>
                  </div>
                  <Link href={`/dashboard/drivers/${d._id}`}
                    className="text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-bold hover:bg-accent/90 transition-colors shrink-0">
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
