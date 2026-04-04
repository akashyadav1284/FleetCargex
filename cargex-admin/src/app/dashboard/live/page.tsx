"use client";
import { useState, useEffect } from 'react';
import { API_URL, SOCKET_URL } from '@/lib/config';
import { useAdmin } from '../layout';
import { io } from 'socket.io-client';

export default function LiveMonitorPage() {
  const { fetchOpts, handleLogout } = useAdmin();
  const [stats, setStats] = useState({ onlineDrivers: 0, activeRides: 0, pendingRequests: 0, totalDrivers: 0, totalUsers: 0 });
  const [feed, setFeed] = useState<any[]>([]); // Array to hold live events
  const [loading, setLoading] = useState(true);

  // Helper to add events to the feed (keep last 20)
  const addEvent = (type: string, message: string, data?: any) => {
    setFeed(prev => {
      const newFeed = [{ id: Date.now(), type, message, time: new Date(), data }, ...prev];
      if (newFeed.length > 20) return newFeed.slice(0, 20);
      return newFeed;
    });
  };

  useEffect(() => {
    // Initial fetch of live stats
    const loadStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/live-stats`, fetchOpts());
        if (res.status === 401) return handleLogout();
        if (res.ok) setStats(await res.json());
      } catch (e) { console.error('Failed to load live stats', e); }
      finally { setLoading(false); }
    };
    loadStats();
    
    // Poll every 30 seconds as fallback
    const interval = setInterval(loadStats, 30000);

    // Setup Socket.IO connection for real-time events
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      addEvent('system', 'Connected to real-time dispatch server');
      // Admin could join a global monitoring room if backend supports it
      socket.emit('admin_join'); 
    });

    socket.on('disconnect', () => {
      addEvent('system', 'Disconnected from real-time dispatch server');
    });

    // Listen to generic ride events (assuming backend broadcasts these to an admin or global room)
    socket.on('new_ride_request', (data) => {
      setStats(s => ({ ...s, pendingRequests: s.pendingRequests + 1 }));
      addEvent('booking', `New ride requested by ${data.userName || 'User'}`, data);
    });

    socket.on('ride_accepted', (data) => {
      setStats(s => ({ ...s, pendingRequests: Math.max(0, s.pendingRequests - 1), activeRides: s.activeRides + 1 }));
      addEvent('booking_action', `Driver accepted ride ${data.bookingId?.slice(-6) || ''}`, data);
    });

    socket.on('ride_cancelled', (data) => {
      setStats(s => ({ ...s, pendingRequests: Math.max(0, s.pendingRequests - 1), activeRides: Math.max(0, s.activeRides - 1) }));
      addEvent('booking_cancel', `Ride ${data.bookingId?.slice(-6) || ''} cancelled`, data);
    });
    
    socket.on('ride_completed', (data) => {
      setStats(s => ({ ...s, activeRides: Math.max(0, s.activeRides - 1) }));
      addEvent('booking_success', `Ride ${data.bookingId?.slice(-6) || ''} completed`, data);
    });

    socket.on('driver_status_changed', (data) => {
      if (data.isOnline !== undefined) {
        setStats(s => ({ ...s, onlineDrivers: data.isOnline ? s.onlineDrivers + 1 : Math.max(0, s.onlineDrivers - 1) }));
        addEvent('driver_status', `Driver ${data.driverName || ''} went ${data.isOnline ? 'Online' : 'Offline'}`);
      }
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const eventStyles = (type: string) => ({
    system: 'border-l-muted',
    booking: 'border-l-warning bg-warning/5',
    booking_action: 'border-l-info bg-info/5',
    booking_cancel: 'border-l-danger bg-danger/5',
    booking_success: 'border-l-accent bg-accent/5',
    driver_status: 'border-l-foreground bg-surfaceHighlight',
  }[type] || 'border-l-muted');

  const eventIcons = (type: string) => ({
    system: '⚙️',
    booking: '🚨',
    booking_action: '📍',
    booking_cancel: '❌',
    booking_success: '✅',
    driver_status: '🚚',
  }[type] || '📌');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Monitor</h1>
          <p className="text-muted text-sm mt-1">Real-time network activity</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-xl text-sm font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" /> Live Status Active
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Online Drivers', value: stats.onlineDrivers, color: 'text-accent', subline: `out of ${stats.totalDrivers}` },
          { label: 'Active Rides', value: stats.activeRides, color: 'text-info', subline: 'in progress' },
          { label: 'Pending Requests', value: stats.pendingRequests, color: 'text-warning', subline: 'awaiting driver' },
          { label: 'Total Users', value: stats.totalUsers, color: 'text-foreground', subline: 'registered accounts' },
        ].map((s, i) => (
          <div key={i} className="card flex flex-col items-center justify-center p-6 text-center">
            <p className="text-xs text-muted font-bold uppercase tracking-wider mb-2">{s.label}</p>
            {loading ? (
              <div className="w-16 h-10 bg-surfaceHighlight rounded animate-pulse my-1" />
            ) : (
              <p className={`text-5xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
            )}
            <p className="text-xs text-muted/70 font-semibold mt-2">{s.subline}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Activity Feed */}
        <div className="card lg:col-span-1 flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-surface sticky top-0 z-10">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted">Activity Feed</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {feed.map((event) => (
              <div key={event.id} className={`p-4 rounded-xl text-sm border-l-4 border-y border-r border-y-border border-r-border shadow-sm flex items-start gap-4 transition-all animate-in slide-in-from-top-2 ${eventStyles(event.type)}`}>
                <div className="text-xl shrink-0 mt-0.5">{eventIcons(event.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">{event.message}</p>
                  <p className="text-xs text-muted/80 font-mono mt-1">{event.time.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {feed.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-surfaceHighlight flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-muted/30 animate-ping" />
                </div>
                <p className="text-sm font-bold">Waiting for events...</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Map Placeholder */}
        <div className="card lg:col-span-2 p-0 overflow-hidden border-dashed flex flex-col relative bg-[#1E2129]">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0 pointer-events-none opacity-50" />
          
          <div className="p-4 bg-background/80 backdrop-blur-md border-b border-border z-10 flex justify-between items-center">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Network Map
            </h2>
            <div className="flex gap-4 text-xs font-bold text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-info" /> In Ride</span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center z-10 bg-surface/50 p-8 text-center">
            <div className="text-6xl mb-6 opacity-80 backdrop-blur-md">🌍</div>
            <h3 className="text-lg font-bold text-foreground">Live Map Integration Pending</h3>
            <p className="text-sm text-muted mt-2 max-w-sm">
              Connect a Google Maps or Mapbox API key to visualize live vehicle locations and active dispatch routes across the city.
            </p>
            <button className="mt-6 px-6 py-2 bg-surfaceHighlight border border-border rounded-xl text-sm font-bold hover:bg-border transition-colors">
              Configure Map API
            </button>
            
            {/* Fake radar simulation for visual flair */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-20">
              <div className="w-[800px] h-[800px] rounded-full border border-accent/30 flex items-center justify-center">
                <div className="w-[600px] h-[600px] rounded-full border border-accent/20 flex items-center justify-center">
                  <div className="w-[400px] h-[400px] rounded-full border border-accent/10 flex items-center justify-center">
                    <div className="w-[200px] h-[200px] rounded-full border border-accent/5 relative">
                      {/* Radar sweep */}
                      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] border-t-2 border-l-2 border-accent/30 rounded-full origin-top-left animate-[spin_4s_linear_infinite]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
