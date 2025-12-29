'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';

interface WishlistItem {
  id: string;
  product_slug: string;
  product_name: string;
  product_image: string | null;
  product_price: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productSlug: string) => Promise<void>;
  isInWishlist: (productSlug: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('wishlist_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('wishlist_session_id', sessionId);
  }
  return sessionId;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
  }, []);

  const loadWishlist = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/wishlist?sessionId=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load wishlist');
      }

      const { items } = await response.json();
      setWishlistItems(items || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadWishlist();
    }
  }, [sessionId, loadWishlist]);

  const addToWishlist = async (product: Product) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          product_slug: product.slug,
          product_name: product.name,
          product_image: product.image?.sourceUrl || null,
          product_price: product.price || '',
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        if (error?.includes('already in wishlist') || response.status === 409) {
          return;
        }
        throw new Error(error);
      }

      const { item } = await response.json();
      if (item) {
        setWishlistItems(prev => [item, ...prev]);
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  };

  const removeFromWishlist = async (productSlug: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove',
          product_slug: productSlug,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      setWishlistItems(prev => prev.filter(item => item.product_slug !== productSlug));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  };

  const isInWishlist = (productSlug: string): boolean => {
    return wishlistItems.some(item => item.product_slug === productSlug);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        loading,
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
