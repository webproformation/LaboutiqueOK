'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAdminPage = pathname?.startsWith('/admin');
  const isMaintenancePage = pathname === '/maintenance';

  const showHeaderFooter = !isAdminPage && !isMaintenancePage;

  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          {showHeaderFooter && <SiteHeader />}
          {children}
          {showHeaderFooter && <SiteFooter />}
          <Toaster position="top-right" richColors />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
