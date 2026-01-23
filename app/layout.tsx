// ... imports
import { LiveProductOverlay } from '@/components/LiveProductOverlay';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <CartProvider>
            {/* ... votre header ... */}
            {children}
            {/* ... votre footer ... */}
            
            {/* AJOUTER CECI ICI : */}
            <LiveProductOverlay />
            
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}