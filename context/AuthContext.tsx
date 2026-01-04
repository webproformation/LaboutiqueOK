"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import { clearSupabaseAuth, isAuthError } from '@/lib/auth-cleanup';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
  birth_date: string | null;
  wallet_balance: number;
  is_admin: boolean;
  blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
  cancelled_orders_count: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string, birthDate?: string | null, referralCode?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);

          if (isAuthError(error)) {
            console.log('Auth error detected, clearing localStorage');
            clearSupabaseAuth();
          }

          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setProfile(null);
        } else if (event === 'USER_UPDATED') {
          if (session?.user) {
            setUser(session.user);
            await loadProfile(session.user.id);
          }
        }

        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Load profile error:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Exception loading profile:', error);
    }
  };

  const claimPendingPrize = async (userId: string) => {
    const sessionId = localStorage.getItem('scratch_game_session_id');
    const pendingPrize = localStorage.getItem('pending_prize');

    if (!sessionId || !pendingPrize) return;

    try {
      const { prize } = JSON.parse(pendingPrize);

      const { data: pendingPrizeData } = await supabase
        .from('pending_prizes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('claimed', false)
        .maybeSingle();

      if (pendingPrizeData && pendingPrizeData.result === 'win' && pendingPrizeData.prize_type_id) {
        const uniqueCode = `${prize.code}-${userId.substring(0, 8)}-${Date.now()}`;

        await supabase
          .from('user_coupons')
          .insert({
            user_id: userId,
            coupon_type_id: pendingPrizeData.prize_type_id,
            code: uniqueCode,
            source: 'scratch_game',
            valid_until: prize.valid_until || '2026-02-01 23:59:59+00',
          });

        await supabase
          .from('pending_prizes')
          .update({
            claimed: true,
            claimed_by: userId,
            claimed_at: new Date().toISOString(),
          })
          .eq('id', pendingPrizeData.id);

        localStorage.removeItem('pending_prize');
      }
    } catch (error) {
      console.error('Error claiming pending prize:', error);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    birthDate?: string | null,
    referralCode?: string
  ) => {
    try {
      // 1. CRÉER COMPTE SUPABASE AUTH
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone?.trim() || '',
            birth_date: birthDate || null,
          },
        },
      });

      if (authError) return { error: authError };
      if (!authData.user) return { error: { message: 'User creation failed' } as AuthError };

      // 2. CRÉER PROFIL DIRECT DANS PROFILES
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone?.trim() || '',
          birth_date: birthDate || null,
          wallet_balance: 0,
          is_admin: false,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Ne pas bloquer si le profil existe déjà
        if (!profileError.message.includes('duplicate')) {
          return { error: { message: 'Profile creation failed' } as AuthError };
        }
      }

      // 3. CHARGER LE PROFIL
      setUser(authData.user);
      await loadProfile(authData.user.id);

      // 4. GÉRER LE PRIX EN ATTENTE
      await claimPendingPrize(authData.user.id);

      // 5. TRAITER LE CODE PARRAINAGE
      if (referralCode && referralCode.trim()) {
        try {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id, first_name')
            .eq('id', referralCode.trim())
            .maybeSingle();

          if (referrer) {
            await supabase
              .from('referrals')
              .insert({
                referrer_id: referrer.id,
                referred_id: authData.user.id,
                status: 'pending',
              });
          }
        } catch (referralError) {
          console.error('Referral error:', referralError);
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return { error: { message: 'An unexpected error occurred' } as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // 1. CONNEXION SUPABASE AUTH
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) return { error: authError };
      if (!authData.user) return { error: { message: 'Sign in failed' } as AuthError };

      // 2. CHARGER LE PROFIL
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      // 3. CRÉER PROFIL SI MANQUANT (MIGRATION AUTO)
      if (!profileData) {
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email || email.trim(),
            first_name: authData.user.user_metadata?.first_name || '',
            last_name: authData.user.user_metadata?.last_name || '',
            phone: authData.user.user_metadata?.phone || '',
            birth_date: authData.user.user_metadata?.birth_date || null,
            wallet_balance: 0,
            is_admin: false,
          });

        if (!createProfileError) {
          await loadProfile(authData.user.id);
        }
      } else {
        // 4. VÉRIFIER SI BLOQUÉ
        if (profileData.blocked) {
          await supabase.auth.signOut();
          return { error: { message: 'Votre compte a été suspendu. Contactez le service client.' } as AuthError };
        }

        setProfile(profileData);
      }

      // 5. GÉRER LE PRIX EN ATTENTE
      await claimPendingPrize(authData.user.id);

      setUser(authData.user);

      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: { message: 'An unexpected error occurred' } as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) return { error };

      // Recharger le profil
      await loadProfile(user.id);

      return { error: null };
    } catch (err) {
      console.error('Update profile error:', err);
      return { error: err };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, resetPassword, updatePassword }}>
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
