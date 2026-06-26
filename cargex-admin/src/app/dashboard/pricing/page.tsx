"use client";
import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/config';
import { useAdmin } from '@/context/AdminContext';

export default function PricingPage() {
  const { fetchOpts, handleLogout } = useAdmin();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/fare/configs`, fetchOpts());
      if (res.status === 401) return handleLogout();
      if (res.ok) {
        const d = await res.json();
        setConfigs(d.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  const startEdit = (cfg: any) => {
    setEditingId(cfg._id);
    setEditForm({
      baseFare: cfg.baseFare,
      perKmRate: cfg.perKmRate,
      vehicleMultiplier: cfg.vehicleMultiplier,
      nightSurcharge: cfg.nightSurcharge,
      waitingChargePerMin: cfg.waitingChargePerMin,
      loadSmall: cfg.loadCharges?.small || 0,
      loadMedium: cfg.loadCharges?.medium || 50,
      loadHeavy: cfg.loadCharges?.heavy || 150,
      surgeEnabled: cfg.surgeOverride?.enabled || false,
      surgeMultiplier: cfg.surgeOverride?.multiplier || 1.0,
      isActive: cfg.isActive,
    });
  };

  const saveConfig = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/fare/configs/${editingId}`, fetchOpts({
        method: 'PUT',
        body: JSON.stringify({
          baseFare: Number(editForm.baseFare),
          perKmRate: Number(editForm.perKmRate),
          vehicleMultiplier: Number(editForm.vehicleMultiplier),
          nightSurcharge: Number(editForm.nightSurcharge),
          waitingChargePerMin: Number(editForm.waitingChargePerMin),
          loadCharges: {
            small: Number(editForm.loadSmall),
            medium: Number(editForm.loadMedium),
            heavy: Number(editForm.loadHeavy),
          },
          surgeOverride: {
            enabled: editForm.surgeEnabled,
            multiplier: Number(editForm.surgeMultiplier),
          },
          isActive: editForm.isActive,
        }),
      }));
      if (res.ok) {
        setEditingId(null);
        loadConfigs();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save');
      }
    } catch { alert('Network error'); }
    finally { setSaving(false); }
  };

  const Field = ({ label, field, type = 'number', step = '1' }: { label: string; field: string; type?: string; step?: string }) => (
    <div>
      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type} step={step}
        value={editForm[field]}
        onChange={(e) => setEditForm({ ...editForm, [field]: type === 'number' ? e.target.value : e.target.value })}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-accent"
      />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pricing Management</h1>
          <p className="text-muted text-sm mt-1">Configure per-vehicle pricing, surge, and night charges</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-xl text-sm font-bold">
          💰 {configs.length} Vehicles Configured
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-48 animate-pulse bg-surfaceHighlight" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map(cfg => (
            <div key={cfg._id} className={`card transition-all ${!cfg.isActive ? 'opacity-50' : ''} ${editingId === cfg._id ? 'border-accent shadow-lg shadow-accent/10' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-lg">🚚</div>
                  <div>
                    <h3 className="font-bold text-foreground">{cfg.vehicleName}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.isActive ? 'text-accent' : 'text-danger'}`}>
                      {cfg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button onClick={() => editingId === cfg._id ? setEditingId(null) : startEdit(cfg)}
                  className="text-xs bg-surfaceHighlight text-foreground px-3 py-1.5 rounded-lg font-bold hover:bg-border transition-colors">
                  {editingId === cfg._id ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editingId === cfg._id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Base Fare (₹)" field="baseFare" step="1" />
                    <Field label="Per Km Rate (₹)" field="perKmRate" step="0.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Vehicle Multiplier" field="vehicleMultiplier" step="0.1" />
                    <Field label="Night Surcharge (%)" field="nightSurcharge" step="0.05" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Load: Small (₹)" field="loadSmall" />
                    <Field label="Load: Medium (₹)" field="loadMedium" />
                    <Field label="Load: Heavy (₹)" field="loadHeavy" />
                  </div>
                  <Field label="Waiting (₹/min)" field="waitingChargePerMin" />

                  {/* Surge Override */}
                  <div className="bg-surface border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-muted uppercase">Surge Override</span>
                      <button className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${editForm.surgeEnabled ? 'bg-danger/20 text-danger' : 'bg-surfaceHighlight text-muted'}`}
                        onClick={() => setEditForm({ ...editForm, surgeEnabled: !editForm.surgeEnabled })}>
                        {editForm.surgeEnabled ? 'Override ON' : 'Auto (Demand)'}
                      </button>
                    </div>
                    {editForm.surgeEnabled && (
                      <Field label="Manual Surge Multiplier" field="surgeMultiplier" step="0.1" />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold ${editForm.isActive ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                      {editForm.isActive ? '✅ Active' : '❌ Inactive'}
                    </button>
                    <button onClick={saveConfig} disabled={saving}
                      className="bg-accent text-background px-4 py-2 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Base Fare</span><span className="font-bold">₹{cfg.baseFare}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Per Km Rate</span><span className="font-bold">₹{cfg.perKmRate}/km</span></div>
                  <div className="flex justify-between"><span className="text-muted">Multiplier</span><span className="font-bold">×{cfg.vehicleMultiplier}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Night Charge</span><span className="font-bold">+{(cfg.nightSurcharge * 100).toFixed(0)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted">Waiting</span><span className="font-bold">₹{cfg.waitingChargePerMin}/min</span></div>
                  <div className="flex justify-between items-center"><span className="text-muted">Surge</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cfg.surgeOverride?.enabled ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
                      {cfg.surgeOverride?.enabled ? `Manual ×${cfg.surgeOverride.multiplier}` : 'Auto (Demand)'}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2 flex justify-between text-xs">
                    <span className="text-muted">Load: S/M/H</span>
                    <span className="font-bold">₹{cfg.loadCharges?.small || 0} / ₹{cfg.loadCharges?.medium || 50} / ₹{cfg.loadCharges?.heavy || 150}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
