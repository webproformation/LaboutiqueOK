'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  User,
  Package,
  Clock,
  MapPin,
  Ruler,
  PackageX,
  MessageSquare,
  Ticket,
  Wallet,
  Users,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function AccountNav() {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="space-y-2">
      {profile?.is_admin && (
        <Link
          href="/admin"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            pathname.startsWith('/admin')
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          )}
        >
          <Shield className="h-5 w-5" />
          <span className="font-semibold">Administration</span>
        </Link>
      )}

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              isActive
                ? 'bg-[#b8933d] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}

      <Button
        variant="ghost"
        onClick={handleSignOut}
        className="w-full justify-start gap-3 px-4 py-3 h-auto hover:bg-pink-50 hover:text-[#DF30CF]"
      >
        <LogOut className="h-5 w-5" />
        <span className="font-medium">Déconnexion</span>
      </Button>
    </nav>
  );
}
