"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_PRODUCTS } from '@/lib/queries';
import { Search, X, Loader2, ShoppingCart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

interface Product {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  onSale: boolean;
  stockStatus: string;
  shortDescription: string;
  image: {
    sourceUrl: string;
  };
}

interface SearchProductsResponse {
  products: {
    nodes: Product[];
  };
}

interface ProductSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductSearch({ open, onOpenChange }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchProducts, { loading, data }] = useLazyQuery<SearchProductsResponse>(SEARCH_PRODUCTS);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const delaySearch = setTimeout(() => {
        searchProducts({
          variables: { search: searchQuery.trim() }
        });
      }, 300);

      return () => clearTimeout(delaySearch);
    }
  }, [searchQuery, searchProducts]);

  const handleProductClick = (slug: string) => {
    onOpenChange(false);
    setSearchQuery('');
    router.push(`/product/${slug}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const products = data?.products?.nodes || [];

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').substring(0, 120);
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    const cleanPrice = price.replace(/[^0-9.-]+/g, '');
    const numPrice = parseFloat(cleanPrice);

    // WooCommerce returns prices as strings like "50.00" or "5000"
    // If the number is greater than 1000 and has no decimal, assume it's in cents
    if (numPrice >= 1000 && !cleanPrice.includes('.')) {
      return `${(numPrice / 100).toFixed(2)} €`;
    }

    return `${numPrice.toFixed(2)} €`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold">Rechercher un produit</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Rechercher par nom de produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[500px] border-t">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : searchQuery.trim().length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Search className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500">
                Entrez au moins 2 caractères pour rechercher
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500">
                Aucun produit trouvé pour "{searchQuery}"
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Essayez avec d'autres mots-clés
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.slug)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {product.image?.sourceUrl ? (
                      <Image
                        src={product.image.sourceUrl}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    {product.shortDescription && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {stripHtml(product.shortDescription)}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {product.onSale && product.salePrice ? (
                        <>
                          <span className="text-lg font-bold text-[#DF30CF]">
                            {formatPrice(product.salePrice)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.regularPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold">
                          {formatPrice(product.price || product.regularPrice)}
                        </span>
                      )}
                      {product.stockStatus === 'OUT_OF_STOCK' && (
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                          Rupture de stock
                        </span>
                      )}
                      {product.onSale && (
                        <span className="text-xs px-2 py-1 bg-pink-100 text-[#DF30CF] rounded-full font-medium">
                          Promo
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
