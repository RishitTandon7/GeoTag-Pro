import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { supabase } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthUser extends User {
  profile?: Profile;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  hasSubscription: () => boolean;
  isFriend: () => boolean;
  isPremium: () => boolean;
  refreshUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => {
    console.log('Auth Store: Setting user', user ? 'User ID: ' + user.id : 'to null');
    set({ user });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  hasSubscription: () => {
    const { user } = get();
    return user?.profile?.subscription_tier !== 'free' && 
           user?.profile?.subscription_status === 'active';
  },
  isFriend: () => {
    const { user } = get();
    return user?.profile?.subscription_tier === 'friend' && 
           user?.profile?.subscription_status === 'active';
  },
  isPremium: () => {
    const { user } = get();
    return user?.profile?.subscription_tier === 'premium' && 
           user?.profile?.subscription_status === 'active';
  },
  refreshUserProfile: async () => {
    const { user, setUser } = get();
    if (!user) return;

    try {
      console.log('Refreshing user profile for ID:', user.id);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile in refreshUserProfile:', error);
        throw error;
      }

      console.log('Profile data refreshed:', profileData);
      
      set({
        user: {
          ...user,
          profile: profileData
        }
      });
      
      return profileData;
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      throw error;
    }
  }
}));