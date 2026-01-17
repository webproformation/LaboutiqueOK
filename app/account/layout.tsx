'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, User, Package, MapPin, Heart, LogOut, Shield, Ruler, Gift, Ticket, PackageOpen, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Liste de base (sans l'admin)
const baseNavItems = [
  { href: '/account', label: 'Mon profil', icon: User },
  { href: '/account/orders', label: 'Mes commandes', icon: Package },
  { href: '/account/coupons', label: 'Mes coupons', icon: Ticket },
  { href: '/account/gift-cards', label: 'Mes cartes cadeaux', icon: CreditCard },
  { href: '/account/my-packages', label: 'Mes colis ouverts', icon: PackageOpen },
  { href: '/account/addresses', label: 'Mes adresses', icon: MapPin },
  { href: '/account/measurements', label: 'Mes mensurations', icon: Ruler },
  { href: '/account/referral', label: 'Code parrainage', icon: Gift },
  { href: '/wishlist', label: 'Ma liste de souhaits', icon: Heart },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/account');
    if (user) checkAdmin();
  }, [user, loading, router]);

  const checkAdmin = async () => {
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user?.id).single();
    if (data?.is_admin) setIsAdmin(true);
  };

  const handleSignOut = async () => { await signOut(); router.push('/'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>;
  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bienvenue, {profile.first_name || 'cher client'}!</h1>
          <p className="text-gray-600">Gérez votre compte et vos commandes</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <nav className="space-y-2">
                
                {/* Lien Admin global (reste en haut) */}
                {profile.is_admin && (
                  <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white hover:from-[#9a7a2f] hover:to-[#b8933d] mb-4">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">Administration Site</span>
                  </Link>
                )}

                {baseNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  // LOGIQUE DU LIEN SECRET : Si c'est "Mon profil" ET qu'on est Admin
                  const isProfileItem = item.href === '/account';
                  
                  if (isProfileItem && isAdmin) {
                    return (
                      <div key={item.href} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group', isActive ? 'bg-[#D4AF37] text-white' : 'text-gray-700 hover:bg-gray-100')}>
                        {/* L'icône devient le lien secret vers les factures */}
                        <Link 
                          href="/account/admin-invoices" 
                          title="Accès Facturation Admin" 
                          className="hover:scale-110 hover:text-[#D4AF37] transition-all p-1 -ml-1 cursor-pointer"
                        >
                          <Icon className="h-5 w-5" />
                        </Link>
                        {/* Le texte reste le lien vers le profil standard */}
                        <Link href={item.href} className="font-medium flex-1 cursor-pointer">
                          {item.label}
                        </Link>
                      </div>
                    );
                  }

                  // Affichage standard pour tous les autres liens
                  return (
                    <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg transition-colors', isActive ? 'bg-[#D4AF37] text-white' : 'text-gray-700 hover:bg-gray-100')}>
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}

                <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-3 px-4 py-3 h-auto hover:bg-red-50 hover:text-red-600">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Déconnexion</span>
                </Button>
              </nav>
            </div>
          </aside>
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}