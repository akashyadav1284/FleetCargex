"use client";
import { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

export default function NotificationsPage() {
  const { fetchOpts } = useAdmin();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mocking notifications until a real DB collection is built for admin alerts
  // In a real app, this would fetch from /api/admin/notifications
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const [dRes, bRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/drivers?status=pending&limit=10`, fetchOpts()),
          fetch(`${API_URL}/api/admin/bookings?status=requested&limit=10`, fetchOpts())
        ]);
        
        let alerts = [];
        
        if (dRes.ok) {
          const { drivers } = await dRes.json();
          alerts.push(...(drivers || []).map((d: any) => ({
            id: `d_${d._id}`,
            type: 'driver_approval',
            title: 'Action Required: Driver Kyc Pending',
            message: `${d.fullName} requires document verification.`,
            link: `/dashboard/drivers/${d._id}`,
            time: new Date(d.createdAt),
            isRead: false
          })));
        }

        if (bRes.ok) {
          const { bookings } = await bRes.json();
          alerts.push(...(bookings || []).map((b: any) => ({
            id: `b_${b._id}`,
            type: 'booking_alert',
            title: 'Unassigned Ride Request',
            message: `Booking ${b._id.slice(-8)} from ${b.pickupLocation.address.substring(0,20)}... needs a driver.`,
            link: `/dashboard/bookings?id=${b._id}`,
            time: new Date(b.createdAt),
            isRead: false
          })));
        }

        // Sort by newest
        alerts.sort((a, b) => b.time.getTime() - a.time.getTime());
        setNotifications(alerts);
      } catch (e) { console.error('Failed to load notifications', e); }
      finally { setLoading(false); }
    };

    fetchAlerts();
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteAlert = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTypeStyles = (type: string) => ({
    driver_approval: 'bg-warning/10 text-warning border-warning/20',
    booking_alert: 'bg-info/10 text-info border-info/20',
    system: 'bg-accent/10 text-accent border-accent/20'
  }[type] || 'bg-surfaceHighlight text-muted');

  const getTypeIcon = (type: string) => ({
    driver_approval: '📋',
    booking_alert: '🚨',
    system: '⚙️'
  }[type] || '🔔');

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Alerts</h1>
          <p className="text-muted text-sm mt-1">Pending actions and important notifications</p>
        </div>
        {notifications.length > 0 && (
          <button onClick={markAllRead} className="px-4 py-2 bg-surfaceHighlight border border-border rounded-xl text-sm font-bold hover:bg-border transition-colors">
            Mark all read
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden text-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-surfaceHighlight rounded animate-pulse" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="font-bold text-lg">You're all caught up</h3>
            <p className="text-muted mt-1 text-sm">No new alerts at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map(n => (
              <Link key={n.id} href={n.link} className={`flex items-start gap-4 p-4 hover:bg-surfaceHighlight transition-colors ${n.isRead ? 'opacity-60' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center text-lg border ${getTypeStyles(n.type)}`}>
                  {getTypeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-foreground">
                      {n.title}
                      {!n.isRead && <span className="ml-2 inline-block w-2 h-2 bg-accent rounded-full animate-pulse" />}
                    </h3>
                    <span className="text-xs text-muted whitespace-nowrap">{n.time.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <p className="text-muted mt-1">{n.message}</p>
                </div>
                <button onClick={(e) => deleteAlert(n.id, e)} className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors ms-auto">
                  ✕
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
