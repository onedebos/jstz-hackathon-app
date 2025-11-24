'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  created_at: string;
  last_seen_at: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (name: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUserId = localStorage.getItem('jstz_user_id');
    if (storedUserId) {
      loadUser(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setUser(data);
        // Update last_seen_at
        await supabase
          .from('users')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('jstz_user_id');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(name: string) {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Name cannot be empty');
      }

      // Try to find existing user
      const { data: existingUsers, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('name', trimmedName)
        .limit(1);

      if (searchError) throw searchError;

      let userData: User;

      if (existingUsers && existingUsers.length > 0) {
        // User exists, use it
        userData = existingUsers[0];
      } else {
        // Create new user
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({ name: trimmedName })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            // Unique constraint violation - name already exists (race condition)
            throw new Error('This name is already taken. Please choose another.');
          }
          throw error;
        }
        userData = newUser;
      }

      // Update last_seen_at
      await supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userData.id);

      setUser(userData);
      localStorage.setItem('jstz_user_id', userData.id);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation - name already exists
        throw new Error('This name is already taken. Please choose another.');
      }
      throw error;
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('jstz_user_id');
  }

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

