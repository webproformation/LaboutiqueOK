"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, MapPin, LogOut, Clock, Wallet, Ticket, Ruler, Users, PackageX, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AccountNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
  };

  const navItems = [
    { href: '/account', label: 'Mon profil', icon: User },
    { href: '/account/orders', label: 'Mes commandes', icon: Package },
    { href: '/account/pending-deliveries', label: 'Mon colis ouvert', icon: Clock },
    { href: '/account/addresses', label: 'Mes adresses', icon: MapPin },
    { href: '/account/measurements', label: 'Mes mensurations', icon: Ruler },
    { href: '/account/returns-management', label: 'Mes retours', icon: PackageX },
    { href: '/account/reviews', label: 'Mes avis', icon: MessageSquare },
    { href: '/account/coupons', label: 'Mes coupons', icon: Ticket },
    { href: '/account/loyalty', label: 'Ma Cagnotte Fidélité', icon: Wallet },
    { href: '/account/referral', label: 'Parrainage', icon: Users },
  ];

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-[#b8933d] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
      <Button
        onClick={handleSignOut}
        variant="ghost"
        className="w-full justify-start text-gray-700 hover:bg-pink-50 hover:text-[#DF30CF]"
      >
        <LogOut className="h-5 w-5 mr-3" />
        <span className="font-medium">Déconnexion</span>
      </Button>
    </nav>
  );
}
