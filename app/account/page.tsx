'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Package, 
  MapPin, 
  LogOut, 
  Loader2, 
  Heart,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- CORRECTION DES IMPORTS ICI ---
// On cherche directement dans @/components/ au lieu de @/components/account/
import { AddressBook } from '@/components/address-book';
import { OrderHistory } from '@/components/order-history';
import { PersonalInfo } from '@/components/personal-info';
import { WishlistGrid } from '@/components/WishlistGrid';
import { AdminInvoiceGenerator } from '@/components/AdminInvoiceGenerator';
// ----------------------------------

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    } else {
      checkAdmin();
    }
  }, [user, router]);

  const checkAdmin = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (data) setIsAdmin(data.is_admin);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mon Compte</h1>
            <p className="text-gray-500 mt-1">Ravi de vous revoir, {user.user_metadata?.first_name || 'Client'} !</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        <Tabs defaultValue="orders" className="space-y-8">
          <TabsList className="bg-white p-1 rounded-xl border shadow-sm w-full flex flex-wrap justify-start h-auto gap-2">
            
            {/* Lien Admin (Visible uniquement si Admin) */}
            {isAdmin && (
              <TabsTrigger value="admin_invoices" className="flex-1 min-w-[120px] data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white rounded-lg">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Facturation
              </TabsTrigger>
            )}

            <TabsTrigger value="orders" className="flex-1 min-w-[120px] data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white rounded-lg">
              <Package className="h-4 w-4 mr-2" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="info" className="flex-1 min-w-[120px] data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white rounded-lg">
              <User className="h-4 w-4 mr-2" />
              Infos
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex-1 min-w-[120px] data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white rounded-lg">
              <MapPin className="h-4 w-4 mr-2" />
              Adresses
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex-1 min-w-[120px] data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white rounded-lg">
              <Heart className="h-4 w-4 mr-2" />
              Mes Pépites
            </TabsTrigger>
          </TabsList>

          {/* Contenu Admin */}
          {isAdmin && (
            <TabsContent value="admin_invoices" className="focus-visible:outline-none">
              <AdminInvoiceGenerator />
            </TabsContent>
          )}

          <TabsContent value="orders" className="focus-visible:outline-none">
            <OrderHistory />
          </TabsContent>

          <TabsContent value="info" className="focus-visible:outline-none">
            <PersonalInfo />
          </TabsContent>

          <TabsContent value="addresses" className="focus-visible:outline-none">
            <AddressBook />
          </TabsContent>

          <TabsContent value="wishlist" className="focus-visible:outline-none">
            <WishlistGrid />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}