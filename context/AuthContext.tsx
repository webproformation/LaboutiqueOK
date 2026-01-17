'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
  birth_date: string | null;
  user_size: number | null;
  wallet_balance: number;
  loyalty_points: number;
  loyalty_euros: number;
  current_tier: number;
  tier_multiplier: number;
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
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    birthDate?: string | null
  ) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingProfileRef = useRef(false);
  const initializedRef = useRef(false);

  const checkDailyLogin = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const lastLoginKey = `daily_login_${userId}`;
    const lastLogin = localStorage.getItem(lastLoginKey);

    if (lastLogin === today) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('add_loyalty_gain', {
        p_user_id: userId,
        p_type: 'daily_login',
        p_base_amount: 0.10,
        p_description: 'Connexion quotidienne'
      });

      if (error) throw error;

      if (data) {
        const result = typeof data === 'string' ? JSON.parse(data) : data;
        const multiplierText = result.multiplier > 1 ? ` (x${result.multiplier})` : '';

        toast.success(result.message + multiplierText, {
          position: 'bottom-right',
          duration: 5000,
        });

        localStorage.setItem(lastLoginKey, today);
      }
    } catch (error) {
      console.error('Error checking daily login:', error);
    }
  };

  const loadProfile = async (userId: string, force = false) => {
    if (loadingProfileRef.current && !force) {
      return;
    }

    loadingProfileRef.current = true;
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (profileData) {
        setProfile(profileData);

        if (profileData.blocked) {
          let message = 'Votre compte a été suspendu.';
          if (profileData.blocked_reason) {
            message += ` Raison: ${profileData.blocked_reason}`;
          }
          message += ' Contactez le service client.';
          toast.error(message);
          await signOut();
          return;
        }

        await checkDailyLogin(userId);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      loadingProfileRef.current = false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      }

      initializedRef.current = true;
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!initializedRef.current) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            loadProfile(session.user.id);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    birthDate?: string | null
  ): Promise<{ error: AuthError | null }> => {
    try {
      if (!email || !password || !firstName || !lastName) {
        return { error: { message: 'Tous les champs obligatoires doivent être remplis' } as AuthError };
      }

      if (password.length < 8) {
        return { error: { message: 'Le mot de passe doit contenir au moins 8 caractères' } as AuthError };
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone || '',
            birth_date: birthDate || null,
          },
        },
      });

      if (authError) return { error: authError };
      if (!authData.user) return { error: { message: 'Erreur lors de la création du compte' } as AuthError };

      await new Promise(resolve => setTimeout(resolve, 1000));

      await loadProfile(authData.user.id);

      toast.success('Bienvenue ! 5€ ont été crédités sur votre cagnotte.', {
        position: 'bottom-right',
        duration: 5000,
      });

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('[AuthContext] Appel signInWithPassword...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('[AuthContext] Erreur Supabase Auth:', {
          message: authError.message,
          status: (authError as any).status,
          code: (authError as any).code
        });
        return { error: authError };
      }

      if (!authData.user) {
        console.error('[AuthContext] Pas de user retourné');
        return { error: { message: 'Erreur lors de la connexion' } as AuthError };
      }

      console.log('[AuthContext] Authentification réussie, ID:', authData.user.id);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
      }

      if (profileData) {
        setProfile(profileData);

        if (profileData.blocked) {
          let message = 'Votre compte a été suspendu.';
          if (profileData.blocked_reason) {
            message += ` Raison: ${profileData.blocked_reason}`;
          }
          message += ' Contactez le service client.';
          toast.error(message);
          await signOut();
          return { error: { message } as AuthError };
        }
      } else {
        await loadProfile(authData.user.id);
      }

      toast.success('Bienvenue !', {
        position: 'bottom-right',
      });

      return { error: null };
    } catch (error) {
      console.error('Signin error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>): Promise<{ error: any }> => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      // Ne garder que les champs modifiables par l'utilisateur
      const allowedFields: (keyof Profile)[] = [
        'first_name',
        'last_name',
        'phone',
        'avatar_url',
        'birth_date'
      ];

      const updateData: any = {};

      // Filtrer pour ne garder que les champs autorisés
      allowedFields.forEach(field => {
        if (field in data) {
          updateData[field] = data[field];
        }
      });

      console.log('📦 PAYLOAD ENVOYÉ À SUPABASE:', JSON.stringify(updateData, null, 2));

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('❌ ERREUR SUPABASE:', error);
        return { error };
      }

      await loadProfile(user.id);

      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as AuthError };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error as AuthError };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id, true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
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
