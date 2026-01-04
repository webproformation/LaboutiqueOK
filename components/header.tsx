'use client';

import Link from 'next/link';
import { ShoppingCart, User, Menu, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigationLinks = [
  { name: 'Nouveautés', href: '/nouveautes' },
  { name: 'Mode', href: '/categorie/mode' },
  { name: 'Les looks de Morgane', href: '/looks' },
  { name: 'Maison', href: '/categorie/maison' },
  { name: 'Beauté', href: '/categorie/beaute' },
  { name: 'Live & Replay', href: '/live' },
  { name: 'Carte cadeau', href: '/carte-cadeau' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <nav className="flex flex-col gap-4 mt-8">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg hover:text-[#D4AF37] transition-smooth"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-black">
              La Boutique de <span className="text-[#D4AF37]">Morgane</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm hover:text-[#D4AF37] transition-smooth"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:text-[#D4AF37]">
              <Search className="h-5 w-5" />
            </Button>
            <Link href="/compte">
              <Button variant="ghost" size="icon" className="hover:text-[#D4AF37]">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/panier">
              <Button variant="ghost" size="icon" className="hover:text-[#D4AF37]">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
