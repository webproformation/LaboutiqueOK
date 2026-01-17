'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ColorSwatchProps {
  colorName: string;
  isSelected: boolean;
  onClick: () => void;
  imageUrl?: string | null;
}

export function ColorSwatch({ colorName, isSelected, onClick, imageUrl }: ColorSwatchProps) {
  const [colorHex, setColorHex] = useState<string | null>(null);

  useEffect(() => {
    loadColorInfo();
  }, [colorName]);

  const loadColorInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('product_attribute_terms')
        .select('value, color_family')
        .ilike('name', colorName)
        .limit(1)
        .maybeSingle();

      if (!error && data?.value) {
        setColorHex(data.value);
      }
    } catch (error) {
      console.error('Error loading color info:', error);
    }
  };

  const getColorStyle = () => {
    if (imageUrl) {
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }

    if (colorHex) {
      return {
        backgroundColor: colorHex
      };
    }

    const colorMap: Record<string, string> = {
      'noir': '#000000',
      'black': '#000000',
      'blanc': '#FFFFFF',
      'white': '#FFFFFF',
      'rouge': '#DC2626',
      'red': '#DC2626',
      'bleu': '#2563EB',
      'blue': '#2563EB',
      'vert': '#16A34A',
      'green': '#16A34A',
      'jaune': '#EAB308',
      'yellow': '#EAB308',
      'rose': '#EC4899',
      'pink': '#EC4899',
      'violet': '#9333EA',
      'purple': '#9333EA',
      'orange': '#EA580C',
      'marron': '#92400E',
      'brown': '#92400E',
      'gris': '#6B7280',
      'grey': '#6B7280',
      'gray': '#6B7280',
      'beige': '#D2B48C',
      'kaki': '#8B864E',
      'navy': '#1E3A8A',
      'marine': '#1E3A8A',
    };

    const colorNameLower = colorName.toLowerCase();
    for (const [key, value] of Object.entries(colorMap)) {
      if (colorNameLower.includes(key)) {
        return { backgroundColor: value };
      }
    }

    return {
      backgroundColor: '#F3F4F6',
      border: '1px solid #D1D5DB'
    };
  };

  const needsBorder = colorName.toLowerCase().includes('blanc') ||
                      colorName.toLowerCase().includes('white') ||
                      colorName.toLowerCase().includes('beige');

  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={onClick}>
      <div
        className={`w-12 h-12 rounded-full transition-all ${
          isSelected
            ? 'ring-4 ring-[#D4AF37] ring-offset-2 scale-110'
            : 'ring-2 ring-gray-300 hover:ring-[#D4AF37] hover:scale-105'
        } ${needsBorder ? 'border border-gray-300' : ''}`}
        style={getColorStyle()}
      />
      <span className={`text-xs text-center max-w-[80px] leading-tight ${
        isSelected ? 'font-semibold text-[#D4AF37]' : 'text-gray-600 group-hover:text-[#D4AF37]'
      }`}>
        {colorName}
      </span>
    </div>
  );
}
