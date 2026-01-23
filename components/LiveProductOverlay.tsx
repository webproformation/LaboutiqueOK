'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

export function LiveProductOverlay() {
  const [activeLiveId, setActiveLiveId] = useState<string | null>(null);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { addToCart } = useCart();

  // 1. Trouver le live actif au chargement
  useEffect(() => {
    checkActiveLive();
    
    // Écouter si un live démarre/s'arrête
    const statusChannel = supabase.channel('global_live_status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_streams' }, 
        () => checkActiveLive()
      )
      .subscribe();

    return () => { supabase.removeChannel(statusChannel); };
  }, []);

  // 2. Écouter les produits SI un live est actif
  useEffect(() => {
    if (!activeLiveId) return;

    const productChannel = supabase.channel(`overlay_products_${activeLiveId}`)
      .on(
        'postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_shared_products',
          filter: `live_stream_id=eq.${activeLiveId}`, 
        },
        async (payload) => {
          // On ne lit plus juste la table 'products', mais la table 'live_shared_products'
          // pour récupérer le PRIX PROMO défini par l'admin
          const { data: sharedData } = await supabase
            .from('live_shared_products')
            .select('*, products(*)') 
            .eq('id', payload.new.id)
            .single();

          if (sharedData && sharedData.products) {
            // On construit un objet "Intelligent" qui priorise le prix du live
            const productToDisplay = {
               ...sharedData.products,
               // Le prix affiché est le prix promo du live, sinon le prix normal
               price: sharedData.promo_price || sharedData.products.sale_price || sharedData.products.regular_price,
               // On garde le prix d'origine pour l'afficher barré
               original_price: sharedData.original_price || sharedData.products.regular_price
            };

            setCurrentProduct(productToDisplay);
            setIsVisible(true);
            
            // Auto-hide après 15s
            setTimeout(() => setIsVisible(false), 15000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(productChannel); };
  }, [activeLiveId]);

  async function checkActiveLive() {
    const { data } = await supabase
      .from('live_streams')
      .select('id')
      .eq('status', 'live')
      .maybeSingle();
    
    setActiveLiveId(data?.id || null);
  }

  const handleAddToCart = () => {
    if (currentProduct) {
      // On ajoute au panier avec le PRIX SPÉCIAL LIVE
      // Assurez-vous que votre CartContext gère la surcharge de prix
      addToCart({
          ...currentProduct,
          price: currentProduct.price // On force le prix promo
      });
      toast.success('Ajouté au panier !');
      setIsVisible(false);
    }
  };

  if (!currentProduct || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="relative bg-white rounded-xl shadow-2xl border-2 border-[#D4AF37] p-4 w-72 md:w-80">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 hover:bg-gray-700 shadow-md"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
            {currentProduct.image_url && (
              <img 
                src={currentProduct.image_url} 
                alt={currentProduct.name || "Produit en direct"} 
                className="w-full h-full object-cover" 
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                EN DIRECT
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
              {currentProduct.name}
            </h3>
            
            {/* AFFICHAGE DU PRIX AMÉLIORÉ */}
            <div className="flex items-baseline gap-2">
                <p className="text-[#D4AF37] font-bold text-lg">{currentProduct.price}€</p>
                {/* Si le prix original est plus cher, on l'affiche barré */}
                {currentProduct.original_price > currentProduct.price && (
                    <span className="text-xs text-gray-400 line-through">
                        {currentProduct.original_price}€
                    </span>
                )}
            </div>
          </div>
        </div>

        <Button onClick={handleAddToCart} className="w-full mt-3 bg-[#D4AF37] hover:bg-[#b8933d] text-white font-bold">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Acheter maintenant
        </Button>
      </div>
    </div>
  );
}