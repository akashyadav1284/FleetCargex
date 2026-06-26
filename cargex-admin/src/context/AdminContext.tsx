"use client";

import { createContext, useContext } from 'react';

export type AdminContextType = {
  adminData: any;
  fetchOpts: (opts?: RequestInit) => RequestInit;
  handleLogout: () => void;
};

export const AdminContext = createContext<AdminContextType | null>(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminContext.Provider');
  }
  return context;
};
