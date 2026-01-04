import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Product } from '@/types';

interface ClientMeasurements {
  preferred_size_bottom?: string;
  preferred_size_top?: string;
}

export function useClientSize() {
  const { user } = useAuth();
  const [preferredSizeBottom, setPreferredSizeBottom] = useState<string | null>(null);
  const [preferredSizeTop, setPreferredSizeTop] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchPreferredSizes();
    } else {
      setPreferredSizeBottom(null);
      setPreferredSizeTop(null);
      setLoading(false);
    }
  }, [user?.id]);

  const fetchPreferredSizes = async () => {
    try {
      const { data, error } = await supabase
        .from('client_measurements')
        .select('preferred_size_bottom, preferred_size_top')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setPreferredSizeBottom(data?.preferred_size_bottom || null);
      setPreferredSizeTop(data?.preferred_size_top || null);
    } catch (error) {
      console.error('Error fetching preferred sizes:', error);
      setPreferredSizeBottom(null);
      setPreferredSizeTop(null);
    } finally {
      setLoading(false);
    }
  };

  const getSizesForCategory = (category: string): string[] => {
    if (category === 'PETITES TAILLES (36 au 44)') {
      return ['36', '38', '40', '42', '44'];
    } else if (category === 'GRANDES TAILLES (46 – 54)') {
      return ['46', '48', '50', '52', '54'];
    }
    return [];
  };

  const isProductInMySize = (product: Product): boolean => {
    if ((!preferredSizeBottom && !preferredSizeTop) || !product) return false;

    const sizeAttribute = product.attributes?.nodes?.find(
      attr => {
        const attrName = attr.name?.toLowerCase() || '';
        const attrSlug = attr.slug?.toLowerCase() || '';
        return attrName === 'taille' ||
               attrName === 'tailles' ||
               attrName === 'size' ||
               attrSlug === 'pa_taille' ||
               attrSlug === 'pa_tailles' ||
               attrSlug === 'pa_size';
      }
    );

    if (!sizeAttribute || !sizeAttribute.options) return false;

    const bottomSizes = preferredSizeBottom ? getSizesForCategory(preferredSizeBottom) : [];
    const topSizes = preferredSizeTop ? getSizesForCategory(preferredSizeTop) : [];
    const allPreferredSizes = Array.from(new Set([...bottomSizes, ...topSizes]));

    // Check if product options contain individual sizes OR size categories
    return sizeAttribute.options.some(option => {
      const optionTrimmed = option.trim();

      // Check if it's an individual size (36, 38, etc.)
      if (allPreferredSizes.includes(optionTrimmed)) {
        return true;
      }

      // Check if it's a size category that matches user preferences
      const optionUpper = optionTrimmed.toUpperCase();

      // Check if the option matches the user's preferred categories
      if (preferredSizeBottom && optionUpper === preferredSizeBottom.toUpperCase()) {
        return true;
      }

      if (preferredSizeTop && optionUpper === preferredSizeTop.toUpperCase()) {
        return true;
      }

      // Check if option is a category that contains any of the preferred sizes
      if (optionUpper.includes('PETITES TAILLES') && allPreferredSizes.some(size => ['36', '38', '40', '42', '44'].includes(size))) {
        return true;
      }

      if (optionUpper.includes('GRANDES TAILLES') && allPreferredSizes.some(size => ['46', '48', '50', '52', '54'].includes(size))) {
        return true;
      }

      return false;
    });
  };

  return {
    preferredSizeBottom,
    preferredSizeTop,
    loading,
    isProductInMySize,
  };
}
