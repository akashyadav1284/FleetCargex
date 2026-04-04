"use client";

import { useState, useEffect } from "react";

// Cloudinary is optional - only load if env var is set
const CLOUDINARY_CONFIGURED = typeof process !== 'undefined' && 
  !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Lazy import to avoid crash when env var missing
let CldUploadWidget: any = null;
if (CLOUDINARY_CONFIGURED) {
  try {
    ({ CldUploadWidget } = require("next-cloudinary"));
  } catch (e) {
    // Cloudinary not available
  }
}

type DriverFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
};

export default function DriverFormModal({ isOpen, onClose, onSubmit, initialData }: DriverFormModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'vehicle' | 'documents'>('personal');
  const [formData, setFormData] = useState<any>({
    fullName: '', email: '', phone: '', password: '', address: '', city: '',
    vehicleDetails: { type: '', name: '', model: '', numberPlate: '', capacity: 0, fuelType: '', image: '' },
    documents: { license: '', rc: '', insurance: '', idProof: '' }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        vehicleDetails: initialData.vehicleDetails || { type: '', name: '', model: '', numberPlate: '', capacity: 0, fuelType: '', image: '' },
        documents: initialData.documents || { license: '', rc: '', insurance: '', idProof: '' }
      });
    } else {
      setFormData({
        fullName: '', email: '', phone: '', password: '', address: '', city: '',
        vehicleDetails: { type: '', name: '', model: '', numberPlate: '', capacity: 0, fuelType: '', image: '' },
        documents: { license: '', rc: '', insurance: '', idProof: '' }
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('vehicleDetails.')) {
      const field = name.split('.')[1];
      setFormData({ ...formData, vehicleDetails: { ...formData.vehicleDetails, [field]: value } });
    } else if (name.startsWith('documents.')) {
      const field = name.split('.')[1];
      setFormData({ ...formData, documents: { ...formData.documents, [field]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleUploadSuccess = (url: string, path: string) => {
    if (path.startsWith('vehicleDetails.')) {
      const field = path.split('.')[1];
      setFormData({ ...formData, vehicleDetails: { ...formData.vehicleDetails, [field]: url } });
    } else if (path.startsWith('documents.')) {
      const field = path.split('.')[1];
      setFormData({ ...formData, documents: { ...formData.documents, [field]: url } });
    } else {
      setFormData({ ...formData, [path]: url });
    }
  };

  // Helper: renders Cloudinary widget OR plain URL input as fallback
  const UploadField = ({ path, label }: { path: string; label: string }) => {
    const fieldKey = path.split('.').pop()!;
    const currentVal = path.startsWith('vehicleDetails.')
      ? formData.vehicleDetails[fieldKey]
      : path.startsWith('documents.')
      ? formData.documents[fieldKey]
      : formData[path];

    if (CLOUDINARY_CONFIGURED && CldUploadWidget) {
      return (
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default'}
          onSuccess={(res: any) => handleUploadSuccess(res.info.secure_url, path)}
        >
          {({ open }: { open: () => void }) => (
            <button type="button" onClick={() => open()} className="bg-surface border border-border px-4 py-2 rounded-lg text-sm font-semibold hover:border-accent transition-colors flex items-center gap-2">
              <span className="text-accent">☁️</span> {currentVal ? 'Replace' : 'Upload File'}
            </button>
          )}
        </CldUploadWidget>
      );
    }

    // Fallback: plain URL input
    return (
      <div className="flex flex-col gap-1 flex-1">
        <input
          type="url"
          placeholder={`Paste ${label} URL (or setup Cloudinary env vars for file upload)`}
          value={currentVal || ''}
          onChange={e => handleUploadSuccess(e.target.value, path)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent transition-colors"
        />
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold">{initialData ? 'Edit Driver Profile' : 'Register New Driver'}</h2>
            <p className="text-muted text-sm">{initialData ? 'Update driver, vehicle, and documents in real-time.' : 'Create complete driver identity.'}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-surfaceHighlight hover:bg-border rounded-full flex items-center justify-center text-xl transition-colors">✕</button>
        </div>

        {/* Tabs Navigate */}
        <div className="px-6 pt-4 border-b border-border flex gap-6 shrink-0">
          {[
            { id: 'personal', label: 'Personal Info' },
            { id: 'vehicle', label: 'Vehicle Identity' },
            { id: 'documents', label: 'Verifications' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="driverForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm" required /></div>
                  <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Primary Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Email Address</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm" /></div>
                  <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Platform Passkey</label><input type="text" name="password" placeholder={initialData ? "Leave empty to keep current passkey" : "Require secret key"} value={formData.password} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm" {...(!initialData && {required: true})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1"><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">City Jurisdiction</label><input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm" /></div>
                  <div className="col-span-1"><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Residential Address</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm" /></div>
                </div>
              </div>
            )}

            {/* Vehicle Tab */}
            {activeTab === 'vehicle' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Vehicle Category / Type</label>
                    <input type="text" name="vehicleDetails.type" placeholder="e.g. Small Load, Truck" value={formData.vehicleDetails.type} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm" />
                  </div>
                  <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Vehicle Name</label><input type="text" name="vehicleDetails.name" placeholder="e.g. Tata Ace, Pickup XL" value={formData.vehicleDetails.name} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Number Plate</label><input type="text" name="vehicleDetails.numberPlate" placeholder="e.g. DL-01-AB-1234" value={formData.vehicleDetails.numberPlate} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-warning font-mono text-warning font-bold uppercase text-sm" /></div>
                  <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Capacity (KG)</label><input type="number" name="vehicleDetails.capacity" value={formData.vehicleDetails.capacity} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Fuel Type</label>
                    <select name="vehicleDetails.fuelType" value={formData.vehicleDetails.fuelType} onChange={handleChange} className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm">
                      <option value="">Select Fuel</option>
                      <option value="diesel">Diesel</option>
                      <option value="petrol">Petrol</option>
                      <option value="cng">CNG</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>
                </div>
                <div className="bg-surfaceHighlight p-4 rounded-xl border border-border mt-4">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-3">Vehicle Live Image</label>
                  <div className="flex items-center gap-4 flex-wrap">
                    {formData.vehicleDetails.image && <img src={formData.vehicleDetails.image} alt="Vehicle preview" className="w-24 h-16 object-cover rounded-lg border border-border" />}
                    <UploadField path="vehicleDetails.image" label="vehicle image" />
                    {!formData.vehicleDetails.image && !CLOUDINARY_CONFIGURED && <p className="text-[10px] text-muted">Add <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> to .env.local to enable cloud uploads</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {[
                  { id: 'documents.license', label: 'Driving License (DL)' },
                  { id: 'documents.rc', label: 'Registration Certificate (RC)' },
                  { id: 'documents.insurance', label: 'Vehicle Insurance Details' },
                  { id: 'documents.idProof', label: 'National ID Proof (Aadhaar/PAN)' }
                ].map((doc) => {
                  const val = formData.documents[doc.id.split('.')[1]];
                  return (
                  <div key={doc.id} className="bg-surfaceHighlight p-4 rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <label className="font-bold text-sm block mb-1">{doc.label}</label>
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${val ? 'bg-info' : 'bg-muted'}`}></div>
                         <span className="text-xs text-muted uppercase tracking-wider font-bold">{val ? 'Document Attached' : 'Missing Requirement'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        {val && <a href={val} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-bold hover:bg-border transition-colors">View</a>}
                        <UploadField path={doc.id} label={doc.label} />
                    </div>
                  </div>
                )})}
              </div>
            )}
          </form>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-border flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-muted hover:text-foreground text-sm hover:bg-surfaceHighlight transition-colors">Cancel</button>
          <button 
            type="submit" 
            form="driverForm" 
            disabled={isSubmitting} 
            className="px-6 py-2.5 bg-accent text-white rounded-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Saving Framework...' : initialData ? 'Commit Upgrades' : 'Register Official Driver'}
          </button>
        </div>
      </div>
    </div>
  );
}
