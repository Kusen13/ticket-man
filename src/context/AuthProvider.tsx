import React, { useState, useEffect, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from '../supabaseClient';
import { User } from '../types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const authCheckRef = { current: false };

    const initializeAuth = async () => {
      try {
        if (!authCheckRef.current) {
          setIsLoading(true);
        }

        // Cache check
        const cachedUser = localStorage.getItem('ticketman_user');
        if (cachedUser && isMounted) {
          try {
            const parsed = JSON.parse(cachedUser);
            if (parsed?.approvalStatus === 'APPROVED') setUser(parsed);
          } catch (e) {
            localStorage.removeItem('ticketman_user');
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          await fetchProfile(session.user);
        } else if (isMounted) {
          localStorage.removeItem('ticketman_user');
          setUser(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          authCheckRef.current = true;
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (session) {
        await fetchProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('ticketman_user');
        setUser(null);
        setIsLoading(false);
      }
    });

    const handleFocus = async () => {
      if (!isMounted) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        await fetchProfile(session.user);
      } else if (!session && isMounted) {
        setUser(null);
        localStorage.removeItem('ticketman_user');
      }
    };

    window.addEventListener('focus', handleFocus);
    const safety = setTimeout(() => isMounted && setIsLoading(false), 8000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      clearTimeout(safety);
    };
  }, []);

  const fetchProfile = async (authUser: any) => {
    if (!authUser) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!error && data) {
        const mappedUser: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as any,
          departmentId: data.department_id,
          avatar: data.avatar || authUser.user_metadata?.avatar_url,
          isOnline: data.is_online,
          status: data.status,
          approvalStatus: data.approval_status as any,
          lastActive: data.last_active,
          createdAt: data.created_at,
        };
        setUser(mappedUser);
        localStorage.setItem('ticketman_user', JSON.stringify(mappedUser));
      } else if (error && error.code === 'PGRST116') {
        // Fallback for new signups
        const fallback: User = {
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          role: authUser.user_metadata?.role || 'EMPLOYEE',
          departmentId: undefined,
          isOnline: true,
          status: 'online',
          approvalStatus: 'PENDING',
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        setUser(fallback);
        // Don't cache pending users to force refresh on next login
        localStorage.removeItem('ticketman_user');
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error('Password required');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password?: string, metadata?: any) => {
    if (!password) throw new Error('Password required');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
  };

  const loginWithProvider = async (provider: 'google' | 'microsoft') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider === 'microsoft' ? 'azure' : 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  };

  const logout = async () => {
    try {
      setUser(null);
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
      // Ensure user is null even if network fails
      setUser(null);
    }
  };

  const contextValue = useMemo(() => ({
    user,
    login,
    signup,
    loginWithProvider,
    logout,
    isLoading,
    refreshProfile: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await fetchProfile(session.user);
    }
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
