import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

// --- 1. LES PROVIDERS (Le Moteur) ---
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { LiveProductOverlay } from '@/components/LiveProductOverlay';

// --- 2. LE WRAPPER (La Carrosserie : Menu + Footer) ---
import { LayoutWrapper } from '@/components/layout-wrapper'; 
// (Si ce fichier n'existe plus, dites-le moi, on utilisera SiteHeader directement)

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'La Boutique de Morgane',
  description: 'Vêtements et accessoires tendance pour femmes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // --- 3. SÉCURITÉ ANTI-IMPAYÉ ---
  const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

  if (isProduction) {
    return (
      <html lang="fr">
        <body style={{ backgroundColor: 'white' }}>
          {/* Site désactivé en production */}
        </body>
      </html>
    );
  }
  // -------------------------------

  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              
              {/* On remet le Wrapper ici pour afficher le Menu et le Footer */}
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              
              {/* Les éléments flottants (Popup, Notifications) */}
              <LiveProductOverlay />
              <Toaster />

            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
