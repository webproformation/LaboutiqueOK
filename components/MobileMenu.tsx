"use client";

import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_CATEGORIES } from '@/lib/queries';
import { GetProductCategoriesResponse } from '@/types';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface MobileMenuProps {
  onLinkClick: () => void;
}

export default function MobileMenu({ onLinkClick }: MobileMenuProps) {
  const { loading, data } = useQuery<GetProductCategoriesResponse>(GET_PRODUCT_CATEGORIES);

  const categories = data?.productCategories?.nodes || [];

  const getCategoryByName = (name: string) => {
    return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  };

  const getSubCategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  const renderSubCategoriesWithChildren = (parentCategory: any, level = 0) => {
    const subCategories = getSubCategories(parentCategory.id);

    return subCategories.map((subCategory) => {
      const subSubCategories = getSubCategories(subCategory.id);
      const hasChildren = subSubCategories.length > 0;

      return (
        <div key={subCategory.id}>
          <Link
            href={`/category/${subCategory.slug}`}
            onClick={onLinkClick}
            className={`block py-2 text-sm ${
              level === 0
                ? 'text-gray-300 hover:text-[#D4AF37] font-medium'
                : 'text-gray-400 hover:text-[#D4AF37] pl-4'
            } transition-colors`}
          >
            {subCategory.name}
          </Link>
          {hasChildren && (
            <div className="pl-4">
              {subSubCategories.map((subSubCategory) => (
                <Link
                  key={subSubCategory.id}
                  href={`/category/${subSubCategory.slug}`}
                  onClick={onLinkClick}
                  className="block py-2 text-xs text-gray-400 hover:text-[#D4AF37] transition-colors"
                >
                  • {subSubCategory.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  const modeCategory = getCategoryByName('Mode');
  const maisonCategory = getCategoryByName('Maison');
  const beauteCategory = getCategoryByName('Beauté et Senteurs');

  const morganeCategories = [
    getCategoryByName("L'ambiance de la semaine"),
    getCategoryByName('Les coups de coeur de Morgane'),
    getCategoryByName('Le look de la semaine by Morgane')
  ].filter(Boolean);

  if (loading) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <Accordion type="single" collapsible className="w-full">
        <div className="border-b">
          <Link
            href="/category/nouveautes"
            onClick={onLinkClick}
            className="flex items-center justify-between py-4 text-base font-medium text-white hover:text-[#D4AF37] transition-colors"
          >
            <span className="uppercase">Nouveautés</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {modeCategory && (
          <AccordionItem value="mode">
            <AccordionTrigger className="text-base font-medium text-white hover:text-[#D4AF37] uppercase">
              Mode
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pl-4 pb-2">
                <Link
                  href="/category/mode"
                  onClick={onLinkClick}
                  className="block py-2 text-sm font-medium text-[#D4AF37] hover:text-[#b8933d] transition-colors"
                >
                  Voir tout Mode
                </Link>
                {renderSubCategoriesWithChildren(modeCategory)}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="morgane">
          <AccordionTrigger className="text-base font-medium text-white hover:text-[#D4AF37] uppercase">
            Les looks de Morgane
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pl-4 pb-2">
              <Link
                href="/les-looks-de-morgane"
                onClick={onLinkClick}
                className="block py-2 text-sm font-medium text-[#D4AF37] hover:text-[#b8933d] transition-colors"
              >
                Voir tous les looks
              </Link>
              {morganeCategories.map((category) => {
                if (!category) return null;
                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={onLinkClick}
                    className="block py-2 text-sm text-gray-300 hover:text-[#D4AF37] transition-colors"
                  >
                    {category.name}
                  </Link>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {maisonCategory && (
          <AccordionItem value="maison">
            <AccordionTrigger className="text-base font-medium text-white hover:text-[#D4AF37] uppercase">
              Maison
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pl-4 pb-2">
                <Link
                  href="/category/maison"
                  onClick={onLinkClick}
                  className="block py-2 text-sm font-medium text-[#D4AF37] hover:text-[#b8933d] transition-colors"
                >
                  Voir tout Maison
                </Link>
                {renderSubCategoriesWithChildren(maisonCategory)}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {beauteCategory && (
          <AccordionItem value="beaute">
            <AccordionTrigger className="text-base font-medium text-white hover:text-[#D4AF37] uppercase">
              Beauté et Senteurs
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pl-4 pb-2">
                <Link
                  href="/category/beaute-et-senteurs"
                  onClick={onLinkClick}
                  className="block py-2 text-sm font-medium text-[#D4AF37] hover:text-[#b8933d] transition-colors"
                >
                  Voir tout Beauté et Senteurs
                </Link>
                {renderSubCategoriesWithChildren(beauteCategory)}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <div className="border-b">
          <Link
            href="/category/bonnes-affaires"
            onClick={onLinkClick}
            className="flex items-center justify-between py-4 text-base font-medium text-white hover:text-[#D4AF37] transition-colors"
          >
            <span className="uppercase">Bonnes affaires</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </Accordion>

      <div className="mt-6 pt-6 border-t space-y-3">
        <Link
          href="/live"
          onClick={onLinkClick}
          className="block py-2 text-base font-medium text-gray-300 hover:text-[#D4AF37] transition-colors"
        >
          Live & Replay
        </Link>
        <Link
          href="/carte-cadeau"
          onClick={onLinkClick}
          className="block py-2 text-base font-medium text-gray-300 hover:text-[#D4AF37] transition-colors"
        >
          Carte cadeau
        </Link>
        <Link
          href="/actualites"
          onClick={onLinkClick}
          className="block py-2 text-base font-medium text-gray-300 hover:text-[#D4AF37] transition-colors"
        >
          Le carnet de Morgane
        </Link>
      </div>
    </div>
  );
}
