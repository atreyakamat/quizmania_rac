'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface AdminAuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(pathname !== '/login');

  const checkAuth = useCallback(async () => {
    if (pathname === '/login') {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setLoading(false);
          return;
        }
      }
      // Not authenticated - redirect to login
      setUser(null);
      setLoading(false);
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } catch {
      setUser(null);
      setLoading(false);
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router]);

  useEffect(() => {
    checkAuth();

    // Proactive background session refresh every 15 minutes to keep access token fresh
    const interval = setInterval(() => {
      if (pathname !== '/login') {
        checkAuth();
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAuth, pathname]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      router.replace('/login');
      router.refresh();
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
