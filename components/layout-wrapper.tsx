'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from 'sonner';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAdminPage = pathname?.startsWith('/admin');
  const isMaintenancePage = pathname === '/maintenance';

  const showHeaderFooter = !isAdminPage && !isMaintenancePage;

  return (
    <>
      {showHeaderFooter && <SiteHeader />}
      {children}
      {showHeaderFooter && <SiteFooter />}
      <Toaster position="top-right" richColors />
    </>
  );
}
