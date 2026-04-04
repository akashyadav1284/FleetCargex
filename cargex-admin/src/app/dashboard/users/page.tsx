"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { useAdmin } from '../layout';

export default function UsersPage() {
  const { fetchOpts, handleLogout } = useAdmin();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const res = await fetch(`${API_URL}/api/admin/users?${params}`, fetchOpts());
      if (res.status === 401) return handleLogout();
      if (res.ok) { const d = await res.json(); setUsers(d.users || []); setTotal(d.total || 0); setPages(d.pages || 1); }
    } catch { }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const doAction = async (id: string, method: string, path: string) => {
    setActionLoading(id + path);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}${path}`, fetchOpts({ method }));
      if (res.ok) fetchUsers();
      else { const d = await res.json(); alert(d.message); }
    } catch { alert('Network error'); }
    finally { setActionLoading(null); }
  };

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Phone', 'Role', 'Wallet', 'Joined']];
    users.forEach(u => rows.push([u.fullName, u.email || '', u.phone, u.role || 'user', u.walletBalance || 0, u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'users.csv'; a.click();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted text-sm mt-1">{total} registered users</p>
        </div>
        <button onClick={exportCSV} className="bg-surfaceHighlight border border-border text-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-border transition-colors flex items-center gap-2">
          📥 Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 flex gap-3 items-center">
        <input type="text" placeholder="Search by name, email, or phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-surfaceHighlight border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
        {search && <button onClick={() => { setSearch(''); setPage(1); }} className="text-xs font-bold text-muted hover:text-danger px-3 py-2 rounded-lg hover:bg-danger/10 transition-colors">✕</button>}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4">User</th>
              <th className="text-left py-3 px-4">Contact</th>
              <th className="text-left py-3 px-4">Role</th>
              <th className="text-left py-3 px-4">Wallet</th>
              <th className="text-left py-3 px-4">Joined</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {[...Array(6)].map((_, j) => <td key={j} className="py-4 px-4"><div className="h-4 bg-surfaceHighlight rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : users.map(u => (
              <tr key={u._id} className="border-b border-border/50 hover:bg-surfaceHighlight transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-info/10 rounded-full flex items-center justify-center font-bold text-info shrink-0 text-sm">
                      {u.fullName?.[0]}
                    </div>
                    <span className="font-medium">{u.fullName}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="text-xs text-muted">{u.email || '—'}</p>
                  <p className="text-xs">{u.phone}</p>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs bg-info/10 text-info px-2 py-1 rounded-full font-bold">{u.role || 'user'}</span>
                </td>
                <td className="py-3 px-4 font-bold text-accent">₹{u.walletBalance || 0}</td>
                <td className="py-3 px-4 text-xs text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-1.5 justify-end">
                    <Link href={`/dashboard/users/${u._id}`}
                      className="text-xs bg-surfaceHighlight text-foreground px-2.5 py-1.5 rounded-lg font-bold hover:bg-border transition-colors">View</Link>
                    <button onClick={() => { if(confirm('Block this user?')) doAction(u._id, 'PUT', '/block'); }} disabled={actionLoading === u._id + '/block'}
                      className="text-xs bg-warning/10 text-warning px-2.5 py-1.5 rounded-lg font-bold hover:bg-warning/20 transition-colors">Block</button>
                    <button onClick={() => { if(confirm('Delete this user permanently?')) doAction(u._id, 'DELETE', ''); }} disabled={actionLoading === u._id + ''}
                      className="text-xs bg-danger/10 text-danger px-2.5 py-1.5 rounded-lg font-bold hover:bg-danger/20 transition-colors">Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-muted">No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted">Showing {users.length} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg bg-surfaceHighlight border border-border font-bold disabled:opacity-40 hover:bg-border transition-colors">← Prev</button>
            <span className="px-4 py-2 rounded-lg bg-accent/10 text-accent font-bold border border-accent/20">{page}/{pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-4 py-2 rounded-lg bg-surfaceHighlight border border-border font-bold disabled:opacity-40 hover:bg-border transition-colors">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
