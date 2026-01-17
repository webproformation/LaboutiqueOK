'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { WishlistButton } from '@/components/wishlist-button';
import { supabase } from '@/lib/supabase';
import { CUSTOM_TEXTS } from '@/lib/texts';
import { toast } from 'sonner';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    regular_price: number | null;
    sale_price: number | null;
    image_url: string | null;
    gallery_images?: string[] | null;
    is_variable_product?: boolean;
    stock_quantity?: number | null;
  };
  showAddToCart?: boolean;
}

export function ProductCard({ product, showAddToCart = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user, profile } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [sizeMatch, setSizeMatch] = useState(false);

  const images = [
    product.image_url,
    ...(product.gallery_images || [])
  ].filter(Boolean) as string[];

  const displayPrice = product.sale_price || product.regular_price || 0;
  const hasDiscount = product.sale_price && product.sale_price < (product.regular_price || 0);
  const isInStock = !product.stock_quantity || product.stock_quantity > 0;
  const isLowStock = product.stock_quantity && product.stock_quantity > 0 && product.stock_quantity <= 5;

  useEffect(() => {
    if (user && profile?.user_size && product.is_variable_product) {
      checkSizeCompatibility();
    }
  }, [user, profile, product.id]);

  const checkSizeCompatibility = async () => {
    if (!profile?.user_size) return;

    try {
      const { data, error } = await supabase
        .from('product_variations')
        .select('size_min, size_max')
        .eq('product_id', product.id)
        .not('size_min', 'is', null)
        .not('size_max', 'is', null);

      if (error) throw error;

      const userSize = profile.user_size;
      const hasMatch = data?.some(
        (variation: any) => userSize >= variation.size_min && userSize <= variation.size_max
      );

      setSizeMatch(hasMatch || false);
    } catch (error) {
      console.error('Error checking size compatibility:', error);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.is_variable_product) {
      window.location.href = `/product/${product.slug}`;
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: displayPrice.toString(),
      image: { sourceUrl: product.image_url || '' },
    }, 1);
  };

  return (
    <Card className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-2 border-gray-100 hover:border-[#D4AF37]/30">
      <Link href={`/product/${product.slug}`}>
        <div
          className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-50 to-white"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.length > 0 ? (
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingCart className="h-16 w-16" />
            </div>
          )}

          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl animate-pulse">
              PROMO
            </div>
          )}

          {sizeMatch && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-[#D4AF37] to-[#C6A15B] text-white px-3 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-1 animate-bounce">
              ✨ {CUSTOM_TEXTS.size.matchBadge}
            </div>
          )}

          <WishlistButton productId={product.id} variant="card" />

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-2.5 rounded-xl shadow-xl transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
              >
                <ChevronLeft className="h-4 w-4 text-gray-900" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-2.5 rounded-xl shadow-xl transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
              >
                <ChevronRight className="h-4 w-4 text-gray-900" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'w-8 bg-white shadow-lg'
                        : 'w-2 bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

        </div>

        <CardContent className="p-5 space-y-4 bg-gradient-to-b from-white to-gray-50">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-[#b8933d] transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-2">
            {!isInStock ? (
              <Badge className="text-xs border-0 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold px-3 py-1.5 rounded-full shadow-md">
                {CUSTOM_TEXTS.stock.outOfStock}
              </Badge>
            ) : isLowStock ? (
              <Badge className="text-xs border-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                {CUSTOM_TEXTS.stock.lowStock}
              </Badge>
            ) : (
              <Badge className="text-xs border-0 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                {CUSTOM_TEXTS.stock.inStock}
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-2.5">
            {hasDiscount ? (
              <>
                <span className="text-gray-400 line-through text-sm font-medium">
                  {product.regular_price?.toFixed(2)} €
                </span>
                <span className="text-[#b8933d] font-bold text-xl sm:text-2xl">
                  {displayPrice.toFixed(2)} €
                </span>
              </>
            ) : (
              <span className="text-gray-900 font-bold text-xl sm:text-2xl">
                {displayPrice.toFixed(2)} €
              </span>
            )}
          </div>

          {showAddToCart && (
            <Button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className="w-full bg-gradient-to-r from-[#b8933d] to-[#D4AF37] hover:from-[#a07c2f] hover:to-[#C6A15B] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-5 text-sm sm:text-base"
            >
              {product.is_variable_product ? (
                <>{CUSTOM_TEXTS.buttons.chooseOptions}</>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {CUSTOM_TEXTS.buttons.addToCart}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
