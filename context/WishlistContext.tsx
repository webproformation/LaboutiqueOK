'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
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
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        throw error;
      }

      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
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
      const { data, error } = await supabase
        .from('wishlist_items')
        .insert({
          session_id: sessionId,
          product_slug: product.slug,
          product_name: product.name,
          product_image: product.image?.sourceUrl || null,
          product_price: product.price || '',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return;
        }
        throw error;
      }

      if (data) {
        setWishlistItems(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  };

  const removeFromWishlist = async (productSlug: string) => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('session_id', sessionId)
        .eq('product_slug', productSlug);

      if (error) throw error;

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
