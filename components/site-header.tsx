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
  Settings,
  Play
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
import { supabase } from '@/lib/supabase';
import { decodeHtmlEntities } from '@/lib/utils';
import { CUSTOM_TEXTS } from '@/lib/texts';

const STATIC_LINKS = [
  { name: 'Live Shopping et Replay', href: '/live', slug: 'live', hasMegaMenu: false },
  { name: 'Carte cadeau', href: '/carte-cadeau', slug: 'carte-cadeau', hasMegaMenu: false },
  { name: 'Le carnet de Morgane', href: '/actualites', slug: 'actualites', hasMegaMenu: false },
];

interface NavigationItem {
  name: string;
  href: string;
  slug: string;
  hasMegaMenu: boolean;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut: authStoreSignOut } = useAuthStore();
  const { wishlistCount } = useWishlist();
  const { cartItemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [openMegaMenu, setOpenMegaMenu] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadNavigationCategories();
  }, []);

  async function loadNavigationCategories() {
    try {
      const { data: level1Categories } = await supabase
        .from('categories')
        .select('id, name, slug, display_order')
        .is('parent_id', null)
        .eq('is_visible', true)
        .eq('show_in_main_menu', true)
        .order('display_order', { ascending: true });

      if (level1Categories) {
        const dynamicNav: NavigationItem[] = await Promise.all(
          level1Categories.map(async (cat) => {
            const { count } = await supabase
              .from('categories')
              .select('id', { count: 'exact', head: true })
              .eq('parent_id', cat.id)
              .eq('is_visible', true);

            const hasSubCategories = (count || 0) > 0;

            return {
              name: decodeHtmlEntities(cat.name),
              href: `/category/${cat.slug}`,
              slug: cat.slug,
              hasMegaMenu: hasSubCategories,
            };
          })
        );

        setNavigation([...dynamicNav, ...STATIC_LINKS]);
      }
    } catch (error) {
      console.error('Error loading navigation categories:', error);
      setNavigation(STATIC_LINKS);
    } finally {
      setLoading(false);
    }
  }

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

  const handleMouseEnter = (slug: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenMegaMenu(slug);
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
              {loading ? (
                <div className="text-white text-xs">Chargement...</div>
              ) : (
                navigation.map((item) => (
                  <div
                    key={item.slug}
                    className="relative"
                    onMouseEnter={() => item.hasMegaMenu && handleMouseEnter(item.slug)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-1.5 text-center text-xs lg:text-sm font-medium leading-tight transition-colors ${
                        item.slug === 'live'
                          ? 'text-[#D4AF37] hover:text-[#C5A028] font-bold'
                          : pathname === item.href || pathname.startsWith(item.href + '/')
                          ? 'text-[#D4AF37]'
                          : 'text-white hover:text-[#D4AF37]'
                      }`}
                    >
                      {item.slug === 'live' && <Play className="h-3.5 w-3.5 lg:h-4 lg:w-4 fill-current" />}
                      {item.name}
                    </Link>
                  </div>
                ))
              )}
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

              {/* J'AI SUPPRIMÉ LE BLOC DU BOUTON SETTINGS ICI */}

              <Link href="/cart">
                <Button
                  variant="ghost"
                  className="relative text-white hover:text-[#D4AF37] hover:bg-transparent gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">{CUSTOM_TEXTS.buttons.cart}</span>
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 md:relative md:top-0 md:right-0 h-5 w-5 flex items-center justify-center p-0 bg-[#D4AF37] text-black text-xs">
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
              categorySlug={openMegaMenu}
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