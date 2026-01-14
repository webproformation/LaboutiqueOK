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
import { TopInfoBanner } from '@/components/TopInfoBanner';
import { AdminBanner } from '@/components/AdminBanner';
import { CookieConsent } from '@/components/CookieConsent';
import { FloatingButtons } from '@/components/FloatingButtons';
import { LoyaltyBanner } from '@/components/LoyaltyBanner';

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
          {!isAdminPage && <AdminBanner />}
          {!isAdminPage && <TopInfoBanner />}
          {showHeaderFooter && (
            <>
              <SiteHeader />
              <LoyaltyBanner />
            </>
          )}
          {children}
          {showHeaderFooter && <SiteFooter />}
          {!isAdminPage && <CookieConsent />}
          {!isAdminPage && <FloatingButtons />}
          <Toaster
            position="bottom-right"
            richColors
            toastOptions={{
              style: {
                marginBottom: '80px',
                marginRight: '8px',
              }
            }}
          />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
