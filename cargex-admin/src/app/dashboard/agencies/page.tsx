"use client";
import { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { API_URL } from '@/lib/config';

export default function AgenciesPage() {
  const { fetchOpts } = useAdmin();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Agency modal state
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', ownerName: '', address: ''
  });

  // Detailed view modal state
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '', ownerName: '', phone: '', address: '', status: 'active'
  });
  const [activeDetailTab, setActiveDetailTab] = useState<'drivers' | 'vehicles' | 'bookings'>('drivers');

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/agencies`, fetchOpts());
      if (res.ok) {
        setAgencies(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgencies();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/agencies`, fetchOpts({
        method: 'POST',
        body: JSON.stringify(formData)
      }));
      if (res.ok) {
        setIsCreating(false);
        setFormData({ name: '', email: '', password: '', phone: '', ownerName: '', address: '' });
        loadAgencies();
      } else {
        alert('Failed to create agency. Email might exist.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/agencies/${id}`, fetchOpts());
      if (res.ok) {
        setSelectedAgency(await res.json());
        setIsViewingDetails(true);
        setActiveDetailTab('drivers');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/agencies/${selectedAgency.agency._id}`, fetchOpts({
        method: 'PUT',
        body: JSON.stringify(editFormData)
      }));
      if (res.ok) {
        setIsEditing(false);
        // Refresh details
        const detailRes = await fetch(`${API_URL}/api/admin/agencies/${selectedAgency.agency._id}`, fetchOpts());
        if (detailRes.ok) {
          setSelectedAgency(await detailRes.json());
        }
        loadAgencies();
      } else {
        alert('Failed to update agency details.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agency?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/agencies/${id}`, fetchOpts({ method: 'DELETE' }));
      if (res.ok) loadAgencies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agency Management</h1>
          <p className="text-sm text-muted">Manage agency owners and their access credentials</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-accent text-accent-foreground font-bold rounded-xl text-sm"
        >
          {isCreating ? 'Cancel' : '+ New Agency'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-surface border border-border p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-4 text-foreground">Create Agency Account</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Agency Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Owner Name</label>
              <input type="text" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Login Email</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Passkey / Password</label>
              <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Phone Number</label>
              <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Address</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="px-6 py-2 bg-accent text-accent-foreground font-bold rounded-xl">Save Agency</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surfaceHighlight">
              <tr>
                <th className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-xs">Agency</th>
                <th className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-xs">Owner</th>
                <th className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-xs">Contact</th>
                <th className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted">Loading agencies...</td></tr>
              ) : agencies.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted">No agencies registered yet.</td></tr>
              ) : (
                agencies.map(agency => (
                  <tr key={agency._id} onClick={() => handleViewDetails(agency._id)} className="hover:bg-surfaceHighlight/50 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground hover:underline">{agency.name}</div>
                      <div className="text-xs text-muted">Created: {new Date(agency.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{agency.ownerName || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{agency.email}</div>
                      <div className="text-xs text-muted">{agency.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        agency.status === 'active' ? 'bg-success/20 text-success' : 'bg-zinc-500/20 text-zinc-500'
                      }`}>
                        {agency.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleDelete(agency._id)} className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relational details Modal */}
      {isViewingDetails && selectedAgency && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-white shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Agency Management</span>
                <h2 className="text-2xl font-black text-white">{selectedAgency.agency?.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setEditFormData({
                      name: selectedAgency.agency?.name || '',
                      ownerName: selectedAgency.agency?.ownerName || '',
                      phone: selectedAgency.agency?.phone || '',
                      address: selectedAgency.agency?.address || '',
                      status: selectedAgency.agency?.status || 'active'
                    });
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Details'}
                </button>
                <button
                  onClick={() => {
                    setIsViewingDetails(false);
                    setSelectedAgency(null);
                    setIsEditing(false);
                  }}
                  className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isEditing ? (
                <form onSubmit={handleUpdate} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Edit Agency Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Agency Name</label>
                      <input
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-500 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Owner Name</label>
                      <input
                        type="text"
                        value={editFormData.ownerName}
                        onChange={e => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-500 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={editFormData.phone}
                        onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-500 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-500 outline-none text-white"
                      >
                        <option value="active">ACTIVE</option>
                        <option value="inactive">INACTIVE</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Address</label>
                      <input
                        type="text"
                        value={editFormData.address}
                        onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-500 outline-none text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Stats */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
                    <span className="text-2xl">👥</span>
                    <p className="text-xs font-bold text-zinc-500 mt-2">TOTAL DRIVERS</p>
                    <h4 className="text-3xl font-black text-white mt-1">{selectedAgency.stats?.totalDrivers || 0}</h4>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
                    <span className="text-2xl">🚚</span>
                    <p className="text-xs font-bold text-zinc-500 mt-2">REGISTERED VEHICLES</p>
                    <h4 className="text-3xl font-black text-white mt-1">{selectedAgency.stats?.totalVehicles || 0}</h4>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
                    <span className="text-2xl">📦</span>
                    <p className="text-xs font-bold text-zinc-500 mt-2">TOTAL BOOKINGS</p>
                    <h4 className="text-3xl font-black text-white mt-1">{selectedAgency.stats?.totalBookings || 0}</h4>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left text-xs space-y-1">
                    <p className="text-zinc-500 font-bold uppercase">Profile Details</p>
                    <p><span className="text-zinc-400 font-medium">Owner:</span> {selectedAgency.agency?.ownerName}</p>
                    <p><span className="text-zinc-400 font-medium">Email:</span> {selectedAgency.agency?.email}</p>
                    <p><span className="text-zinc-400 font-medium">Phone:</span> {selectedAgency.agency?.phone}</p>
                    <p className="truncate"><span className="text-zinc-400 font-medium">Address:</span> {selectedAgency.agency?.address || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="space-y-4">
                <div className="flex border-b border-zinc-800 gap-6">
                  {(['drivers', 'vehicles', 'bookings'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveDetailTab(tab)}
                      className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                        activeDetailTab === tab
                          ? 'text-white border-b-2 border-white'
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden min-h-[30vh]">
                  {activeDetailTab === 'drivers' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900 text-zinc-400">
                          <tr>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Driver Name</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Vehicle Assigned</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {selectedAgency.drivers?.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500 font-medium">No drivers registered.</td></tr>
                          ) : (
                            selectedAgency.drivers?.map((driver: any) => (
                              <tr key={driver._id} className="hover:bg-zinc-900/30">
                                <td className="px-6 py-4 font-bold text-white">{driver.fullName}</td>
                                <td className="px-6 py-4">
                                  <div>{driver.email}</div>
                                  <div className="text-zinc-500">{driver.phone}</div>
                                </td>
                                <td className="px-6 py-4 text-zinc-300">
                                  {driver.vehicleDetails?.model} ({driver.vehicleDetails?.numberPlate})
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                                    driver.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                                  }`}>
                                    {driver.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeDetailTab === 'vehicles' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900 text-zinc-400">
                          <tr>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Number Plate</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Vehicle Model / Type</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Assigned Driver</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {selectedAgency.vehicles?.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500 font-medium">No vehicles registered.</td></tr>
                          ) : (
                            selectedAgency.vehicles?.map((v: any) => (
                              <tr key={v._id} className="hover:bg-zinc-900/30">
                                <td className="px-6 py-4 font-mono font-bold text-white uppercase">{v.numberPlate}</td>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-zinc-200">{v.vehicleModel || 'Standard'}</div>
                                  <div className="text-[10px] text-zinc-500 uppercase">{v.vehicleType}</div>
                                </td>
                                <td className="px-6 py-4 text-zinc-300">
                                  {v.driverId?.fullName || <span className="text-zinc-500">Unassigned</span>}
                                </td>
                                <td className="px-6 py-4 text-zinc-500">
                                  {new Date(v.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeDetailTab === 'bookings' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900 text-zinc-400">
                          <tr>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Booking ID</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Route Details</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider text-right">Fare</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {selectedAgency.bookings?.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-zinc-500 font-medium">No bookings found.</td></tr>
                          ) : (
                            selectedAgency.bookings?.map((b: any) => (
                              <tr key={b._id} className="hover:bg-zinc-900/30">
                                <td className="px-6 py-4 font-mono text-zinc-300">#{b._id.slice(-6).toUpperCase()}</td>
                                <td className="px-6 py-4 text-white font-medium">{b.driverId?.fullName || 'Unassigned'}</td>
                                <td className="px-6 py-4 max-w-[200px] truncate text-zinc-400">
                                  <div><span className="text-[10px] text-zinc-500 font-bold">FROM:</span> {b.pickupLocation?.address}</div>
                                  <div><span className="text-[10px] text-zinc-500 font-bold">TO:</span> {b.dropLocation?.address}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                                    b.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                    b.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                    'bg-indigo-500/10 text-indigo-400'
                                  }`}>
                                    {b.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-white">
                                  ₹{b.pricing?.totalFare || b.price?.total || 0}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
