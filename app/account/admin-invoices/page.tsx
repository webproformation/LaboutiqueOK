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
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user?.id).single();
    if (data?.is_admin) setIsAdmin(true);
    else router.push('/account'); // Redirection si pas admin
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminInvoiceGenerator />
    </div>
  );
}