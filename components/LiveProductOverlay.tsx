'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface LiveProductOverlayProps {
  product: {
    id: string;
    product_name: string;
    product_image: string;
    original_price: number;
    promo_price: number;
    live_sku: string;
  };
  onClose?: () => void;
  showCloseButton?: boolean;
  position?: 'bottom-left' | 'bottom-right';
}

export function LiveProductOverlay({
  product,
  onClose,
  showCloseButton = false,
  position = 'bottom-left',
}: LiveProductOverlayProps) {
  const [isHidden, setIsHidden] = useState(false);

  if (!product) return null;
  if (isHidden) return null;

  const positionClasses = {
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
  };

  const handleClose = () => {
    setIsHidden(true);
    onClose?.();
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} animate-in fade-in slide-in-from-bottom-8 duration-500`}
      style={{ zIndex: 100 }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden max-w-sm w-80">
        {showCloseButton && (
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            aria-label="Masquer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex gap-4 p-4">
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {product.product_image ? (
              <Image
                src={product.product_image}
                alt={product.product_name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            <div className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              LIVE
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight mb-2">
              {product.product_name}
            </h3>

            <div className="flex items-baseline gap-2 mb-3">
              {product.original_price > product.promo_price && (
                <span className="text-gray-400 line-through text-sm">
                  {product.original_price.toFixed(2)}€
                </span>
              )}
              <span className="text-red-600 font-bold text-2xl">
                {product.promo_price.toFixed(2)}€
              </span>
            </div>

            <button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              Acheter
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-pink-50 px-4 py-2 border-t border-red-100">
          <p className="text-xs text-gray-600 text-center">
            ⚡ Offre limitée • Expire bientôt
          </p>
        </div>
      </div>
    </div>
  );
}
