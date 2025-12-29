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

      const { data, error } = await supabase.rpc('get_user_role_direct', {
        p_user_id: user.id
      });

      if (error) {
        console.error('[useAdmin] ERROR:', error);
        console.error('[useAdmin] Error details:', JSON.stringify(error, null, 2));
      }

      console.log('[useAdmin] Query result:', { data, error });
      console.log('[useAdmin] Is admin?', data === 'admin');

      setIsAdmin(data === 'admin');
      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
}
