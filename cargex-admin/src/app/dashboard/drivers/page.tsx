"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { useAdmin } from '@/context/AdminContext';
import DriverFormModal from '@/components/DriverFormModal';

export default function DriversPage() {
  const { fetchOpts, handleLogout } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<any>(null); // For debugging silent failures
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [filterOnline, setFilterOnline] = useState('all');
  const [filterCity, setFilterCity] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setErrorObj(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterOnline !== 'all') params.set('online', filterOnline);
      if (filterCity) params.set('city', filterCity);
      
      const endpoint = `${API_URL}/api/admin/drivers?${params}`;
      const res = await fetch(endpoint, fetchOpts());
      
      if (res.status === 401) return handleLogout();
      if (res.ok) { 
        const d = await res.json(); 
        setDrivers(d.drivers || []); 
        setTotal(d.total || 0); 
        setPages(d.pages || 1); 
      } else {
        const errText = await res.text();
        setErrorObj(`HTTP ${res.status}: ${errText}`);
      }
    } catch (e: any) { 
      setErrorObj(`Exception: ${e.message}`);
      console.error(e); 
    }
    finally { setLoading(false); }
  }, [page, search, filterStatus, filterOnline, filterCity]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const action = async (id: string, method: string, path: string, body?: any) => {
    setActionLoading(id + path);
    try {
      const res = await fetch(`${API_URL}/api/admin/drivers/${id}${path}`, fetchOpts({ method, ...(body ? { body: JSON.stringify(body) } : {}) }));
      if (res.ok) fetchDrivers();
      else { const d = await res.json(); alert(d.message); }
    } catch { alert('Network error'); }
    finally { setActionLoading(null); }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const url = selectedDriver ? `${API_URL}/api/admin/drivers/${selectedDriver._id}/update` : `${API_URL}/api/admin/drivers`;
      const res = await fetch(url, fetchOpts({ method: selectedDriver ? 'PUT' : 'POST', body: JSON.stringify(formData) }));
      const d = await res.json();
      if (res.ok) { setShowModal(false); fetchDrivers(); }
      else alert(d.message || 'Failed to save driver');
    } catch { alert('Network error'); }
  };

  const exportCSV = () => {
    const rows = [['Name','Email','Phone','City','Status','Online','Completed Rides','Total Earnings']];
    drivers.forEach(d => rows.push([d.fullName, d.email||'', d.phone, d.city||'', d.status, d.isOnline?'Yes':'No', d.completedRides||0, d.earnings?.totalEarnings||0]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'drivers.csv'; a.click();
  };

  const statusBadge = (s: string) => ({
    approved: 'bg-accent/10 text-accent',
    blocked: 'bg-danger/10 text-danger',
    rejected: 'bg-muted/20 text-muted',
    pending: 'bg-warning/10 text-warning',
  }[s] || 'bg-warning/10 text-warning');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Management</h1>
          <p className="text-muted text-sm mt-1">{total} drivers total</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="bg-surfaceHighlight border border-border text-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-border transition-colors flex items-center gap-2">
            📥 Export CSV
          </button>
          <button onClick={() => { setSelectedDriver(null); setShowModal(true); }}
            className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 flex items-center gap-2">
            <span className="text-lg leading-none">+</span> Add Driver
          </button>
        </div>
      </div>

      {errorObj && (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl text-sm font-bold flex items-center gap-2">
          <span>❌</span>
          {errorObj}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search name, phone, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[180px] bg-surfaceHighlight border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-surfaceHighlight border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent">
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="blocked">Blocked</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={filterOnline} onChange={e => { setFilterOnline(e.target.value); setPage(1); }}
          className="bg-surfaceHighlight border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent">
          <option value="all">All</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <input type="text" placeholder="City..." value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1); }}
          className="w-32 bg-surfaceHighlight border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
        {(search || filterStatus !== 'all' || filterOnline !== 'all' || filterCity) && (
          <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterOnline('all'); setFilterCity(''); setPage(1); }}
            className="text-xs font-bold text-muted hover:text-danger px-3 py-2 rounded-lg hover:bg-danger/10 transition-colors">✕ Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4">Driver</th>
              <th className="text-left py-3 px-4">Contact</th>
              <th className="text-left py-3 px-4">Vehicle</th>
              <th className="text-left py-3 px-4">City</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Online</th>
              <th className="text-left py-3 px-4">Rides</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {[...Array(8)].map((_, j) => <td key={j} className="py-4 px-4"><div className="h-4 bg-surfaceHighlight rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : drivers.map(d => (
              <tr key={d._id} className="border-b border-border/50 hover:bg-surfaceHighlight transition-colors group">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center font-bold text-accent shrink-0">
                      {d.fullName?.[0]}
                    </div>
                    <span className="font-medium">{d.fullName}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="text-muted text-xs">{d.email || '—'}</p>
                  <p className="text-xs">{d.phone}</p>
                </td>
                <td className="py-3 px-4 text-muted text-xs">{d.vehicleDetails?.type || '—'}</td>
                <td className="py-3 px-4 text-muted text-xs">{d.city || '—'}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold capitalize ${statusBadge(d.status || (d.isApproved ? 'approved' : 'pending'))}`}>
                    {d.status || (d.isApproved ? 'approved' : 'pending')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${d.isOnline ? 'bg-accent' : 'bg-muted/50'}`} />
                </td>
                <td className="py-3 px-4 text-xs text-muted">{d.completedRides || 0}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-1.5 justify-end flex-wrap">
                    <Link href={`/dashboard/drivers/${d._id}`}
                      className="text-xs bg-surfaceHighlight text-foreground px-2.5 py-1.5 rounded-lg font-bold hover:bg-border transition-colors">View</Link>
                    <button onClick={() => { setSelectedDriver(d); setShowModal(true); }}
                      className="text-xs bg-surfaceHighlight text-foreground px-2.5 py-1.5 rounded-lg font-bold hover:bg-border transition-colors">Edit</button>
                    {d.status !== 'approved' && d.status !== 'blocked' &&
                      <button onClick={() => action(d._id, 'PUT', '/approve', { status: 'approved' })} disabled={!!actionLoading}
                        className="text-xs bg-accent/10 text-accent px-2.5 py-1.5 rounded-lg font-bold hover:bg-accent/20 transition-colors">✓ Approve</button>}
                    {d.status === 'approved' &&
                      <button onClick={() => action(d._id, 'PUT', '/approve', { status: 'rejected' })} disabled={!!actionLoading}
                        className="text-xs bg-warning/10 text-warning px-2.5 py-1.5 rounded-lg font-bold hover:bg-warning/20 transition-colors">Revoke</button>}
                    {d.status !== 'blocked'
                      ? <button onClick={() => { if(confirm('Block this driver?')) action(d._id, 'PUT', '/block'); }} disabled={!!actionLoading}
                          className="text-xs bg-danger/10 text-danger px-2.5 py-1.5 rounded-lg font-bold hover:bg-danger/20 transition-colors">Block</button>
                      : <button onClick={() => action(d._id, 'PUT', '/unblock')} disabled={!!actionLoading}
                          className="text-xs bg-accent/10 text-accent px-2.5 py-1.5 rounded-lg font-bold hover:bg-accent/20 transition-colors">Unblock</button>}
                    <button onClick={() => { if(confirm('Delete driver permanently?')) action(d._id, 'DELETE', ''); }} disabled={!!actionLoading}
                      className="text-xs bg-danger/10 text-danger px-2.5 py-1.5 rounded-lg font-bold hover:bg-danger/20 transition-colors">Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && drivers.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted">No drivers found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted">Showing {drivers.length} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-surfaceHighlight border border-border font-bold disabled:opacity-40 hover:bg-border transition-colors">← Prev</button>
            <span className="px-4 py-2 rounded-lg bg-accent/10 text-accent font-bold border border-accent/20">{page}/{pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}
              className="px-4 py-2 rounded-lg bg-surfaceHighlight border border-border font-bold disabled:opacity-40 hover:bg-border transition-colors">Next →</button>
          </div>
        </div>
      )}

      <DriverFormModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleSubmit} initialData={selectedDriver} />
    </div>
  );
}
