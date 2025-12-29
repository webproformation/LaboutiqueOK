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
        // Récupérer la session pour avoir accès au JWT complet
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('[useAdmin] Pas de session');
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Vérifier le rôle directement dans le JWT (ne passe pas par PostgREST)
        const appMetadata = session.user.app_metadata || {};
        const userMetadata = session.user.user_metadata || {};

        console.log('[useAdmin] App metadata:', appMetadata);
        console.log('[useAdmin] User metadata:', userMetadata);

        // Vérifier le rôle dans app_metadata et user_metadata
        const roleFromAppMeta = appMetadata.role;
        const roleFromUserMeta = userMetadata.role;
        const isAdminFromMeta = appMetadata.is_admin === true;

        const isAdminUser = roleFromAppMeta === 'admin' || roleFromUserMeta === 'admin' || isAdminFromMeta;

        console.log('[useAdmin] Role from app_metadata:', roleFromAppMeta);
        console.log('[useAdmin] Role from user_metadata:', roleFromUserMeta);
        console.log('[useAdmin] is_admin flag:', isAdminFromMeta);
        console.log('[useAdmin] Final is admin?', isAdminUser);

        setIsAdmin(isAdminUser);
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
