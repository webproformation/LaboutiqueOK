'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const images = [
    product.image_url,
    ...(product.gallery_images || [])
  ].filter(Boolean) as string[];

  const displayPrice = product.sale_price || product.regular_price || 0;
  const hasDiscount = product.sale_price && product.sale_price < (product.regular_price || 0);
  const isInStock = !product.stock_quantity || product.stock_quantity > 0;

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

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  return (
    <Card className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all duration-300">
      <Link href={`/product/${product.slug}`}>
        <div
          className="aspect-square relative overflow-hidden bg-gray-50"
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
            <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
              PROMO
            </div>
          )}

          <button
            onClick={toggleFavorite}
            className="absolute top-3 right-3 bg-white hover:bg-gray-50 p-2.5 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isFavorite ? 'fill-pink-500 text-pink-500' : 'text-gray-600'
              }`}
            />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronLeft className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronRight className="h-4 w-4 text-gray-700" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'w-6 bg-white'
                        : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {showAddToCart && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className="w-full bg-[#C6A15B] hover:bg-[#b8933d] text-white font-semibold rounded-xl shadow-lg"
              >
                {product.is_variable_product ? (
                  <>Choisir vos options</>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Ajouter au panier
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="flex items-center gap-2">
            {isInStock ? (
              <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                Disponible
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs border-pink-200 bg-pink-50 text-pink-700">
                Rupture
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            {hasDiscount ? (
              <>
                <span className="text-gray-400 line-through text-sm">
                  {product.regular_price?.toFixed(2)} €
                </span>
                <span className="text-[#C6A15B] font-bold text-xl">
                  {displayPrice.toFixed(2)} €
                </span>
              </>
            ) : (
              <span className="text-gray-900 font-bold text-xl">
                {displayPrice.toFixed(2)} €
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
