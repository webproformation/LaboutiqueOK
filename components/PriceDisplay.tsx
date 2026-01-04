"use client";

interface PriceDisplayProps {
  price: number | string;
  salePrice?: number | string | null;
  className?: string;
  showTTC?: boolean;
}

export default function PriceDisplay({ price, salePrice, className = '', showTTC = true }: PriceDisplayProps) {
  const hasDiscount = salePrice && parseFloat(salePrice.toString()) > 0 && parseFloat(salePrice.toString()) < parseFloat(price.toString());
  const displayPrice = hasDiscount ? parseFloat(salePrice.toString()) : parseFloat(price.toString());
  const originalPrice = parseFloat(price.toString());

  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      {hasDiscount && (
        <span className="text-gray-500 line-through">
          {originalPrice.toFixed(2)}€
          {showTTC && <span className="text-xs ml-1">TTC</span>}
        </span>
      )}
      <span className={hasDiscount ? 'text-red-600 font-bold' : 'font-bold'}>
        {displayPrice.toFixed(2)}€
        {showTTC && <span className="text-xs ml-1">TTC</span>}
      </span>
    </div>
  );
}
