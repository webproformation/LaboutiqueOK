'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Heart,
  User,
  ShoppingCart,
  Menu,
  Shield,
  Package,
  MapPin,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MegaMenu } from '@/components/mega-menu';
import { MobileMenu } from '@/components/mobile-menu';
import { SearchModal } from '@/components/search-modal';
import { useAuth } from '@/context/AuthContext';
import { useAuthStore } from '@/stores/auth-store';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

const navigation = [
  { name: 'Nouveautés', href: '/category/nouveautes', hasMegaMenu: false },
  { name: 'Dressing (34-54)', href: '/category/dressing', hasMegaMenu: true, megaType: 'mode' as const },
  { name: "L'atelier de Doudou", href: '/category/L-ATELIER-DE-DOUDOU', hasMegaMenu: false },
  { name: 'Sublimer le Look', href: '/category/sublimer-le-look', hasMegaMenu: true, megaType: 'morgane' as const },
  { name: 'Ambiance & Bien-être', href: '/category/ambiance-bien-etre', hasMegaMenu: true, megaType: 'maison' as const },
  { name: 'Soins, Make-up & Fragrances', href: '/category/soins-make-up-&-fragrances', hasMegaMenu: true, megaType: 'beaute' as const },
  { name: 'Bonnes affaires', href: '/category/bonnes-affaires', hasMegaMenu: false },
  { name: 'Live Shopping et Replay', href: '/live', hasMegaMenu: false },
  { name: 'Carte cadeau', href: '/carte-cadeau', hasMegaMenu: false },
  { name: 'Le carnet de Morgane', href: '/actualites', hasMegaMenu: false },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut: authStoreSignOut } = useAuthStore();
  const { wishlistCount } = useWishlist();
  const { cartItemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [openMegaMenu, setOpenMegaMenu] = useState<'mode' | 'morgane' | 'maison' | 'beaute' | null>(null);

  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("🔍 SiteHeader - État Auth:", {
      user: user?.email,
      profile: profile ? { first_name: profile.first_name, last_name: profile.last_name, is_admin: profile.is_admin } : null
    });
  }, [user, profile]);

  const handleSignOut = async () => {
    await authStoreSignOut();
    router.push('/');
  };

  const handleMouseEnter = (megaType: 'mode' | 'morgane' | 'maison' | 'beaute') => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenMegaMenu(megaType);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setOpenMegaMenu(null);
    }, 300);
  };

  return (
    <>
      <header className="sticky top-0 z-[100] bg-black shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:text-[#D4AF37] hover:bg-transparent"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>

              <Link href="/" className="flex-shrink-0">
                <img
                  src="/lbdm-logoboutique.png"
                  alt="La Boutique De Morgane"
                  className="h-12 md:h-16 w-auto"
                />
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-3 lg:gap-4 flex-1 justify-center">
              {navigation.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.hasMegaMenu && handleMouseEnter(item.megaType!)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href}
                    className={`text-xs lg:text-sm font-medium transition-colors ${
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'text-[#D4AF37]'
                        : 'text-white hover:text-[#D4AF37]'
                    }`}
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchModalOpen(true)}
                className="hidden md:flex text-white hover:text-[#D4AF37] hover:bg-transparent"
              >
                <Search className="h-5 w-5" />
              </Button>

              <Link href="/wishlist" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-white hover:text-[#D4AF37] hover:bg-transparent"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-[#D4AF37] text-black text-xs">
                      {wishlistCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              <Link href="/wishlist" className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-white hover:text-[#D4AF37] hover:bg-transparent"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-[#D4AF37] text-black text-xs">
                      {wishlistCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-[#D4AF37] hover:bg-transparent"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {user ? (
                    <>
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">
                            {profile?.first_name || profile?.last_name
                              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                              : user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {profile?.is_admin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center w-full cursor-pointer bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white font-medium">
                            <Shield className="mr-2 h-4 w-4" />
                            Administration
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="flex items-center w-full cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Mon compte
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders" className="flex items-center w-full cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          Mes commandes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/addresses" className="flex items-center w-full cursor-pointer">
                          <MapPin className="mr-2 h-4 w-4" />
                          Mes adresses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-[#b8933d] focus:text-[#d4af37] cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/login" className="flex items-center w-full cursor-pointer">Se connecter</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/register" className="flex items-center w-full cursor-pointer">Créer un compte</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {profile?.is_admin && (
                <Link href="/admin" className="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-[#D4AF37] hover:bg-transparent"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              )}

              <Link href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-white hover:text-[#D4AF37] hover:bg-transparent"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-[#D4AF37] text-black text-xs">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {openMegaMenu && (
          <div
            onMouseEnter={() => {
              if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
              }
            }}
            onMouseLeave={handleMouseLeave}
          >
            <MegaMenu
              isOpen={true}
              type={openMegaMenu}
              onClose={() => setOpenMegaMenu(null)}
            />
          </div>
        )}
      </header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
}
