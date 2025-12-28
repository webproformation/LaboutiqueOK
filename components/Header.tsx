"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Search, Heart, User, Menu, X, Package, MapPin, LogOut, Shield, Settings } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MegaMenu from '@/components/MegaMenu';
import MobileMenu from '@/components/MobileMenu';
import { DeliveryBatchBanner } from '@/components/DeliveryBatchBanner';
import ProductSearch from '@/components/ProductSearch';
import { toast } from 'sonner';

export default function Header() {
  const { cartItemCount } = useCart();
  const { wishlistItems } = useWishlist();
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
  };

  const navigation = [
    { name: 'Nouveautés', href: '/category/nouveautes', hasMegaMenu: false },
    { name: 'Mode', href: '/category/mode', hasMegaMenu: true },
    { name: 'Les looks de Morgane', href: '/les-looks-de-morgane', hasMegaMenu: true },
    { name: 'Maison', href: '/category/maison', hasMegaMenu: true },
    { name: 'Beauté et Senteurs', href: '/category/beaute-senteurs', hasMegaMenu: true },
    { name: 'Bonnes affaires', href: '/category/bonnes-affaires', hasMegaMenu: false },
    { name: 'Live & Replay', href: '/live', hasMegaMenu: false },
    { name: 'Carte cadeau', href: '/carte-cadeau', hasMegaMenu: false },
    { name: 'Le carnet de Morgane', href: '/actualites', hasMegaMenu: false },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleMenuEnter = (itemName: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setMegaMenuOpen(true);
    setActiveMenuItem(itemName);
  };

  const handleMenuLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
      setActiveMenuItem(null);
    }, 300);
  };

  const handleMegaMenuEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMegaMenuLeave = () => {
    setMegaMenuOpen(false);
    setActiveMenuItem(null);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <DeliveryBatchBanner />
      <header className="sticky top-0 z-50 w-full bg-black shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto bg-black text-white">
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                <MobileMenu onLinkClick={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex-shrink-0">
              <img
                src="/image copy.png"
                alt="La Boutique De Morgane"
                className="h-12 w-auto md:h-16 object-contain"
              />
            </Link>

            <nav className="hidden md:flex items-center justify-center gap-3 lg:gap-4 flex-1">
              {navigation.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => {
                    if (item.hasMegaMenu) {
                      handleMenuEnter(item.name);
                    }
                  }}
                  onMouseLeave={() => {
                    if (item.hasMegaMenu) {
                      handleMenuLeave();
                    }
                  }}
                >
                  <Link
                    href={item.href}
                    className={`text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive(item.href)
                        ? 'text-[#D4AF37]'
                        : 'text-white hover:text-[#D4AF37]'
                    }`}
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:block group"
              >
                <Search className="h-5 w-5 text-white group-hover:text-[#D4AF37] transition-colors" />
              </button>
              <Link href="/wishlist" className="relative hidden md:block group">
                <Heart className="h-5 w-5 text-white group-hover:text-[#D4AF37] transition-colors" />
                {wishlistItems.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#D4AF37] hover:bg-[#b8933d] border-none"
                  >
                    {wishlistItems.length}
                  </Badge>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="hidden md:block">
                  <button className="focus:outline-none group">
                    <User className="h-5 w-5 text-white group-hover:text-[#D4AF37] transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {user ? (
                    <>
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {profile?.first_name} {profile?.last_name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {profile?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="cursor-pointer bg-blue-50 text-blue-700 font-medium">
                              <Shield className="mr-2 h-4 w-4" />
                              Administration
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Mon profil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders" className="cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          Mes commandes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/addresses" className="cursor-pointer">
                          <MapPin className="mr-2 h-4 w-4" />
                          Mes adresses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-[#DF30CF]">
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/login" className="cursor-pointer">
                          Se connecter
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/register" className="cursor-pointer">
                          Créer un compte
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/wishlist" className="relative md:hidden group">
                <Heart className="h-5 w-5 text-white group-hover:text-[#D4AF37] transition-colors" />
                {wishlistItems.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#D4AF37] hover:bg-[#b8933d] border-none"
                  >
                    {wishlistItems.length}
                  </Badge>
                )}
              </Link>
              <Link href={user ? '/account' : '/auth/login'} className="md:hidden group">
                <User className="h-5 w-5 text-white group-hover:text-[#D4AF37] transition-colors" />
              </Link>

              {isAdmin && (
                <Link href="/admin" className="md:hidden group">
                  <Settings className="h-5 w-5 text-white group-hover:text-[#D4AF37] transition-colors" />
                </Link>
              )}

              <Link href="/cart" className="relative group">
                <ShoppingCart className="h-5 w-5 text-white group-hover:text-[#D4AF37] transition-colors" />
                {cartItemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#D4AF37] hover:bg-[#b8933d] border-none"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
            </div>
          </div>
        </div>

        {megaMenuOpen && activeMenuItem && (
          <div
            onMouseEnter={handleMegaMenuEnter}
            onMouseLeave={handleMegaMenuLeave}
          >
            <MegaMenu activeMenuItem={activeMenuItem} />
          </div>
        )}
      </header>

      <ProductSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
