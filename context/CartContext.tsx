"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  price: string;
  image?: { sourceUrl: string };
  quantity: number;
  variationId?: string | null;
  variationPrice?: string | null;
  variationImage?: any;
  selectedAttributes?: Record<string, string>;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const parsePrice = (price: string | number): number => {
    if (typeof price === 'number') return price;
    const cleaned = price.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const loadCartFromLocalStorage = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  };

  const saveCartToLocalStorage = (cartItems: CartItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  };

  const loadCartFromSupabase = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading cart from Supabase:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.product_id,
      name: item.product_name,
      slug: item.product_slug,
      price: item.product_price,
      image: item.product_image_url ? { sourceUrl: item.product_image_url } : undefined,
      quantity: item.quantity,
      variationId: item.variation_id === 'default' ? null : item.variation_id,
      variationPrice: item.variation_data?.price || null,
      variationImage: item.variation_data?.image || null,
      selectedAttributes: item.variation_data?.attributes || {},
    }));
  };

  const syncCartToSupabase = useCallback(async (cartItems: CartItem[], showToast = false) => {
    if (!user) return;

    try {
      const itemsToUpsert = cartItems.map(item => ({
        user_id: user.id,
        product_id: item.id,
        product_name: item.name,
        product_slug: item.slug,
        product_price: item.price,
        product_image_url: item.image?.sourceUrl || null,
        quantity: item.quantity,
        variation_id: item.variationId || 'default',
        variation_data: item.variationId && item.variationId !== 'default' ? {
          price: item.variationPrice,
          image: item.variationImage,
          attributes: item.selectedAttributes,
        } : null,
        updated_at: new Date().toISOString(),
      }));

      if (itemsToUpsert.length > 0) {
        const { error } = await supabase
          .from('cart_items')
          .upsert(itemsToUpsert, {
            onConflict: 'user_id,product_id,variation_id',
          });

        if (error) {
          console.error('Error syncing cart to Supabase:', error);
          throw error;
        }
      }

      const cartProductIds = cartItems.map(item => item.id);

      if (cartProductIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .not('product_id', 'in', `(${cartProductIds.map(id => `"${id}"`).join(',')})`);

        if (deleteError) {
          console.error('Error cleaning up cart items:', deleteError);
        }
      } else {
        await supabase.from('cart_items').delete().eq('user_id', user.id);
      }

      if (showToast) {
        toast.success('Panier sauvegardé', {
          position: 'bottom-right',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }, [user]);

  useEffect(() => {
    const initCart = async () => {
      setLoading(true);

      if (user) {
        const supabaseCart = await loadCartFromSupabase();
        const localCart = loadCartFromLocalStorage();

        const mergedCart: CartItem[] = [...supabaseCart];
        let hasMerged = false;

        localCart.forEach(localItem => {
          const existingIndex = mergedCart.findIndex(
            item => item.id === localItem.id && item.variationId === localItem.variationId
          );
          if (existingIndex >= 0) {
            mergedCart[existingIndex].quantity += localItem.quantity;
            hasMerged = true;
          } else {
            mergedCart.push(localItem as CartItem);
            hasMerged = true;
          }
        });

        setCart(mergedCart);
        await syncCartToSupabase(mergedCart, hasMerged || mergedCart.length > 0);
        localStorage.removeItem('cart');
      } else {
        const localCart = loadCartFromLocalStorage();
        setCart(localCart);
      }

      setLoading(false);
    };

    initCart();
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const timeoutId = setTimeout(() => {
      if (user) {
        syncCartToSupabase(cart, false);
      } else {
        saveCartToLocalStorage(cart);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [cart, user, loading, syncCartToSupabase]);

  const addToCart = (product: any, quantity: number = 1) => {
    const cartItemId = product.variationId
      ? `${product.id}-${product.variationId}`
      : product.id;

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(
        item => item.id === product.id && item.variationId === product.variationId
      );

      if (existingIndex >= 0) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += quantity;
        toast.success('Quantité mise à jour', {
          position: 'bottom-right',
        });
        return updatedCart;
      } else {
        toast.success('Article ajouté au panier', {
          position: 'bottom-right',
        });
        const newItem: CartItem = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku || null,
          price: product.price,
          image: product.image,
          quantity,
          variationId: product.variationId || null,
          variationPrice: product.variationPrice || null,
          variationImage: product.variationImage || null,
          selectedAttributes: product.selectedAttributes || {},
        };
        return [...prevCart, newItem];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => {
        const itemId = item.variationId ? `${item.id}-${item.variationId}` : item.id;
        return itemId !== productId;
      });
      toast.success('Article retiré du panier', {
        position: 'bottom-right',
      });
      return newCart;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => {
      return prevCart.map(item => {
        const itemId = item.variationId ? `${item.id}-${item.variationId}` : item.id;
        if (itemId === productId) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('cart');

    if (user) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
    }

    toast.success('Panier vidé', {
      position: 'bottom-right',
    });
  };

  const cartTotal = cart.reduce((total, item) => {
    const price = parsePrice(item.variationPrice || item.price);
    return total + (price * item.quantity);
  }, 0);

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

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
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
