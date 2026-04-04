import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/config';

interface BookingDetailModalProps {
  bookingId: string | null;
  onClose: () => void;
  fetchOpts: (opts?: RequestInit) => RequestInit;
  onUpdate: () => void;
}

export default function BookingDetailModal({ bookingId, onClose, fetchOpts, onUpdate }: BookingDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // For force assigning a driver
  const [showAssign, setShowAssign] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');

  useEffect(() => {
    if (!bookingId) return;
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/bookings/${bookingId}`, fetchOpts());
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error('Failed to load booking details', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const loadAvailableDrivers = async () => {
    if (drivers.length > 0) { setShowAssign(true); return; }
    try {
      // Find drivers matching vehicle type who are online
      const res = await fetch(`${API_URL}/api/admin/drivers?online=online`, fetchOpts());
      if (res.ok) {
        const d = await res.json();
        setDrivers((d.drivers || []).filter((dr: any) => 
          !data.vehicleType || !dr.vehicleDetails?.type || dr.vehicleDetails.type === data.vehicleType
        ));
        setShowAssign(true);
      }
    } catch {}
  };

  const handleAction = async (action: 'cancel' | 'assign' | 'refund') => {
    if (action === 'cancel' && !confirm('Force cancel this booking? This will notify the user and driver.')) return;
    
    setActionLoading(action);
    try {
      let url = `${API_URL}/api/admin/bookings/${bookingId}/${action}`;
      let body;

      if (action === 'assign') {
        if (!selectedDriver) { alert('Select a driver'); setActionLoading(null); return; }
        body = { driverId: selectedDriver };
      } else if (action === 'refund') {
        // Mock refund endpoint
        alert('Refund initiated simulated.');
        setActionLoading(null);
        return;
      }

      const res = await fetch(url, fetchOpts({ method: 'PUT', ...(body ? { body: JSON.stringify(body) } : {}) }));
      if (res.ok) {
        setShowAssign(false);
        onUpdate();
        onClose();
      } else {
        const d = await res.json();
        alert(d.message);
      }
    } catch {
      alert('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  if (!bookingId) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 font-sans">
        
        {/* Header */}
        <div className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold">Booking Details</h2>
            <p className="text-sm font-mono text-muted">{bookingId}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground bg-surfaceHighlight rounded-xl transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-surfaceHighlight animate-pulse rounded-xl" />)}
            </div>
          ) : !data ? (
            <div className="text-center text-danger py-8">Failed to load booking.</div>
          ) : (
            <div className="space-y-6">
              
              {/* Status Band */}
              <div className={`p-4 rounded-xl flex justify-between items-center ${
                data.status === 'completed' ? 'bg-accent/10 text-accent border border-accent/20' :
                data.status === 'in_progress' ? 'bg-info/10 text-info border border-info/20' :
                data.status === 'cancelled' ? 'bg-danger/10 text-danger border border-danger/20' :
                'bg-warning/10 text-warning border border-warning/20'
              }`}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">Current Status</p>
                  <p className="text-xl font-black">{data.status.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">Total Fare ({data.paymentMethod || 'Cash'})</p>
                  <p className="text-xl font-black">₹{data.price?.total || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <div className="bg-surfaceHighlight rounded-xl p-4">
                  <h3 className="text-xs font-bold uppercase text-muted tracking-wider mb-3">Customer</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-info/20 text-info rounded-full flex items-center justify-center font-bold">
                      {data.userId?.fullName?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{data.userId?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-muted font-mono mt-0.5">{data.userId?.phone || 'No phone'}</p>
                    </div>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="bg-surfaceHighlight rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase text-muted tracking-wider">Driver</h3>
                    {!data.driverId && !['cancelled', 'completed'].includes(data.status) && (
                      <button onClick={loadAvailableDrivers} className="text-[10px] bg-accent/20 text-accent px-2 py-1 rounded hover:bg-accent/30 font-bold uppercase">
                        Force Assign
                      </button>
                    )}
                  </div>
                  
                  {data.driverId ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/20 text-accent rounded-full flex items-center justify-center font-bold">
                        {data.driverId.fullName?.[0] || 'D'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{data.driverId.fullName}</p>
                        <p className="text-xs text-muted font-mono mt-0.5">{data.driverId.phone} • {data.vehicleType}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 opacity-60">
                      <div className="w-10 h-10 border border-dashed border-muted rounded-full flex items-center justify-center text-muted">?</div>
                      <p className="text-sm font-bold text-muted">Awaiting assignment</p>
                    </div>
                  )}

                  {/* Inline assign driver UI */}
                  {showAssign && (
                    <div className="mt-3 border-t border-border pt-3 flex items-center gap-2">
                      <select 
                        value={selectedDriver} 
                        onChange={e => setSelectedDriver(e.target.value)}
                        className="flex-1 bg-surface border border-border rounded px-2 py-1 text-xs"
                      >
                        <option value="">Select available driver...</option>
                        {drivers.map(d => (
                          <option key={d._id} value={d._id}>{d.fullName} ({d.city})</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleAction('assign')}
                        disabled={!selectedDriver || actionLoading === 'assign'}
                        className="bg-accent text-background px-3 py-1 rounded text-xs font-bold disabled:opacity-50"
                      >
                        {actionLoading === 'assign' ? '...' : 'Assign'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Route */}
              <div className="bg-surfaceHighlight rounded-xl p-4 relative">
                <h3 className="text-xs font-bold uppercase text-muted tracking-wider mb-4">Route Details</h3>
                
                <div className="flex flex-col gap-4 relative">
                  <div className="absolute left-2 top-3 bottom-3 w-px bg-border z-0" />
                  
                  <div className="flex gap-4 relative z-10">
                    <div className="w-4 h-4 rounded-full bg-accent border-[3px] border-background mt-0.5 shrink-0 shadow-[0_0_0_2px_#10B98133]" />
                    <div>
                      <p className="text-xs font-bold text-muted uppercase tracking-wider">Pickup</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{data.pickupLocation?.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 relative z-10">
                    <div className="w-4 h-4 rounded-full bg-info border-[3px] border-background mt-0.5 shrink-0 shadow-[0_0_0_2px_#3B82F633]" />
                    <div>
                      <p className="text-xs font-bold text-muted uppercase tracking-wider">Drop-off</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{data.dropLocation?.address}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
                  <p><span className="text-muted">Distance:</span> <span className="font-bold">{data.distance ? `${data.distance.toFixed(1)} km` : 'Calculating...'}</span></p>
                  <p><span className="text-muted">Load Type:</span> <span className="font-bold capitalize">{data.loadType}</span></p>
                </div>
              </div>

              {/* Fare Breakdown — NEW */}
              <div className="bg-surfaceHighlight rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase text-muted tracking-wider mb-3">Fare Breakdown</h3>
                {data.pricing?.totalFare ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted">Base Fare</span><span className="font-bold">₹{data.pricing.baseFare}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Distance Cost</span><span className="font-bold">₹{data.pricing.distanceCost}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Load Charge</span><span className="font-bold">₹{data.pricing.loadCost}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Vehicle Multiplier</span><span className="font-bold">×{data.pricing.vehicleMultiplier}</span></div>
                    {data.pricing.surgeMultiplier > 1 && (
                      <div className="flex justify-between text-danger"><span>Surge Pricing</span><span className="font-bold">×{data.pricing.surgeMultiplier}</span></div>
                    )}
                    {data.pricing.nightSurcharge > 0 && (
                      <div className="flex justify-between text-warning"><span>Night Surcharge</span><span className="font-bold">+₹{data.pricing.nightSurcharge}</span></div>
                    )}
                    {data.pricing.waitingCharges > 0 && (
                      <div className="flex justify-between text-info"><span>Waiting Charges</span><span className="font-bold">₹{data.pricing.waitingCharges}</span></div>
                    )}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
                      <span>Total Fare</span><span className="text-accent text-lg">₹{data.pricing.totalFare}</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-1 flex justify-between text-xs text-muted">
                      <span>Platform Commission (20%)</span><span className="font-bold">₹{Math.round(data.pricing.totalFare * 0.20)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted">
                      <span>Driver Earning (80%)</span><span className="font-bold text-accent">₹{Math.round(data.pricing.totalFare * 0.80)}</span>
                    </div>
                  </div>
                ) : data.price?.total ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted">Base Fare</span><span className="font-bold">₹{data.price.baseFare || 0}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Distance Fare</span><span className="font-bold">₹{data.price.distanceFare || 0}</span></div>
                    {data.price.surge > 0 && <div className="flex justify-between"><span className="text-muted">Surge</span><span className="font-bold">₹{data.price.surge}</span></div>}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
                      <span>Total</span><span className="text-accent text-lg">₹{data.price.total}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted">No pricing data</p>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-surfaceHighlight rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase text-muted tracking-wider mb-3">Timeline</h3>
                <div className="space-y-2 text-sm text-muted">
                  <div className="flex justify-between">
                    <span>Requested</span>
                    <span className="font-mono">{new Date(data.createdAt).toLocaleString([], {dateStyle:'short', timeStyle:'short'})}</span>
                  </div>
                  {data.startedAt && (
                    <div className="flex justify-between">
                      <span>Started Ride</span>
                      <span className="font-mono">{new Date(data.startedAt).toLocaleString([], {dateStyle:'short', timeStyle:'short'})}</span>
                    </div>
                  )}
                  {data.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-accent font-bold">Completed</span>
                      <span className="font-mono text-foreground">{new Date(data.completedAt).toLocaleString([], {dateStyle:'short', timeStyle:'short'})}</span>
                    </div>
                  )}
                  {data.status === 'cancelled' && (
                    <div className="flex justify-between">
                      <span className="text-danger font-bold">Cancelled</span>
                      <span className="text-foreground">{data.cancellationReason || 'User cancelled'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Danger Actions */}
              {['requested', 'accepted', 'in_progress'].includes(data.status) && (
                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button 
                    onClick={() => handleAction('cancel')}
                    disabled={!!actionLoading}
                    className="bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    {actionLoading === 'cancel' ? 'Processing...' : 'Force Cancel Booking'}
                  </button>
                </div>
              )}
              {data.status === 'completed' && data.paymentMethod !== 'Cash' && (
                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button 
                    onClick={() => handleAction('refund')}
                    disabled={!!actionLoading}
                    className="bg-surfaceHighlight text-foreground border border-border hover:bg-border px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    Simulate Refund
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
