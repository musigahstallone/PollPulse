'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getProfile } from '@/lib/api';
import type { UserProfile } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      const profile = await getProfile(authToken);
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch user profile, logging out.', error);
      setToken(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('token');
      }
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      let storedToken: string | null = null;
      try {
        // Use sessionStorage instead of localStorage
        storedToken = sessionStorage.getItem('token');
      } catch (e) {
        console.error("Could not access sessionStorage. Auth will not persist.", e)
      }
      
      if (storedToken) {
        setToken(storedToken);
        await fetchUser(storedToken);
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchUser]);

  const login = async (newToken: string) => {
    sessionStorage.setItem('token', newToken);
    setToken(newToken);
    setIsLoading(true);
    await fetchUser(newToken);
    setIsLoading(false);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = { user, token, isAuthenticated: !!token, isLoading, login, logout };

  if (value.isLoading && !value.isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner text="Initializing..."/>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
