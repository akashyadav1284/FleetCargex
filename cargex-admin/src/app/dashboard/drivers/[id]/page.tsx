"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { useAdmin } from '@/context/AdminContext';

export default function DriverDetailPage() {
  const { fetchOpts, handleLogout } = useAdmin();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [activeTab, setActiveTab] = useState<'rides' | 'docs' | 'vehicle'>('rides');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/drivers/${id}`, fetchOpts());
      if (res.status === 401) return handleLogout();
      if (res.ok) setData(await res.json());
      else router.replace('/dashboard/drivers');
    } catch { router.replace('/dashboard/drivers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async (path: string, method: string, body?: any) => {
    setActionLoading(path);
    try {
      const res = await fetch(`${API_URL}/api/admin/drivers/${id}${path}`, fetchOpts({ method, ...(body ? { body: JSON.stringify(body) } : {}) }));
      if (res.ok) load();
      else { const d = await res.json(); alert(d.message); }
    } catch { alert('Network error'); }
    finally { setActionLoading(''); }
  };

  if (loading) return (
    <div className="p-8 space-y-6">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-surfaceHighlight" />)}
    </div>
  );
  if (!data) return null;

  const { driver, rides, stats } = data;
  const dStatus = driver.status || (driver.isApproved ? 'approved' : 'pending');
  const statusColor = ({ approved: 'text-accent bg-accent/10', blocked: 'text-danger bg-danger/10', rejected: 'text-muted bg-muted/10', pending: 'text-warning bg-warning/10' } as any)[dStatus] || 'text-warning bg-warning/10';
  const rideStatusColor = (s: string) => (({ completed: 'bg-accent/10 text-accent', in_progress: 'bg-info/10 text-info', cancelled: 'bg-danger/10 text-danger', accepted: 'bg-info/10 text-info', requested: 'bg-warning/10 text-warning' } as any)[s] || 'bg-muted/10 text-muted');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Link href="/dashboard/drivers" className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors w-fit">
        ← Back to Drivers
      </Link>

      {/* Header Card */}
      <div className="card">
        <div className="flex flex-wrap gap-6 items-start">
          <div className="w-20 h-20 bg-accent/15 rounded-2xl flex items-center justify-center text-3xl font-black text-accent shrink-0">
            {driver.fullName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight">{driver.fullName}</h1>
              <span className={`text-xs px-3 py-1 rounded-full font-bold capitalize ${statusColor}`}>{dStatus}</span>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${driver.isOnline ? 'bg-accent/10 text-accent' : 'bg-muted/10 text-muted'}`}>
                {driver.isOnline ? '● Online' : '○ Offline'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Email', value: driver.email || '—' },
                { label: 'Phone', value: driver.phone },
                { label: 'City', value: driver.city || '—' },
                { label: 'Joined', value: driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : '—' },
              ].map((f, i) => (
                <div key={i}>
                  <p className="text-xs text-muted font-bold uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm font-medium mt-1">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {dStatus !== 'approved' && dStatus !== 'blocked' &&
              <button onClick={() => doAction('/approve', 'PUT', { status: 'approved' })} disabled={!!actionLoading}
                className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors">
                {actionLoading === '/approve' ? '...' : '✓ Approve'}
              </button>}
            {dStatus === 'approved' &&
              <button onClick={() => doAction('/approve', 'PUT', { status: 'rejected' })} disabled={!!actionLoading}
                className="bg-warning/10 text-warning border border-warning/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-warning/20 transition-colors">
                Revoke
              </button>}
            {dStatus !== 'blocked'
              ? <button onClick={() => { if(confirm('Block this driver?')) doAction('/block', 'PUT'); }} disabled={!!actionLoading}
                  className="bg-danger/10 text-danger border border-danger/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-danger/20 transition-colors">
                  🚫 Block
                </button>
              : <button onClick={() => doAction('/unblock', 'PUT')} disabled={!!actionLoading}
                  className="bg-accent/10 text-accent border border-accent/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-accent/20 transition-colors">
                  Unblock
                </button>}
            <button onClick={async () => { if(confirm('Delete permanently?')) { await doAction('', 'DELETE'); router.push('/dashboard/drivers'); }}} disabled={!!actionLoading}
              className="bg-danger/10 text-danger border border-danger/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-danger/20 transition-colors">
              🗑 Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Rides',     value: stats.totalRides,      color: 'text-foreground' },
          { label: 'Completed',       value: stats.completedRides,  color: 'text-accent' },
          { label: 'Cancelled',       value: stats.cancelledRides,  color: 'text-danger' },
          { label: 'Active',          value: stats.activeRides,     color: 'text-info' },
          { label: 'Total Earnings',  value: `₹${(stats.totalEarnings||0).toLocaleString()}`, color: 'text-accent' },
          { label: 'Acceptance Rate', value: `${stats.acceptanceRate}%`, color: stats.acceptanceRate >= 70 ? 'text-accent' : 'text-warning' },
        ].map((s, i) => (
          <div key={i} className="card text-center p-4">
            <p className={`text-2xl font-black tracking-tight ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted font-bold uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-1 bg-surfaceHighlight p-1 rounded-xl w-fit">
            {(['rides', 'vehicle', 'docs'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === t ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}>
                {t === 'rides' ? '🗂 Rides' : t === 'vehicle' ? '🚛 Vehicle' : '📄 Docs'}
              </button>
            ))}
          </div>

          {activeTab === 'rides' && (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Earnings</th>
                    <th className="text-right py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((r: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-surfaceHighlight transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-muted">{r._id?.slice(-8)}</td>
                      <td className="py-3 px-4 text-xs">{r.userId?.fullName || '—'}</td>
                      <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full font-bold ${rideStatusColor(r.status)}`}>{r.status}</span></td>
                      <td className="py-3 px-4 text-right font-bold text-accent">₹{r.price?.total || 0}</td>
                      <td className="py-3 px-4 text-right text-xs text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                  {rides.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">No ride history</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="card space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted">Vehicle Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Type', value: driver.vehicleDetails?.type },
                  { label: 'Model', value: driver.vehicleDetails?.model },
                  { label: 'Number Plate', value: driver.vehicleDetails?.numberPlate },
                  { label: 'Capacity', value: driver.vehicleDetails?.capacity ? `${driver.vehicleDetails.capacity} kg` : null },
                  { label: 'Fuel Type', value: driver.vehicleDetails?.fuelType },
                  { label: 'Vehicle Name', value: driver.vehicleDetails?.name },
                ].map((f, i) => (
                  <div key={i} className="bg-surfaceHighlight rounded-xl p-4">
                    <p className="text-xs text-muted font-bold uppercase tracking-wider mb-1">{f.label}</p>
                    <p className="font-bold text-sm">{f.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="card space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted">KYC Documents</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Driving License', key: 'license' },
                  { label: 'RC', key: 'rc' },
                  { label: 'Insurance', key: 'insurance' },
                  { label: 'ID Proof', key: 'idProof' },
                ].map((doc, i) => (
                  <div key={i} className="bg-surfaceHighlight rounded-xl p-4">
                    <p className="text-xs text-muted font-bold uppercase tracking-wider mb-2">{doc.label}</p>
                    {driver.documents?.[doc.key]
                      ? <a href={driver.documents[doc.key]} target="_blank" rel="noreferrer" className="text-accent text-xs font-bold underline">View →</a>
                      : <p className="text-xs text-muted">Not uploaded</p>}
                  </div>
                ))}
              </div>
              <div className={`px-4 py-3 rounded-xl text-sm font-bold ${driver.documents?.verifiedStatus === 'verified' ? 'bg-accent/10 text-accent' : driver.documents?.verifiedStatus === 'rejected' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                KYC: {driver.documents?.verifiedStatus || 'pending'}
              </div>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted mb-4">Performance</h3>
            <div className="space-y-3">
              {[
                { label: 'Rating', value: `⭐ ${driver.ratings?.averageRating?.toFixed(1) || '—'} (${driver.ratings?.totalReviews || 0})`, color: 'text-accent' },
                { label: 'Total Earnings', value: `₹${(stats.totalEarnings||0).toLocaleString()}`, color: 'text-accent' },
                { label: 'Today Earnings', value: `₹${(driver.earnings?.todayEarnings||0).toLocaleString()}`, color: 'text-foreground' },
                { label: 'Acceptance Rate', value: `${stats.acceptanceRate}%`, color: stats.acceptanceRate >= 70 ? 'text-accent' : 'text-warning' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-muted">{item.label}</span>
                  <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted mb-3">Address</h3>
            <p className="text-sm">{driver.address || '—'}</p>
            <p className="text-sm text-muted mt-1">{driver.city || ''}</p>
          </div>

          <div className="card text-center py-8 border-dashed border-border">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-sm font-bold text-muted">Live Location Map</p>
            <p className="text-xs text-muted/60 mt-1">Google Maps API key required</p>
            {driver.currentLocation?.coordinates && (
              <p className="text-xs font-mono text-muted/50 mt-3">
                {driver.currentLocation.coordinates[1]?.toFixed(5)},<br/>
                {driver.currentLocation.coordinates[0]?.toFixed(5)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
