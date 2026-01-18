'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { User, LogOut, Shield, Play, ChevronRight } from 'lucide-react';
import { supabase, ProductCategory } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { decodeHtmlEntities } from '@/lib/utils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryLevel1 extends ProductCategory {
  children?: CategoryLevel2[];
}

interface CategoryLevel2 extends ProductCategory {
  children?: ProductCategory[];
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [categories, setCategories] = useState<CategoryLevel1[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      router.refresh(); // Force le rafraîchissement pour mettre à jour l'état Auth
      router.push('/');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  async function loadCategories() {
    try {
      const { data: allCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (!allCategories) return;

      const level1Categories = allCategories.filter(cat =>
        cat.parent_id === null && cat.show_in_main_menu === true
      );

      const categoriesWithChildren = level1Categories.map(cat1 => {
        const level2 = allCategories.filter(cat => cat.parent_id === cat1.id);
        const level2WithChildren = level2.map(cat2 => {
          const level3 = allCategories.filter(cat => cat.parent_id === cat2.id);
          return { ...cat2, children: level3 };
        });
        return { ...cat1, children: level2WithChildren };
      });

      setCategories(categoriesWithChildren);
    } catch (error) {
      console.error('Error loading mobile menu categories:', error);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 bg-black text-white overflow-y-auto">
        <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
        <div className="py-6">
          {user && profile ? (
            <div className="mb-6 pb-6 border-b border-gray-700">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#b8933d] flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{profile.email}</p>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  {profile.is_admin && (
                    <Link href="/admin" onClick={onClose}>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white border-[#b8933d] hover:bg-[#9a7a2f]"
                      >
                        <Shield className="h-4 w-4" />
                        Administration
                      </Button>
                    </Link>
                  )}
                  {/* CORRECTION DU BOUTON MON COMPTE (TEXTE NOIR) */}
                  <Link href="/account" onClick={onClose}>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 bg-white text-gray-900 border-gray-200 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4" />
                      Mon compte
                    </Button>
                  </Link>
                  {/* CORRECTION DU BOUTON DÉCONNEXION */}
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleSignOut}
                    className="w-full justify-start gap-2 text-[#b8933d] bg-white border-[#b8933d] hover:bg-[#b8933d]/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 pb-6 border-b border-gray-700">
              <div className="flex flex-col space-y-2">
                <Link href="/auth/login" onClick={onClose}>
                  <Button className="w-full justify-center bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white border-2 border-[#d4af37] hover:from-[#d4af37] hover:to-[#b8933d] font-semibold shadow-lg">
                    Se connecter
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={onClose}>
                  <Button variant="outline" className="w-full justify-center bg-white text-gray-900 border-2 border-white hover:bg-gray-100 font-semibold shadow-md">
                    Créer un compte
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <Accordion type="multiple" className="space-y-2">
            {categories.map((category) => {
              const hasChildren = category.children && category.children.length > 0;

              if (!hasChildren) {
                return (
                  <div key={category.id} className="py-3">
                    <Link
                      href={`/category/${category.slug}`}
                      className="block text-base font-medium hover:text-[#D4AF37] transition-colors"
                      onClick={onClose}
                    >
                      {decodeHtmlEntities(category.name)}
                    </Link>
                  </div>
                );
              }

              return (
                <AccordionItem key={category.id} value={category.id} className="border-b border-gray-700">
                  <AccordionTrigger className="text-base font-bold hover:text-[#D4AF37] hover:no-underline py-4 flex items-center justify-between group">
                    <span className="flex items-center gap-2">
                      <span className="w-1 h-6 bg-[#D4AF37] rounded-full group-hover:h-8 transition-all" />
                      {decodeHtmlEntities(category.name)}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pl-4 pb-4">
                    {category.children?.map((cat2) => {
                      const hasLevel3 = cat2.children && cat2.children.length > 0;
                      return (
                        <div key={cat2.id} className="space-y-2">
                          <Link
                            href={`/category/${cat2.slug}`}
                            className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold hover:text-[#D4AF37] hover:bg-gray-800/70 transition-all group bg-gray-800/30"
                            onClick={onClose}
                          >
                            <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${hasLevel3 ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                            <span className="flex-1">{decodeHtmlEntities(cat2.name)}</span>
                            {hasLevel3 && (
                              <span className="text-xs font-bold text-white bg-[#D4AF37] px-2 py-1 rounded-full">{cat2.children?.length || 0}</span>
                            )}
                          </Link>
                          {hasLevel3 && (
                            <div className="pl-6 pr-2 space-y-1.5 border-l-2 border-[#D4AF37]/50 ml-4">
                              {cat2.children?.map((cat3) => (
                                <Link
                                  key={cat3.id}
                                  href={`/category/${cat3.slug}`}
                                  className="flex items-center gap-2 py-2 px-3 rounded-md text-xs text-gray-300 hover:text-[#D4AF37] hover:bg-gray-800/50 transition-all bg-gray-900/30"
                                  onClick={onClose}
                                >
                                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] flex-shrink-0" />
                                  <span>{decodeHtmlEntities(cat3.name)}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
            <div className="border-t border-gray-700 my-4"></div>
            <div className="py-3">
              <Link href="/live" className="flex items-center gap-2 text-base font-bold text-[#D4AF37] hover:text-[#C5A028] transition-colors" onClick={onClose}>
                <Play className="h-4 w-4 fill-current" />
                Live Shopping et Replay
              </Link>
            </div>
            <div className="py-3"><Link href="/carte-cadeau" className="block text-base font-medium hover:text-[#D4AF37] transition-colors" onClick={onClose}>Carte cadeau</Link></div>
            <div className="py-3"><Link href="/actualites" className="block text-base font-medium hover:text-[#D4AF37] transition-colors" onClick={onClose}>Le carnet de Morgane</Link></div>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}