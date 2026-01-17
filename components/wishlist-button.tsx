'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  variant?: 'default' | 'icon' | 'card';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function WishlistButton({
  productId,
  variant = 'default',
  size = 'default',
  className
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={handleClick}
        className={cn(
          'transition-all',
          className
        )}
      >
        <Heart
          className={cn(
            'h-5 w-5 transition-all',
            inWishlist && 'fill-pink-500 text-pink-500'
          )}
        />
      </Button>
    );
  }

  if (variant === 'card') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all z-10',
          className
        )}
      >
        <Heart
          className={cn(
            'h-5 w-5 transition-all',
            inWishlist && 'fill-pink-500 text-pink-500'
          )}
        />
      </button>
    );
  }

  return (
    <Button
      variant={inWishlist ? 'default' : 'outline'}
      size={size}
      onClick={handleClick}
      className={cn(
        'gap-2 transition-all',
        inWishlist && 'bg-pink-500 hover:bg-pink-600 text-white',
        className
      )}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-all',
          inWishlist && 'fill-white'
        )}
      />
      {inWishlist ? 'Dans ma wishlist' : 'Ajouter à ma wishlist'}
    </Button>
  );
}
