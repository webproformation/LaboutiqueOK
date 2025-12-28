"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProductVariation } from '@/types';
import ColorSwatch from '@/components/ColorSwatch';
import { isColorAttribute } from '@/lib/colors';
import { isStockAvailable } from '@/lib/utils';

interface Attribute {
  name: string;
  options: string[];
}

interface ProductVariationSelectorProps {
  variations: ProductVariation[];
  attributes: Attribute[];
  onVariationChange: (variation: ProductVariation | null) => void;
  onAttributeSelect?: (attributeName: string, value: string) => void;
  externalSelectedAttributes?: Record<string, string>;
}

const sizeOrder = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];

const sortSizes = (options: string[]) => {
  return [...options].sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aIndex = sizeOrder.indexOf(aLower);
    const bIndex = sizeOrder.indexOf(bLower);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });
};

const normalizeAttributeName = (name: string) => {
  return name.toLowerCase()
    .replace(/^pa_/, '')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .trim();
};

const attributeMatches = (varAttrName: string, selectedAttrName: string, varAttrValue: string, selectedValue: string) => {
  const normalizedVarAttr = normalizeAttributeName(varAttrName);
  const normalizedSelectedAttr = normalizeAttributeName(selectedAttrName);

  return (normalizedVarAttr === normalizedSelectedAttr || varAttrName.toLowerCase() === selectedAttrName.toLowerCase()) &&
         varAttrValue.toLowerCase() === selectedValue.toLowerCase();
};

export default function ProductVariationSelector({
  variations,
  attributes,
  onVariationChange,
  onAttributeSelect: onAttributeSelectCallback,
  externalSelectedAttributes
}: ProductVariationSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  useEffect(() => {
    if (externalSelectedAttributes) {
      setSelectedAttributes(externalSelectedAttributes);
    }
  }, [externalSelectedAttributes]);

  useEffect(() => {
    const selectedEntries = Object.entries(selectedAttributes);
    console.log('🎛️ ProductVariationSelector - useEffect triggered with:', selectedAttributes);

    const matchingVariation = variations.find(variation => {
      const matches = variation.attributes.every(varAttr => {
        const found = selectedEntries.some(([selName, selValue]) =>
          attributeMatches(varAttr.name, selName, varAttr.option, selValue)
        );
        return found;
      }) && variation.attributes.length === selectedEntries.length;

      return matches;
    });

    console.log('🎛️ ProductVariationSelector - matching variation:', matchingVariation?.id || 'none');

    const newVariation = matchingVariation || null;

    if (newVariation?.id !== selectedVariation?.id) {
      setSelectedVariation(newVariation);
      onVariationChange(newVariation);
    }
  }, [selectedAttributes, variations]);

  const handleAttributeSelect = (attributeName: string, value: string) => {
    console.log('🎛️ ProductVariationSelector - handleAttributeSelect:', attributeName, '=', value);

    setSelectedAttributes(prev => {
      const newAttrs = {
        ...prev,
        [attributeName]: value
      };
      console.log('🎛️ ProductVariationSelector - new selected attributes:', newAttrs);
      return newAttrs;
    });

    if (onAttributeSelectCallback) {
      console.log('🎛️ ProductVariationSelector - calling parent callback');
      onAttributeSelectCallback(attributeName, value);
    } else {
      console.log('⚠️ ProductVariationSelector - no parent callback provided');
    }
  };

  const isAttributeValueAvailable = (attributeName: string, value: string) => {
    const otherSelectedAttributes = Object.entries(selectedAttributes)
      .filter(([name]) => normalizeAttributeName(name) !== normalizeAttributeName(attributeName));

    if (otherSelectedAttributes.length === 0) {
      return variations.some(variation => {
        const matchesCurrent = variation.attributes.some(varAttr =>
          attributeMatches(varAttr.name, attributeName, varAttr.option, value)
        );
        return matchesCurrent && isStockAvailable(variation.stockStatus, variation.stockQuantity);
      });
    }

    return variations.some(variation => {
      const matchesOthers = otherSelectedAttributes.every(([name, selectedValue]) => {
        return variation.attributes.some(varAttr =>
          attributeMatches(varAttr.name, name, varAttr.option, selectedValue)
        );
      });

      const matchesCurrent = variation.attributes.some(varAttr =>
        attributeMatches(varAttr.name, attributeName, varAttr.option, value)
      );

      return matchesOthers && matchesCurrent && isStockAvailable(variation.stockStatus, variation.stockQuantity);
    });
  };

  const formatDisplayName = (name: string) => {
    return name
      .replace(/^pa_/, '')
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {attributes.map((attribute) => {
        const isSizeAttribute = attribute.name.toLowerCase().includes('taille');
        const isColorAttr = isColorAttribute(attribute.name);
        const sortedOptions = isSizeAttribute ? sortSizes(attribute.options) : attribute.options;

        return (
        <div key={attribute.name}>
          <Label className="text-base font-semibold mb-3 block">
            {formatDisplayName(attribute.name)}
          </Label>
          <div className="flex flex-wrap gap-2 items-center">
            {sortedOptions.map((option) => {
              const isSelected = selectedAttributes[attribute.name] === option;
              const isAvailable = isAttributeValueAvailable(attribute.name, option);

              if (isColorAttr) {
                return (
                  <div
                    key={option}
                    className={`relative ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                    title={!isAvailable ? 'Rupture de stock' : ''}
                  >
                    <ColorSwatch
                      color={option}
                      isSelected={isSelected}
                      onClick={() => isAvailable && handleAttributeSelect(attribute.name, option)}
                      size="md"
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-[2px] bg-red-500 rotate-45 transform scale-110" />
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Button
                  key={option}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className={`
                    ${isSelected
                      ? 'bg-[#b8933d] hover:bg-[#a07c2f] text-white border-[#b8933d]'
                      : 'border-gray-300 hover:border-[#b8933d]'
                    }
                    ${!isAvailable ? 'opacity-40 cursor-not-allowed line-through decoration-2 decoration-red-500' : ''}
                  `}
                  onClick={() => handleAttributeSelect(attribute.name, option)}
                  disabled={!isAvailable}
                  title={!isAvailable ? 'Rupture de stock' : ''}
                >
                  {option}
                </Button>
              );
            })}
          </div>
        </div>
        );
      })}

      {selectedVariation && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`h-3 w-3 rounded-full ${
                isStockAvailable(selectedVariation.stockStatus, selectedVariation.stockQuantity) ? 'bg-[#B6914A]' : 'bg-[#DF30CF]'
              }`}
            />
            <p className="text-sm font-medium">
              {isStockAvailable(selectedVariation.stockStatus, selectedVariation.stockQuantity) ? (
                <span className="text-[#B6914A]">
                  Disponible
                  {selectedVariation.stockQuantity !== null && selectedVariation.stockQuantity !== undefined && ` (${selectedVariation.stockQuantity} en stock)`}
                </span>
              ) : (
                <span className="text-[#DF30CF]">Rupture de stock</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
