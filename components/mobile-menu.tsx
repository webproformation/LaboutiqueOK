'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { User, LogOut, Shield } from 'lucide-react';
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
    await signOut();
    onClose();
    router.push('/');
  };

  async function loadCategories() {
    try {
      const { data: level1Categories } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (level1Categories) {
        const categoriesWithChildren = await Promise.all(
          level1Categories.map(async (cat1) => {
            const { data: level2 } = await supabase
              .from('categories')
              .select('*')
              .eq('parent_id', cat1.id)
              .eq('is_visible', true)
              .order('display_order', { ascending: true });

            const level2WithChildren = level2 ? await Promise.all(
              level2.map(async (cat2) => {
                const { data: level3 } = await supabase
                  .from('categories')
                  .select('*')
                  .eq('parent_id', cat2.id)
                  .eq('is_visible', true)
                  .order('display_order', { ascending: true });

                return {
                  ...cat2,
                  children: level3 || []
                };
              })
            ) : [];

            return {
              ...cat1,
              children: level2WithChildren
            };
          })
        );

        setCategories(categoriesWithChildren);
      }
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
                  <Link href="/account" onClick={onClose}>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-white border-gray-600 hover:bg-gray-800"
                    >
                      <User className="h-4 w-4" />
                      Mon compte
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full justify-start gap-2 text-[#b8933d] border-[#b8933d] hover:bg-[#b8933d]/10"
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
                  <Button
                    variant="outline"
                    className="w-full justify-center bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white border-[#b8933d] hover:bg-[#9a7a2f]"
                  >
                    Se connecter
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={onClose}>
                  <Button
                    variant="outline"
                    className="w-full justify-center text-white border-gray-600 hover:bg-gray-800"
                  >
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
                  <AccordionTrigger className="text-base font-medium hover:text-[#D4AF37] hover:no-underline">
                    {decodeHtmlEntities(category.name)}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pl-4">
                    {category.children?.map((cat2) => (
                      <div key={cat2.id} className="space-y-2">
                        <Link
                          href={`/category/${cat2.slug}`}
                          className="block py-1 text-sm font-semibold hover:text-[#D4AF37] transition-colors"
                          onClick={onClose}
                        >
                          {decodeHtmlEntities(cat2.name)}
                        </Link>
                        {cat2.children && cat2.children.length > 0 && (
                          <div className="pl-3 space-y-1">
                            {cat2.children.map((cat3) => (
                              <Link
                                key={cat3.id}
                                href={`/category/${cat3.slug}`}
                                className="block py-1 text-xs text-gray-300 hover:text-[#D4AF37] transition-colors"
                                onClick={onClose}
                              >
                                • {decodeHtmlEntities(cat3.name)}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            <div className="border-t border-gray-700 my-4"></div>

            <div className="py-3">
              <Link
                href="/live"
                className="block text-base font-medium hover:text-[#D4AF37] transition-colors"
                onClick={onClose}
              >
                Live Shopping et Replay
              </Link>
            </div>

            <div className="py-3">
              <Link
                href="/carte-cadeau"
                className="block text-base font-medium hover:text-[#D4AF37] transition-colors"
                onClick={onClose}
              >
                Carte cadeau
              </Link>
            </div>

            <div className="py-3">
              <Link
                href="/actualites"
                className="block text-base font-medium hover:text-[#D4AF37] transition-colors"
                onClick={onClose}
              >
                Le carnet de Morgane
              </Link>
            </div>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
