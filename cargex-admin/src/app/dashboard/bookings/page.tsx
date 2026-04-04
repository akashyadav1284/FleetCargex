"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { useAdmin } from '../layout';
import BookingDetailModal from '@/components/BookingDetailModal';

export default function BookingsPage() {
  const { fetchOpts, handleLogout } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(searchParams.get('id') || null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterPayment !== 'all') params.set('payment', filterPayment);
      if (filterVehicle !== 'all') params.set('vehicle', filterVehicle);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      
      const res = await fetch(`${API_URL}/api/admin/bookings?${params}`, fetchOpts());
      if (res.status === 401) return handleLogout();
      if (res.ok) { 
        const d = await res.json(); 
        setBookings(d.bookings || []); 
        setTotal(d.total || 0); 
        setPages(d.pages || 1); 
      }
    } catch { }
    finally { setLoading(false); }
  }, [page, filterStatus, filterPayment, filterVehicle, dateFrom, dateTo]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const exportCSV = () => {
    const rows = [['ID', 'User', 'Driver', 'Vehicle', 'Status', 'Payment', 'Amount', 'Date']];
    bookings.forEach(b => rows.push([
      b._id, 
      b.userId?.fullName || '', 
      b.driverId?.fullName || '', 
      b.vehicleType || '', 
      b.status, 
      b.paymentMethod || 'Cash', 
      b.price?.total || 0, 
      b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); 
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`; 
    a.click();
  };

  const statusColor = (s: string) => (({ completed: 'bg-accent/10 text-accent', in_progress: 'bg-info/10 text-info', cancelled: 'bg-danger/10 text-danger', requested: 'bg-warning/10 text-warning', accepted: 'bg-info/10 text-info' } as any)[s] || 'bg-muted/10 text-muted');

  const hasFilters = filterStatus !== 'all' || filterPayment !== 'all' || filterVehicle !== 'all' || dateFrom || dateTo;
  
  const clearFilters = () => {
    setFilterStatus('all'); setFilterPayment('all'); setFilterVehicle('all'); setDateFrom(''); setDateTo(''); setPage(1);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking Management</h1>
          <p className="text-muted text-sm mt-1">{total} total bookings</p>
        </div>
        <button onClick={exportCSV} className="bg-surfaceHighlight border border-border text-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-border transition-colors flex items-center gap-2">
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-bold text-muted mb-1 uppercase tracking-wider">Status</label>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="w-full sm:w-auto bg-surfaceHighlight border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors">
            <option value="all">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-muted mb-1 uppercase tracking-wider">Payment</label>
          <select value={filterPayment} onChange={e => { setFilterPayment(e.target.value); setPage(1); }} className="w-full sm:w-auto bg-surfaceHighlight border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent">
            <option value="all">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Wallet">Wallet</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-muted mb-1 uppercase tracking-wider">Date From</label>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="w-full sm:w-auto bg-surfaceHighlight border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-bold text-muted mb-1 uppercase tracking-wider">Date To</label>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="w-full sm:w-auto bg-surfaceHighlight border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs font-bold text-danger hover:text-danger/80 px-4 py-2.5 rounded-xl bg-danger/10 hover:bg-danger/20 transition-colors h-[42px]">
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4">ID / Date</th>
              <th className="text-left py-3 px-4">User</th>
              <th className="text-left py-3 px-4">Driver</th>
              <th className="text-left py-3 px-4">Vehicle</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Price / Payment</th>
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
            ) : bookings.map(b => (
              <tr key={b._id} className="border-b border-border/50 hover:bg-surfaceHighlight transition-colors">
                <td className="py-3 px-4">
                  <p className="font-mono text-xs text-foreground font-bold">{b._id?.slice(-8)}</p>
                  <p className="text-xs text-muted mt-1">{b.createdAt ? new Date(b.createdAt).toLocaleString([], { dateStyle:'short', timeStyle:'short' }) : '—'}</p>
                </td>
                <td className="py-3 px-4">
                  {b.userId ? (
                    <Link href={`/dashboard/users/${b.userId._id}`} className="hover:underline font-medium text-info">{b.userId.fullName}</Link>
                  ) : <span className="text-muted">Unknown</span>}
                  <p className="text-xs text-muted mt-1">{b.userId?.phone}</p>
                </td>
                <td className="py-3 px-4">
                  {b.driverId ? (
                    <Link href={`/dashboard/drivers/${b.driverId._id}`} className="hover:underline font-medium text-accent">{b.driverId.fullName}</Link>
                  ) : <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded-md font-bold">Unassigned</span>}
                  {b.driverId?.phone && <p className="text-xs text-muted mt-1">{b.driverId.phone}</p>}
                </td>
                <td className="py-3 px-4">
                  <p className="font-medium text-xs">{b.vehicleType || '—'}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${statusColor(b.status)}`}>{b.status}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <p className="font-bold text-accent">₹{b.price?.total || 0}</p>
                  <p className="text-xs text-muted mt-1">{b.paymentMethod || 'Cash'}</p>
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => setSelectedBookingId(b._id)} className="text-xs bg-surfaceHighlight text-foreground px-3 py-1.5 rounded-lg font-bold hover:bg-border transition-colors">Manage</button>
                </td>
              </tr>
            ))}
            {!loading && bookings.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted">No bookings found matching filters</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted">Showing page <span className="text-foreground font-bold">{page}</span> of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg bg-surfaceHighlight border border-border font-bold disabled:opacity-40 hover:bg-border transition-colors">← Prev</button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-4 py-2 rounded-lg bg-surfaceHighlight border border-border font-bold disabled:opacity-40 hover:bg-border transition-colors">Next →</button>
          </div>
        </div>
      )}

      {selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          onClose={() => { setSelectedBookingId(null); router.replace('/dashboard/bookings'); }}
          fetchOpts={fetchOpts}
          onUpdate={fetchBookings}
        />
      )}
    </div>
  );
}
