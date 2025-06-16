import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/auth';
import bcrypt from 'bcryptjs';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Get user with password hash
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Get user roles with related data
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          is_active,
          role:roles(*),
          company:companies(*),
          site:sites(*)
        `)
        .eq('user_id', userData.id)
        .eq('is_active', true);

      if (rolesError) {
        throw new Error('Failed to fetch user roles');
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        is_active: userData.is_active,
        roles: userRoles || []
      };

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'login',
        resource_type: 'auth',
        details: { email }
      });

    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (user) {
      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'logout',
        resource_type: 'auth'
      });
    }

    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}