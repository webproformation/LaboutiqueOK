import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

// --- CES LIGNES SONT INDISPENSABLES ---
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
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
        <AuthProvider>
          <CartProvider>
            {children}
            <LiveProductOverlay />
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
