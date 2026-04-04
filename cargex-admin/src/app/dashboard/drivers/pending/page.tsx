"use client";
import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/config';
import { useAdmin } from '../../layout';

export default function PendingDriversPage() {
  const { fetchOpts, handleLogout } = useAdmin();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = `${API_URL}/api/admin/drivers?status=pending&limit=50`;
      const res = await fetch(endpoint, fetchOpts());
      
      if (res.status === 401) return handleLogout();
      if (res.ok) { 
        const d = await res.json(); 
        setDrivers(d.drivers || []); 
      }
    } catch (e: any) { 
      console.error(e); 
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPendingDrivers(); }, [fetchPendingDrivers]);

  const action = async (id: string, method: string, path: string, body?: any) => {
    setActionLoading(id + path);
    try {
      const res = await fetch(`${API_URL}/api/admin/drivers/${id}${path}`, fetchOpts({ method, ...(body ? { body: JSON.stringify(body) } : {}) }));
      if (res.ok) fetchPendingDrivers();
      else { const d = await res.json(); alert(d.message); }
    } catch { alert('Network error'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Driver Applications</h1>
          <p className="text-muted text-sm mt-1">Review and approve new driver registrations.</p>
        </div>
        <button onClick={fetchPendingDrivers} className="bg-surfaceHighlight border border-border text-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-border transition-colors">
          ↻ Refresh
        </button>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted text-xs uppercase tracking-wider bg-surfaceHighlight/50">
              <th className="text-left py-4 px-6">Name</th>
              <th className="text-left py-4 px-6">Email</th>
              <th className="text-left py-4 px-6">Phone</th>
              <th className="text-left py-4 px-6">Vehicle Type</th>
              <th className="text-left py-4 px-6">Registration Date</th>
              <th className="text-right py-4 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {[...Array(6)].map((_, j) => <td key={j} className="py-5 px-6"><div className="h-4 bg-surfaceHighlight rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : drivers.map(d => (
              <tr key={d._id} className="border-b border-border/50 hover:bg-surfaceHighlight transition-colors">
                <td className="py-4 px-6 font-bold text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs">{d.fullName?.[0]}</div>
                    {d.fullName}
                  </div>
                </td>
                <td className="py-4 px-6 text-muted font-medium">{d.email || '—'}</td>
                <td className="py-4 px-6 font-medium">{d.phone}</td>
                <td className="py-4 px-6">
                  <span className="bg-surfaceHighlight text-foreground px-2 py-1 rounded font-bold text-xs border border-border">
                    {d.vehicleDetails?.type || '—'}
                  </span>
                </td>
                <td className="py-4 px-6 text-muted text-xs font-semibold">
                  {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => action(d._id, 'PUT', '/approve', { status: 'approved' })} disabled={!!actionLoading}
                      className="text-xs bg-success/15 text-success border border-success/20 px-3 py-2 rounded-lg font-bold hover:bg-success hover:text-white transition-colors flex items-center gap-1 shadow-sm">
                      ✅ Approve
                    </button>
                    <button onClick={() => action(d._id, 'PUT', '/approve', { status: 'rejected' })} disabled={!!actionLoading}
                      className="text-xs bg-warning/15 text-warning border border-warning/20 px-3 py-2 rounded-lg font-bold hover:bg-warning hover:text-white transition-colors flex items-center gap-1 shadow-sm">
                      ❌ Reject
                    </button>
                    <button onClick={() => { if(confirm('Permanently delete this applicant?')) action(d._id, 'DELETE', ''); }} disabled={!!actionLoading}
                      className="text-xs bg-danger/10 text-danger border border-danger/10 px-3 py-2 rounded-lg font-bold hover:bg-danger hover:text-white transition-colors flex items-center gap-1 shadow-sm">
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && drivers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="font-bold">No Pending Drivers</p>
                  <p className="text-xs mt-1">All applications have been reviewed.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
