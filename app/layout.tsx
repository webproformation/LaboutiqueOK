import './globals.css';
import type { Metadata } from 'next';
import { Pangolin } from 'next/font/google';
import { LayoutWrapper } from '@/components/layout-wrapper';

const pangolin = Pangolin({ weight: '400', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'La Boutique de Morgane',
  description: 'La boutique mode et lifestyle de Morgane',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={pangolin.className}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
