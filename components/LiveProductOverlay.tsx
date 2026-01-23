'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface LiveProductOverlayProps {
  liveStreamId: string;
}

export function LiveProductOverlay({ liveStreamId }: LiveProductOverlayProps) {
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    // 1. On écoute les nouveaux produits partagés en temps réel
    const channel = supabase
      .channel('public:live_shared_products')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_shared_products',
          filter: `live_stream_id=eq.${liveStreamId}`,
        },
        async (payload) => {
          // Quand un produit est partagé, on récupère ses infos complètes
          const { data: productData } = await supabase
            .from('products')
            .select('*')
            .eq('id', payload.new.product_id)
            .single();

          if (productData) {
            setCurrentProduct(productData);
            setIsVisible(true);

            // Le popup disparaît tout seul après 15 secondes (optionnel)
            setTimeout(() => setIsVisible(false), 15000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveStreamId]);

  const handleAddToCart = () => {
    if (currentProduct) {
      addToCart(currentProduct);
      toast.success('Produit ajouté au panier !');
    }
  };

  if (!currentProduct || !isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="relative bg-white rounded-xl shadow-2xl border-2 border-[#D4AF37] p-4 w-72 md:w-80">
        
        {/* Bouton Fermer */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 hover:bg-gray-700 shadow-md"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4">
          {/* Image */}
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
            {currentProduct.image_url ? (
              <img src={currentProduct.image_url} alt={currentProduct.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                À L'ÉCRAN
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
              {currentProduct.name}
            </h3>
            <p className="text-[#D4AF37] font-bold text-lg">
              {currentProduct.price}€
            </p>
          </div>
        </div>

        {/* Bouton Action */}
        <Button 
          onClick={handleAddToCart}
          className="w-full mt-3 bg-[#D4AF37] hover:bg-[#b8933d] text-white font-bold"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Ajouter au panier
        </Button>
      </div>
    </div>
  );
}