'use client';

import Link from 'next/link';
import { ShoppingCart, User, Menu, Search, LogOut, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/auth-store';
import { MegaMenu } from '@/components/mega-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigationLinks = [
  { name: 'Nouveautés', href: '/category/nouveautes', slug: 'nouveautes', type: null },
  { name: 'Mode', href: '/category/mode', slug: 'mode', type: 'mode' as const },
  { name: 'Les looks de Morgane', href: '/looks', slug: 'looks', type: 'morgane' as const },
  { name: 'Maison', href: '/category/maison', slug: 'maison', type: 'maison' as const },
  { name: 'Beauté', href: '/category/beaute', slug: 'beaute', type: 'beaute' as const },
  { name: 'Live & Replay', href: '/live', slug: 'live', type: null },
  { name: 'Carte cadeau', href: '/carte-cadeau', slug: 'gift', type: null },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { user, isAdmin, initialize, signOut } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b border-gray-200"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
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

          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl font-serif font-bold tracking-wider">
              LA BOUTIQUE DE <span className="text-[#d4af37]">MORGANE</span>
            </h1>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 h-full">
            {navigationLinks.map((link) => (
              <div
                key={link.name}
                className="h-full flex items-center relative"
                onMouseEnter={() => link.type && setActiveMenu(link.slug)}
              >
                <Link
                  href={link.href}
                  className={`text-sm font-medium uppercase tracking-wide transition-colors duration-200 border-b-2 border-transparent py-2
                    ${activeMenu === link.slug ? 'text-[#d4af37] border-[#d4af37]' : 'text-gray-900 hover:text-[#d4af37]'}
                  `}
                >
                  {link.name}
                </Link>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hover:text-[#d4af37]">
              <Search className="h-5 w-5" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:text-[#d4af37]">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center text-[#d4af37]">
                          <Shield className="mr-2 h-4 w-4" />
                          Administration
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/account">Mon espace</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders">Mes commandes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist">Ma liste de souhaits</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-600 flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button variant="ghost" size="icon" className="hover:text-[#d4af37]">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="hover:text-[#d4af37]">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {navigationLinks.map((link) => (
        link.type && (
          <div
            key={`${link.slug}-menu`}
            onMouseEnter={() => setActiveMenu(link.slug)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <MegaMenu
              isOpen={activeMenu === link.slug}
              type={link.type}
              categorySlug={link.slug}
              onClose={() => setActiveMenu(null)}
            />
          </div>
        )
      ))}
    </header>
  );
}
