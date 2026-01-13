import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  wallet_balance: number;
  loyalty_points: number;
  loyalty_euros: number;
  current_tier: number;
  tier_multiplier: number;
  created_at: string;
  is_admin?: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  checkAdmin: () => Promise<void>;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile, isAdmin: profile?.is_admin || false }),

  checkAdmin: async () => {
    const { user } = get();
    if (!user) {
      set({ isAdmin: false });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    set({ isAdmin: profile?.is_admin || false });
  },

  initialize: async () => {
    set({ isLoading: true });

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      set({ user: session.user });

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        set({ profile, isAdmin: profile.is_admin || false });
      }
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({ user: session.user });

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          set({ profile, isAdmin: profile.is_admin || false });
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, isAdmin: false });
      }
    });

    set({ isLoading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, isAdmin: false });
  },
}));
