"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { useAdmin } from '../../layout';

export default function UserDetailPage() {
  const { fetchOpts, handleLogout } = useAdmin();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, fetchOpts());
      if (res.status === 401) return handleLogout();
      if (res.ok) setData(await res.json());
      else router.replace('/dashboard/users');
    } catch { router.replace('/dashboard/users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async (method: string, path: string) => {
    setActionLoading(path);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}${path}`, fetchOpts({ method }));
      if (res.ok) { if (method === 'DELETE') router.push('/dashboard/users'); else load(); }
      else { const d = await res.json(); alert(d.message); }
    } catch { alert('Network error'); }
    finally { setActionLoading(''); }
  };

  if (loading) return (
    <div className="p-8 space-y-6">
      {[...Array(3)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-surfaceHighlight" />)}
    </div>
  );
  if (!data) return null;

  const { user, bookings, stats } = data;
  const rideStatusColor = (s: string) => (({ completed: 'bg-accent/10 text-accent', in_progress: 'bg-info/10 text-info', cancelled: 'bg-danger/10 text-danger', requested: 'bg-warning/10 text-warning', accepted: 'bg-info/10 text-info' } as any)[s] || 'bg-muted/10 text-muted');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Link href="/dashboard/users" className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors w-fit">
        ← Back to Users
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap gap-6 items-start">
          <div className="w-20 h-20 bg-info/15 rounded-2xl flex items-center justify-center text-3xl font-black text-info shrink-0">
            {user.fullName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight">{user.fullName}</h1>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-info/10 text-info">{user.role || 'user'}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Email',     value: user.email || '—' },
                { label: 'Phone',     value: user.phone },
                { label: 'Wallet',    value: `₹${user.walletBalance || 0}` },
                { label: 'Joined',    value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
              ].map((f, i) => (
                <div key={i}>
                  <p className="text-xs text-muted font-bold uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm font-medium mt-1">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { if(confirm('Block user?')) doAction('PUT', '/block'); }} disabled={!!actionLoading}
              className="bg-warning/10 text-warning border border-warning/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-warning/20 transition-colors">
              🚫 Block
            </button>
            <button onClick={() => { if(confirm('Delete permanently?')) doAction('DELETE', ''); }} disabled={!!actionLoading}
              className="bg-danger/10 text-danger border border-danger/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-danger/20 transition-colors">
              🗑 Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Bookings',    value: stats.totalBookings,       color: 'text-foreground' },
          { label: 'Completed',         value: stats.completedBookings,   color: 'text-accent' },
          { label: 'Cancelled',         value: stats.cancelledBookings,   color: 'text-danger' },
          { label: 'Active',            value: stats.activeBookings,      color: 'text-info' },
          { label: 'Total Spent',       value: `₹${(stats.totalSpent||0).toLocaleString()}`, color: 'text-accent' },
          { label: 'Avg. Order Value',  value: `₹${stats.avgBookingValue||0}`, color: 'text-warning' },
        ].map((s, i) => (
          <div key={i} className="card text-center p-4">
            <p className={`text-2xl font-black tracking-tight ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted font-bold uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking History */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold mb-4">Booking History</h2>
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Vehicle</th>
                  <th className="text-left py-3 px-4">Driver</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Payment</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-right py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-surfaceHighlight transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-muted">{b._id?.slice(-8)}</td>
                    <td className="py-3 px-4 text-xs">{b.vehicleType || '—'}</td>
                    <td className="py-3 px-4 text-xs text-muted">{b.driverId?.fullName || '—'}</td>
                    <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full font-bold ${rideStatusColor(b.status)}`}>{b.status}</span></td>
                    <td className="py-3 px-4 text-xs text-muted">{b.paymentMethod || 'Cash'}</td>
                    <td className="py-3 px-4 text-right font-bold text-accent">₹{b.price?.total || 0}</td>
                    <td className="py-3 px-4 text-right text-xs text-muted">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted">No bookings yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted mb-4">Spending Analytics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Total Spent</span>
                <span className="font-bold text-accent">₹{(stats.totalSpent||0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Avg. per booking</span>
                <span className="font-bold text-warning">₹{stats.avgBookingValue||0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Wallet Balance</span>
                <span className="font-bold">₹{user.walletBalance || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Default Payment</span>
                <span className="font-bold text-xs bg-surfaceHighlight px-2 py-1 rounded-lg">{user.defaultPaymentMethod || 'Cash'}</span>
              </div>
            </div>
          </div>

          {user.savedAddresses?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted mb-3">Saved Addresses</h3>
              <div className="space-y-3">
                {user.savedAddresses.map((a: any, i: number) => (
                  <div key={i} className="bg-surfaceHighlight rounded-lg p-3">
                    <p className="text-xs font-bold text-accent mb-1">{a.label}</p>
                    <p className="text-xs text-muted">{a.address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
