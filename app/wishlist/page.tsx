"use client";

import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = async (item: any) => {
    const product = {
      id: item.product_slug,
      slug: item.product_slug,
      name: item.product_name,
      price: item.product_price,
      image: item.product_image ? { sourceUrl: item.product_image } : undefined,
    };

    addToCart(product);
    toast.success(`${item.product_name} ajouté au panier !`);
  };

  const handleRemove = async (slug: string, name: string) => {
    try {
      await removeFromWishlist(slug);
      toast.success(`${name} retiré de vos coups de cœur`);
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 py-16 text-center">
          <Heart className="mx-auto h-24 w-24 text-gray-300" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Vos coups de cœur sont vides</h1>
          <p className="mt-2 text-gray-600">
            Ajoutez vos produits préférés en cliquant sur le cœur !
          </p>
          <Link href="/">
            <Button className="mt-6 bg-[#b8933d] hover:bg-[#a07c2f] text-white">
              Découvrir nos produits
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-[#b8933d]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Continuer mes achats
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-[#b8933d]" />
          <h1 className="text-4xl font-bold text-gray-900">Mes coups de cœur</h1>
        </div>

        <p className="text-gray-600 mb-8">
          {wishlistItems.length} produit{wishlistItems.length > 1 ? 's' : ''} dans vos coups de cœur
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden transition-all hover:shadow-lg">
              <CardContent className="p-0">
                <Link href={`/product/${item.product_slug}`}>
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingCart className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(item.product_slug, item.product_name);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-md hover:shadow-lg z-10"
                      aria-label="Retirer de mes coups de cœur"
                    >
                      <Heart className="h-5 w-5 fill-[#DF30CF] text-[#DF30CF]" />
                    </button>
                  </div>
                </Link>
                <div className="p-4 space-y-3">
                  <Link href={`/product/${item.product_slug}`}>
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-[#b8933d] transition-colors">
                      {item.product_name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-[#b8933d]">{formatPrice(item.product_price)}</p>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      className="bg-[#b8933d] hover:bg-[#a07c2f] text-white"
                    >
                      <ShoppingCart className="mr-1 h-4 w-4" />
                      Panier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
