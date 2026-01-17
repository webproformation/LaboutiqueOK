'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { AdminInvoiceGenerator } from '@/components/AdminInvoiceGenerator';

export default function AdminInvoicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    const checkAdmin = async () => {
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (data?.is_admin) setIsAdmin(true);
      else router.push('/account');
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Générateur de Factures</h2>
        <p className="text-gray-500">Espace réservé à l'administration.</p>
      </div>
      <AdminInvoiceGenerator />
    </div>
  );
}