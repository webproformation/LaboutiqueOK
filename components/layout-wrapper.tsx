'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { useAuthStore } from '@/stores/auth-store';
import { OpenPackageBanner } from '@/components/OpenPackageBanner';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const isAdminPage = pathname?.startsWith('/admin');
  const isMaintenancePage = pathname === '/maintenance';

  const showHeaderFooter = !isAdminPage && !isMaintenancePage;

  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          {showHeaderFooter && (
            <>
              <OpenPackageBanner />
              <SiteHeader />
            </>
          )}
          {children}
          {showHeaderFooter && <SiteFooter />}
          <Toaster position="bottom-right" richColors />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
