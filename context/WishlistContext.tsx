'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

interface WishlistContextType {
  wishlistItems: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  wishlistCount: number;
  loadWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const { user } = useAuth();

  const loadWishlist = async () => {
    if (!user) {
      const localWishlist = localStorage.getItem('wishlist');
      setWishlistItems(localWishlist ? JSON.parse(localWishlist) : []);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const productIds = data?.map(item => item.product_id) || [];
      setWishlistItems(productIds);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const isInWishlist = (productId: string) => {
    return wishlistItems.includes(productId);
  };

  const toggleWishlist = async (productId: string) => {
    const isCurrentlyInWishlist = isInWishlist(productId);

    if (!user) {
      const newWishlist = isCurrentlyInWishlist
        ? wishlistItems.filter(id => id !== productId)
        : [...wishlistItems, productId];

      setWishlistItems(newWishlist);
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));

      toast.success(isCurrentlyInWishlist
        ? 'Produit retiré de la wishlist'
        : 'Produit ajouté à la wishlist'
      );
      return;
    }

    try {
      if (isCurrentlyInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        setWishlistItems(prev => prev.filter(id => id !== productId));
        toast.success('Produit retiré de la wishlist');
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: productId
          });

        if (error) throw error;

        setWishlistItems(prev => [...prev, productId]);
        toast.success('Produit ajouté à la wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Erreur lors de la mise à jour de la wishlist');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isInWishlist,
        toggleWishlist,
        wishlistCount: wishlistItems.length,
        loadWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
