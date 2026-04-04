"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';
import Link from 'next/link';

export default function DriverRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'Mini Truck'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const vehicleTypes = [
    'Mini Truck',
    'Pickup',
    'Medium Truck',
    'Heavy Truck'
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register/driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          vehicleType: formData.vehicleType
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setShowSuccessModal(true);
      } else {
        if (data.errors && data.errors.length > 0) {
          setErrorMsg(data.errors[0].message);
        } else {
          setErrorMsg(data.message || 'Registration failed.');
        }
      }
    } catch {
      setErrorMsg('Network error connecting to the API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans py-12">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight mb-2">Driver Application</h1>
            <p className="text-muted text-sm">Join the Cargex network and start earning.</p>
          </div>

          {errorMsg && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm mb-6 font-medium">{errorMsg}</div>}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Full Name *</label>
              <input type="text" placeholder="John Doe" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-inputBg border border-transparent rounded-lg px-4 py-3 focus:outline-none focus:border-black focus:bg-white transition-all shadow-sm" required />
            </div>
            
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Email *</label>
              <input type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-inputBg border border-transparent rounded-lg px-4 py-3 focus:outline-none focus:border-black focus:bg-white transition-all shadow-sm" required />
            </div>

            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Phone Number *</label>
              <input type="tel" placeholder="Enter 10-digit number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-inputBg border border-transparent rounded-lg px-4 py-3 focus:outline-none focus:border-black focus:bg-white transition-all shadow-sm" required />
            </div>

            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Secure Password *</label>
              <input type="password" placeholder="Create a password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-inputBg border border-transparent rounded-lg px-4 py-3 focus:outline-none focus:border-black focus:bg-white transition-all shadow-sm" required />
            </div>

            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Vehicle Type *</label>
              <select value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})} className="w-full bg-inputBg border border-transparent rounded-lg px-4 py-3 focus:outline-none focus:border-black focus:bg-white transition-all shadow-sm" required>
                {vehicleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-[#333] transition-transform active:scale-[0.98] mt-6 shadow-lg disabled:opacity-50">
              {isLoading ? 'Submitting Application...' : 'Apply Now'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted">
            Already registered? <Link href="/login" className="text-black font-bold underline hover:text-gray-700">Back to Login</Link>
          </p>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-black mb-2 tracking-tight">Application Sent!</h2>
              <p className="text-muted text-sm mb-8">
                 Your request has been submitted successfully. Our team will verify your details and contact you within 24 hours.
              </p>
              
              <button onClick={handleCloseModal} className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:scale-[1.02] transition-transform">
                 Return to Login
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
