'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase, ProductCategory } from '@/lib/supabase';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const morganeCategories = [
  { name: "Les coups de cœur de Morgane", slug: "les-coups-de-coeur-de-morgane" },
  { name: "L'ambiance de la semaine", slug: "l-ambiance-de-la-semaine" },
  { name: "Le look de la semaine by Morgane", slug: "le-look-de-la-semaine-by-morgane" }
];

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [modeCategories, setModeCategories] = useState<ProductCategory[]>([]);
  const [maisonCategories, setMaisonCategories] = useState<ProductCategory[]>([]);
  const [beauteCategories, setBeauteCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  async function loadCategories() {
    try {
      const { data: modeParent } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'mode')
        .maybeSingle();

      if (modeParent) {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', modeParent.id)
          .order('display_order');
        setModeCategories(data || []);
      }

      const { data: maisonParent } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'maison')
        .maybeSingle();

      if (maisonParent) {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', maisonParent.id)
          .order('display_order');
        setMaisonCategories(data || []);
      }

      const { data: beauteParent } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'beaute-senteurs')
        .maybeSingle();

      if (beauteParent) {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', beauteParent.id)
          .order('display_order');
        setBeauteCategories(data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 bg-black text-white overflow-y-auto">
        <div className="py-6">
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
                Mode
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pl-4">
                {modeCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="block py-2 text-sm hover:text-[#D4AF37] transition-colors"
                    onClick={onClose}
                  >
                    {cat.name}
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="morgane" className="border-b border-gray-700">
              <AccordionTrigger className="text-base font-medium hover:text-[#D4AF37] hover:no-underline">
                Les looks de Morgane
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
                Maison
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pl-4">
                {maisonCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="block py-2 text-sm hover:text-[#D4AF37] transition-colors"
                    onClick={onClose}
                  >
                    {cat.name}
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="beaute" className="border-b border-gray-700">
              <AccordionTrigger className="text-base font-medium hover:text-[#D4AF37] hover:no-underline">
                Beauté et Senteurs
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pl-4">
                {beauteCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="block py-2 text-sm hover:text-[#D4AF37] transition-colors"
                    onClick={onClose}
                  >
                    {cat.name}
                  </Link>
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
                Live & Replay
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
