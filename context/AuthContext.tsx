'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
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
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          setUser(session?.user ?? null);

          if (session?.user) {
            await loadProfile(session.user.id);
          } else {
            setProfile(null);
          }

          setLoading(false);
        })();
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

      toast.success('Bienvenue !', {
        position: 'bottom-right',
      });

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) return { error: authError };
      if (!authData.user) return { error: { message: 'Erreur lors de la connexion' } as AuthError };

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
      const { error } = await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) return { error };

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
