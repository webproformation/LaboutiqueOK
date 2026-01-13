'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { decodeHtmlEntities } from '@/lib/utils';
import { CUSTOM_TEXTS } from '@/lib/texts';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  regular_price: number;
  sale_price: number | null;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 4) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, slug, image_url, regular_price, sale_price')
          .ilike('name', `%${searchQuery}%`)
          .eq('status', 'publish')
          .limit(10);

        if (error) throw error;

        setResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    setResults([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl bg-black/95 border-[#D4AF37] p-0 overflow-hidden">
        <DialogTitle className="sr-only">Rechercher un produit</DialogTitle>
        <div className="flex flex-col">
          <div className="flex items-center gap-4 p-6 border-b border-[#D4AF37]/30">
            <Link href="/" onClick={handleClose}>
              <img
                src="/lbdm-logoboutique.png"
                alt="La Boutique De Morgane"
                className="h-12 w-auto"
              />
            </Link>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#D4AF37]" />
              <Input
                type="text"
                placeholder={CUSTOM_TEXTS.search.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 bg-white/10 border-[#D4AF37]/30 text-white placeholder:text-gray-400 focus:border-[#D4AF37] text-lg"
                autoFocus
              />
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-[#D4AF37] transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-6">
            {searchQuery.length < 4 ? (
              <div className="text-center text-gray-400 py-12">
                Tapez au moins 4 caractères pour rechercher
              </div>
            ) : isSearching ? (
              <div className="text-center text-[#D4AF37] py-12">
                Recherche en cours...
              </div>
            ) : results.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                Aucun produit trouvé pour "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    onClick={handleClose}
                    className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-[#D4AF37]/30"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={decodeHtmlEntities(product.name)}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center">
                        <Search className="h-8 w-8 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-lg truncate">
                        {decodeHtmlEntities(product.name)}
                      </h3>
                      <p className="text-gray-400 text-sm">Réf: {product.id}</p>
                    </div>
                    <div className="text-right">
                      {product.sale_price ? (
                        <div className="flex flex-col items-end">
                          <span className="text-gray-400 line-through text-sm">
                            {product.regular_price.toFixed(2)} €
                          </span>
                          <span className="text-[#D4AF37] font-bold text-lg">
                            {product.sale_price.toFixed(2)} €
                          </span>
                        </div>
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {product.regular_price.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
