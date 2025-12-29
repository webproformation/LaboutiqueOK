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

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const response = await fetch('/api/admin/get-user-role', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        console.log('[useAdmin] Query result:', result);
        console.log('[useAdmin] Is admin?', result.role === 'admin');

        setIsAdmin(result.role === 'admin');
      } catch (error) {
        console.error('[useAdmin] ERROR:', error);
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
}
