import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // On garde Inter (plus moderne) ou remettez Pangolin si vous préférez
import { Toaster } from 'sonner';

// --- TOUS LES PROVIDERS NÉCESSAIRES ---
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext'; // <--- C'EST LUI QUI MANQUAIT !
import { LiveProductOverlay } from '@/components/LiveProductOverlay';
// --------------------------------------

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
  return (
    <html lang="fr">
      <body className={inter.className}>
        {/* On empile les Providers pour que tout soit accessible partout */}
        <AuthProvider>
          <CartProvider>
            <WishlistProvider> {/* Le nouveau Provider ajouté */}
              
              {children}
              
              {/* Les composants globaux */}
              <LiveProductOverlay />
              <Toaster />

            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
