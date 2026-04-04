"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensures HTTP-Only cookies are received and sent
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminData', JSON.stringify(data));
        router.push('/dashboard');
      } else {
        setErrorMsg(data.message || 'Invalid credentials.');
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-accent text-2xl font-black">C</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Cargex Admin</h1>
          <p className="text-muted text-sm mt-2">Internal Management Portal</p>
        </div>

        {errorMsg && <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm mb-6 font-medium">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Email</label>
            <input type="email" placeholder="admin@cargex.com" value={email} onChange={e => setEmail(e.target.value)} className="input-field py-4" required />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="input-field py-4" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all active:scale-[0.98] mt-4 shadow-lg shadow-accent/20 disabled:opacity-50">
            {isLoading ? 'Authenticating...' : 'Access Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
