'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Trash2, ShoppingCart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

interface Product {
  id: string;
  name: string;
  slug: string;
  regular_price: number;
  sale_price: number | null;
  image_url: string | null;
  gallery_images: string[] | null;
  stock_quantity: number;
}

function WishlistProductCard({
  product,
  onRemove,
  onAddToCart
}: {
  product: Product;
  onRemove: (id: string) => void;
  onAddToCart: (product: Product) => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const images = [
    product.image_url,
    ...(product.gallery_images || [])
  ].filter(Boolean) as string[];

  const hasDiscount = product.sale_price && product.sale_price < product.regular_price;
  const isInStock = product.stock_quantity > 0;
  const displayPrice = product.sale_price || product.regular_price;

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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(product.id);
            }}
            className="absolute top-3 right-3 bg-white hover:bg-gray-50 p-2.5 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
          >
            <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
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
                  {product.regular_price.toFixed(2)} €
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

      {isInStock && (
        <div className="p-4 pt-0">
          <Button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(product);
            }}
            className="w-full bg-[#C6A15B] hover:bg-[#b8933d] text-white font-semibold rounded-xl"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Ajouter au panier
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlistProducts();
  }, [wishlistItems]);

  const loadWishlistProducts = async () => {
    if (wishlistItems.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, regular_price, sale_price, image_url, gallery_images, stock_quantity')
        .in('id', wishlistItems);

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading wishlist products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    await toggleWishlist(productId);
  };

  const addToCart = (product: Product) => {
    try {
      const savedCart = localStorage.getItem('cart');
      const cart = savedCart ? JSON.parse(savedCart) : [];

      const existingItem = cart.find((cartItem: any) => cartItem.product_id === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: product.id,
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.sale_price || product.regular_price,
          image_url: product.image_url,
          quantity: 1,
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Article ajouté au panier');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <PageHeader
            icon={Heart}
            title="Ma Liste de Souhaits"
            description="Ajoutez vos pépites préférées pour les retrouver facilement"
          />
          <p className="text-center text-gray-600 mb-8">
            Votre liste de souhaits est vide pour le moment
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white">
            <Link href="/">
              Découvrir nos produits
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          icon={Heart}
          title="Ma Liste de Souhaits"
          description={`${products.length} pépite${products.length > 1 ? 's' : ''} sauvegardée${products.length > 1 ? 's' : ''}`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <WishlistProductCard
              key={product.id}
              product={product}
              onRemove={removeItem}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
