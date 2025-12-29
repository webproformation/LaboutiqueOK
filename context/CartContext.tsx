"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem, Product } from '@/types';
import { parsePrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();
  const [previousUserId, setPreviousUserId] = useState<string | undefined>(undefined);

  const loadCartFromSupabase = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-cart-items?user_id=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          }
        }
      );
      if (!response.ok) {
        console.error('Error loading cart from edge function');
        return [];
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((item: any) => {
        if (!item?.product_id || !item?.product_name) {
          console.error('Invalid cart item from database:', item);
          return null;
        }

        const variationData = item.variation_data || {};
        const cartItem: CartItem = {
          id: item.product_id || '',
          name: item.product_name || 'Unknown Product',
          slug: item.product_slug || '',
          price: item.product_price || '0',
          image: item.product_image_url ? { sourceUrl: item.product_image_url } : undefined,
          quantity: item.quantity || 1,
          variationId: item.variation_id || variationData.variationId || undefined,
          variationPrice: variationData.variationPrice || undefined,
          variationImage: variationData.variationImage || undefined,
          selectedAttributes: variationData.selectedAttributes || {},
        };
        return cartItem;
      }).filter((item: CartItem | null): item is CartItem => item !== null);
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }, [user]);

  const syncCartToSupabase = useCallback(async (cartItems: CartItem[]) => {
    if (!user?.id || isSyncing) return;

    setIsSyncing(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-cart-items?user_id=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch existing items');

      const existingItems = await response.json();

      const existingKeys = new Set<string>(
        (existingItems || []).map((item: any) =>
          `${item.product_id}_${item.variation_id || ''}`
        )
      );

      const currentKeys = new Set<string>(
        cartItems.map(item =>
          `${item.id}_${item.variationId || ''}`
        )
      );

      const keysToDelete = Array.from(existingKeys).filter((key: string) => !currentKeys.has(key));

      if (keysToDelete.length > 0) {
        for (const key of keysToDelete) {
          const existingItem = existingItems.find((item: any) =>
            `${item.product_id}_${item.variation_id || ''}` === key
          );

          if (existingItem) {
            await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-cart-items`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ action: 'delete', id: existingItem.id })
              }
            );
          }
        }
      }

      if (cartItems.length > 0) {
        const itemsToUpsert = cartItems.map((item) => {
          if (!item?.id || !item?.name || !item?.slug || !(item?.price || item?.variationPrice)) {
            console.error('Invalid cart item:', item);
            return null;
          }

          return {
            user_id: user.id,
            product_id: item.id,
            product_name: item.name,
            product_slug: item.slug,
            product_price: item.variationPrice || item.price || '0',
            product_image_url: item.image?.sourceUrl || null,
            quantity: item.quantity || 1,
            variation_id: item.variationId || null,
            variation_data: (item.variationId || item.selectedAttributes) ? {
              variationId: item.variationId || null,
              variationPrice: item.variationPrice || null,
              variationImage: item.variationImage || null,
              selectedAttributes: item.selectedAttributes || {},
            } : null,
          };
        }).filter(item => item !== null);

        if (itemsToUpsert.length > 0) {
          for (const item of itemsToUpsert) {
            await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-cart-items`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ action: 'add', ...item })
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error syncing cart to Supabase:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing]);

  useEffect(() => {
    if (previousUserId !== user?.id) {
      setIsInitialized(false);
      setPreviousUserId(user?.id);
    }
  }, [user?.id, previousUserId]);

  useEffect(() => {
    const initializeCart = async () => {
      if (isInitialized) return;

      const localCart = localStorage.getItem('cart');
      const localCartItems: CartItem[] = localCart ? JSON.parse(localCart) : [];

      if (user?.id) {
        try {
          const supabaseCart = await loadCartFromSupabase();

          const mergedCart = [...supabaseCart];
          localCartItems.forEach((localItem) => {
            const existingItem = mergedCart.find((item) => item.id === localItem.id);
            if (existingItem) {
              existingItem.quantity = Math.max(existingItem.quantity, localItem.quantity);
            } else {
              mergedCart.push({
                ...localItem,
                image: localItem.image || null,
                variationId: localItem.variationId || null,
                variationPrice: localItem.variationPrice || null,
                variationImage: localItem.variationImage || null,
                selectedAttributes: localItem.selectedAttributes || {},
              } as any);
            }
          });

          setCart(mergedCart);

          if (mergedCart.length > 0 && localCartItems.length > 0) {
            await syncCartToSupabase(mergedCart);
          }

          localStorage.removeItem('cart');
        } catch (error) {
          console.error('Error initializing cart:', error);
          setCart(localCartItems);
        }
      } else {
        setCart(localCartItems);
      }

      setIsInitialized(true);
    };

    initializeCart();
  }, [user?.id, loadCartFromSupabase, syncCartToSupabase, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    const syncTimer = setTimeout(() => {
      if (user) {
        syncCartToSupabase(cart);
      } else {
        localStorage.setItem('cart', JSON.stringify(cart));
      }
    }, 500);

    return () => clearTimeout(syncTimer);
  }, [cart, isInitialized, user, syncCartToSupabase]);

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!product?.id || !product?.name || !product?.slug || !product?.price) {
      console.error('Invalid product data:', product);
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => {
    if (!item) return total;
    try {
      const price = parsePrice(item.variationPrice || item.price);
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    } catch (error) {
      console.error('Error calculating cart item price:', item, error);
      return total;
    }
  }, 0);

  const cartItemCount = cart.reduce((count, item) => {
    if (!item) return count;
    return count + (item.quantity || 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
