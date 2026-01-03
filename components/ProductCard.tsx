"use client";

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useClientSize } from '@/hooks/use-client-size';
import { ShoppingCart, Heart, ChevronLeft, ChevronRight, Bell, Ruler } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { getSupabaseImageForProduct } from '@/lib/supabase-product-mapper';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user, profile } = useAuth();
  const { isProductInMySize } = useClientSize();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmittingNotification, setIsSubmittingNotification] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [supabaseImage, setSupabaseImage] = useState<string | null>(null);
  const [isLoadingSupabaseImage, setIsLoadingSupabaseImage] = useState(true);

  const isInMySize = isProductInMySize(product);

  // Récupérer l'image depuis Supabase en priorité
  useEffect(() => {
    const fetchSupabaseImage = async () => {
      if (!product.databaseId) {
        console.warn('[ProductCard] Product without databaseId:', product.name);
        setIsLoadingSupabaseImage(false);
        return;
      }

      const woocommerceId = product.databaseId;
      const supabaseUrl = await getSupabaseImageForProduct(woocommerceId);

      if (supabaseUrl) {
        console.log(`[MediaMapper] ✅ Success: Swapped WP URL for Supabase WebP for product ID ${woocommerceId}`);
        console.log(`  Product: ${product.name}`);
        console.log(`  ❌ Old WP URL: ${product.image?.sourceUrl}`);
        console.log(`  ✅ New Supabase URL: ${supabaseUrl}`);
        setSupabaseImage(supabaseUrl);
      } else {
        console.log(`[MediaMapper] ⚠️  Using WordPress URL for product ID ${woocommerceId} (${product.name})`);
      }

      setIsLoadingSupabaseImage(false);
    };

    fetchSupabaseImage();
  }, [product.databaseId, product.name]);

  // Construire la liste d'images avec priorité Supabase
  const wordpressImages = [
    product.image?.sourceUrl,
    ...(product.galleryImages?.nodes?.map(img => img.sourceUrl) || [])
  ].filter(Boolean) as string[];

  // Si on a une image Supabase, l'utiliser en premier
  const images = supabaseImage
    ? [supabaseImage, ...wordpressImages.slice(1)]
    : wordpressImages;

  const hasSelectableAttributes = () => {
    const isVariable = product.__typename === 'VariableProduct';
    if (isVariable) return true;

    const attributes = product.attributes?.nodes || [];
    return attributes.some((attr: any) => !attr.variation && attr.options && attr.options.length > 0);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    toast.success(`${product.name} ajouté au panier !`);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isInWishlist(product.slug)) {
        await removeFromWishlist(product.slug);
        toast.success(`${product.name} retiré de vos coups de cœur`);
      } else {
        await addToWishlist(product);
        toast.success(`${product.name} ajouté à vos coups de cœur !`);
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      e.preventDefault();
      e.stopPropagation();

      if (isLeftSwipe) {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      } else if (isRightSwipe) {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
    }
  };

  const handleNotifyAvailability = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user && !notifyEmail) {
      setShowNotifyDialog(true);
      return;
    }

    setIsSubmittingNotification(true);

    try {
      const { error } = await supabase
        .from('product_availability_notifications')
        .insert({
          user_id: user?.id || null,
          product_slug: product.slug,
          product_name: product.name,
          email: user ? profile?.email : notifyEmail,
        });

      if (error) throw error;

      toast.success('Vous serez notifié quand ce produit sera de nouveau disponible !');
      setShowNotifyDialog(false);
      setNotifyEmail('');
    } catch (error) {
      toast.error('Erreur lors de l\'inscription à la notification');
    } finally {
      setIsSubmittingNotification(false);
    }
  };

  const inWishlist = isInWishlist(product.slug);

  return (
    <>
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Être notifié de la disponibilité</DialogTitle>
            <DialogDescription>
              Recevez un email dès que {product.name} sera de nouveau en stock.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleNotifyAvailability(e);
              }}
              disabled={!notifyEmail || isSubmittingNotification}
            >
              {isSubmittingNotification ? 'Inscription...' : 'Me notifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    <Link href={`/product/${product.slug}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        <CardContent className="p-0">
          <div
            className="relative aspect-square overflow-hidden bg-gray-100"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
              {product.onSale && (
                <div className="bg-[#DF30CF] text-white px-3 py-1 rounded-full text-xs font-bold">
                  PROMO
                </div>
              )}
              {isInMySize && (
                <div className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  A MA TAILLE
                </div>
              )}
            </div>

            {images.length > 0 ? (
              <Image
                src={images[currentImageIndex]}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover transition-transform group-hover:scale-105"
                quality={75}
                unoptimized={true}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingCart className="h-16 w-16 text-gray-300" />
              </div>
            )}

            {images.length > 1 && (
              <>
                {isHovered && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-md hover:shadow-lg z-10"
                      aria-label="Image précédente"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-800" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-md hover:shadow-lg z-10"
                      aria-label="Image suivante"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-800" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {images.map((img, index) => (
                    <div
                      key={`${product.slug}-img-${index}-${img}`}
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
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <button
                onClick={handleToggleWishlist}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-md hover:shadow-lg"
                aria-label={inWishlist ? "Retirer de mes coups de cœur" : "Ajouter à mes coups de cœur"}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    inWishlist
                      ? 'fill-[#DF30CF] text-[#DF30CF]'
                      : 'text-gray-600 hover:text-[#DF30CF]'
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
            {product.name}
          </h3>

          {product.stockQuantity !== null && product.stockQuantity !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              <div
                className={`h-2 w-2 rounded-full ${
                  product.stockQuantity > 0 ? 'bg-[#B6914A]' : 'bg-[#DF30CF]'
                }`}
              />
              <span className={product.stockQuantity > 0 ? 'text-[#B6914A]' : 'text-[#DF30CF]'}>
                {product.stockQuantity > 0 ? 'Disponible' : 'Rupture de stock'}
              </span>
            </div>
          )}

          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col">
              {product.onSale && product.regularPrice ? (
                <>
                  <p className="text-xs text-gray-500 line-through">{formatPrice(product.regularPrice)}</p>
                  <p className="text-lg font-bold text-[#b8933d]">{formatPrice(product.price)}</p>
                </>
              ) : (
                <p className="text-lg font-bold text-[#b8933d]">{formatPrice(product.price)}</p>
              )}
            </div>
            {product.stockQuantity === 0 ? (
              <Button
                size="sm"
                onClick={handleNotifyAvailability}
                className="bg-[#B6914A] hover:bg-[#a07c2f] text-white"
              >
                <Bell className="mr-1 h-4 w-4" />
                Notifier
              </Button>
            ) : hasSelectableAttributes() ? (
              <Button
                size="sm"
                className="bg-[#b8933d] hover:bg-[#a07c2f] text-white pointer-events-none"
              >
                <Ruler className="mr-1 h-4 w-4" />
                Sélectionner
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="bg-[#b8933d] hover:bg-[#a07c2f] text-white"
              >
                <ShoppingCart className="mr-1 h-4 w-4" />
                Ajouter
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
    </>
  );
}
