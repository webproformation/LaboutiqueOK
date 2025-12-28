import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log('[useAdmin] Checking admin status for user:', user.id);
      console.log('[useAdmin] User email:', user.email);

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useAdmin] ERROR:', error);
        console.error('[useAdmin] Error details:', JSON.stringify(error, null, 2));
      }

      console.log('[useAdmin] Query result:', { data, error });
      console.log('[useAdmin] Is admin?', data?.role === 'admin');

      setIsAdmin(data?.role === 'admin');
      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
}
