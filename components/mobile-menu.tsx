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

const morganeCategories = [
  { name: "Les coups de cœur de Morgane", slug: "les-coups-de-coeur-de-morgane" },
  { name: "L'ambiance de la semaine", slug: "l-ambiance-de-la-semaine" },
  { name: "Le look de la semaine by Morgane", slug: "le-look-de-la-semaine-by-morgane" }
];

interface CategoryWithChildren extends ProductCategory {
  children?: ProductCategory[];
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [modeCategories, setModeCategories] = useState<CategoryWithChildren[]>([]);
  const [maisonCategories, setMaisonCategories] = useState<CategoryWithChildren[]>([]);
  const [beauteCategories, setBeauteCategories] = useState<CategoryWithChildren[]>([]);

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
      const { data: modeParent } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'mode')
        .maybeSingle();

      if (modeParent) {
        const { data: level1 } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', modeParent.id)
          .order('display_order');

        if (level1) {
          const withChildren = await Promise.all(
            level1.map(async (cat) => {
              const { data: children } = await supabase
                .from('categories')
                .select('*')
                .eq('parent_id', cat.id)
                .order('display_order');
              return { ...cat, children: children || [] };
            })
          );
          setModeCategories(withChildren);
        }
      }

      const { data: maisonParent } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'maison')
        .maybeSingle();

      if (maisonParent) {
        const { data: level1 } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', maisonParent.id)
          .order('display_order');

        if (level1) {
          const withChildren = await Promise.all(
            level1.map(async (cat) => {
              const { data: children } = await supabase
                .from('categories')
                .select('*')
                .eq('parent_id', cat.id)
                .order('display_order');
              return { ...cat, children: children || [] };
            })
          );
          setMaisonCategories(withChildren);
        }
      }

      const { data: beauteParent } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'beaute-et-senteurs')
        .maybeSingle();

      if (beauteParent) {
        const { data: level1 } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', beauteParent.id)
          .order('display_order');

        if (level1) {
          const withChildren = await Promise.all(
            level1.map(async (cat) => {
              const { data: children } = await supabase
                .from('categories')
                .select('*')
                .eq('parent_id', cat.id)
                .order('display_order');
              return { ...cat, children: children || [] };
            })
          );
          setBeauteCategories(withChildren);
        }
      }
    } catch (error) {
      // Silently handle category loading errors
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
            <div className="py-3">
              <Link
                href="/category/nouveautes"
                className="block text-base font-medium hover:text-[#D4AF37] transition-colors"
                onClick={onClose}
              >
                Nouveautés
              </Link>
            </div>

            <AccordionItem value="mode" className="border-b border-gray-700">
              <AccordionTrigger className="text-base font-medium hover:text-[#D4AF37] hover:no-underline">
                Dressing (34-54)
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pl-4">
                {modeCategories.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <Link
                      href={`/category/${cat.slug}`}
                      className="block py-1 text-sm font-semibold hover:text-[#D4AF37] transition-colors"
                      onClick={onClose}
                    >
                      {decodeHtmlEntities(cat.name)}
                    </Link>
                    {cat.children && cat.children.length > 0 && (
                      <div className="pl-3 space-y-1">
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="block py-1 text-xs text-gray-300 hover:text-[#D4AF37] transition-colors"
                            onClick={onClose}
                          >
                            • {decodeHtmlEntities(child.name)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="morgane" className="border-b border-gray-700">
              <AccordionTrigger className="text-base font-medium hover:text-[#D4AF37] hover:no-underline">
                Sublimer le Look
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pl-4">
                {morganeCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="block py-2 text-sm hover:text-[#D4AF37] transition-colors"
                    onClick={onClose}
                  >
                    {cat.name}
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="maison" className="border-b border-gray-700">
              <AccordionTrigger className="text-base font-medium hover:text-[#D4AF37] hover:no-underline">
                Ambiance & Bien-être
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pl-4">
                {maisonCategories.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <Link
                      href={`/category/${cat.slug}`}
                      className="block py-1 text-sm font-semibold hover:text-[#D4AF37] transition-colors"
                      onClick={onClose}
                    >
                      {decodeHtmlEntities(cat.name)}
                    </Link>
                    {cat.children && cat.children.length > 0 && (
                      <div className="pl-3 space-y-1">
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="block py-1 text-xs text-gray-300 hover:text-[#D4AF37] transition-colors"
                            onClick={onClose}
                          >
                            • {decodeHtmlEntities(child.name)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="beaute" className="border-b border-gray-700">
              <AccordionTrigger className="text-base font-medium hover:text-[#D4AF37] hover:no-underline">
                Soins, Make-up & Fragrances
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pl-4">
                {beauteCategories.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <Link
                      href={`/category/${cat.slug}`}
                      className="block py-1 text-sm font-semibold hover:text-[#D4AF37] transition-colors"
                      onClick={onClose}
                    >
                      {decodeHtmlEntities(cat.name)}
                    </Link>
                    {cat.children && cat.children.length > 0 && (
                      <div className="pl-3 space-y-1">
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="block py-1 text-xs text-gray-300 hover:text-[#D4AF37] transition-colors"
                            onClick={onClose}
                          >
                            • {decodeHtmlEntities(child.name)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <div className="py-3">
              <Link
                href="/category/bonnes-affaires"
                className="block text-base font-medium hover:text-[#D4AF37] transition-colors"
                onClick={onClose}
              >
                Bonnes affaires
              </Link>
            </div>

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
