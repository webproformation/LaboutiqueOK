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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.is_admin) setIsAdmin(true);
        else router.push('/account');
        setLoading(false);
      });
  }, [user, router]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#D4AF37]" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Administration Factures</h2>
      <AdminInvoiceGenerator />
    </div>
  );
}