"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DriverHome() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('driverToken');
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center font-sans">
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
