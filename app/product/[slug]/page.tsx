"use client";

import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_BY_SLUG } from '@/lib/queries';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { GetProductBySlugResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleAlert as AlertCircle, ShoppingCart, Hop as Home, Heart, Bell, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState, use, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductGallery from '@/components/ProductGallery';
import ShareButtons from '@/components/ShareButtons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice, formatAttributeName, isStockAvailable } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import ProductVariationSelector from '@/components/ProductVariationSelector';
import ColorSwatch from '@/components/ColorSwatch';
import { isColorAttribute } from '@/lib/colors';
import ProductReviews from '@/components/ProductReviews';
import HiddenDiamond from '@/components/HiddenDiamond';
import RelatedProductsDisplay from '@/components/RelatedProductsDisplay';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = use(params);
  const slug = decodeURIComponent(rawSlug);
  const router = useRouter();
  const { loading, error, data } = useQuery<GetProductBySlugResponse>(GET_PRODUCT_BY_SLUG, {
    variables: { slug },
  });
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user, profile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmittingNotification, setIsSubmittingNotification] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [currentImages, setCurrentImages] = useState<any[]>([]);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<Record<string, string>>({});
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [hasHiddenDiamond, setHasHiddenDiamond] = useState(false);
  const [diamondPosition, setDiamondPosition] = useState<'title' | 'image' | 'description'>('title');

  useEffect(() => {
    if ((error || !data?.product) && !loading) {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [error, data, loading, router]);

  useEffect(() => {
    if (data?.product?.databaseId) {
      checkHiddenDiamondStatus(data.product.databaseId);
    }
  }, [data?.product?.databaseId]);

  const checkHiddenDiamondStatus = async (productId: number) => {
    try {
      const { data: diamondData, error } = await supabase
        .from('featured_products')
        .select('is_hidden_diamond')
        .eq('product_id', productId)
        .eq('is_hidden_diamond', true)
        .maybeSingle();

      if (error) throw error;

      if (diamondData) {
        setHasHiddenDiamond(true);
        const positions: ('title' | 'image' | 'description')[] = ['title', 'image', 'description'];
        const randomPosition = positions[Math.floor(Math.random() * positions.length)];
        setDiamondPosition(randomPosition);
      }
    } catch (error) {
      console.error('Error checking hidden diamond status:', error);
    }
  };

  const handleVariationChange = useCallback((variation: any, defaultImages: any[]) => {
    setSelectedVariation(variation);
    if (variation && variation.image) {
      setCurrentImages([variation.image, ...defaultImages]);
    } else {
      setCurrentImages(defaultImages);
    }
  }, []);

  const handleAttributeSelect = useCallback((attributeName: string, value: string, currentCharacteristics: Record<string, string>, variations: any[], variationAttributes: any[], defaultImages: any[]) => {
    console.log('🎨 Attribute selected:', attributeName, '=', value);

    const newSelectedCharacteristics = {
      ...currentCharacteristics,
      [attributeName]: value
    };
    setSelectedCharacteristics(newSelectedCharacteristics);

    console.log('📊 All selected characteristics:', newSelectedCharacteristics);
    console.log('🔍 Available variations:', variations.length);

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

    const selectedEntries = Object.entries(newSelectedCharacteristics);

    const exactMatch = variations.find(variation => {
      const matches = variation.attributes.every((varAttr: any) => {
        const found = selectedEntries.some(([selName, selValue]) => {
          const match = attributeMatches(varAttr.name, selName, varAttr.option, selValue);
          return match;
        });
        return found;
      }) && variation.attributes.length === selectedEntries.length;

      return matches;
    });

    console.log('✅ Exact match found:', exactMatch ? 'YES' : 'NO', exactMatch?.id);

    if (exactMatch) {
      console.log('💰 Setting price to:', exactMatch.price);
      console.log('🖼️ Setting image to:', exactMatch.image?.sourceUrl || 'default');
      setSelectedVariation(exactMatch);
      if (exactMatch.image) {
        setCurrentImages([exactMatch.image, ...defaultImages]);
      } else {
        setCurrentImages(defaultImages);
      }
      return;
    }

    const partialMatches = variations.filter(variation => {
      return selectedEntries.every(([selName, selValue]) => {
        return variation.attributes.some((varAttr: any) =>
          attributeMatches(varAttr.name, selName, varAttr.option, selValue)
        );
      });
    });

    console.log('🔎 Partial matches found:', partialMatches.length);

    if (partialMatches.length === 1) {
      console.log('💰 Setting price to (partial):', partialMatches[0].price);
      setSelectedVariation(partialMatches[0]);
      if (partialMatches[0].image) {
        setCurrentImages([partialMatches[0].image, ...defaultImages]);
      } else {
        setCurrentImages(defaultImages);
      }
    } else if (partialMatches.length > 1) {
      const bestMatch = partialMatches.find(v => v.image);
      if (bestMatch && bestMatch.image) {
        setCurrentImages([bestMatch.image, ...defaultImages]);
      } else if (partialMatches[0].image) {
        setCurrentImages([partialMatches[0].image, ...defaultImages]);
      }

      if (selectedEntries.length === variationAttributes.length) {
        console.log('💰 Setting price to (best of multiple):', partialMatches[0].price);
        setSelectedVariation(partialMatches[0]);
      } else {
        console.log('⚠️ Not enough attributes selected');
        setSelectedVariation(null);
      }
    } else {
      console.log('❌ No matches found - resetting');
      setSelectedVariation(null);
      setCurrentImages(defaultImages);
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="mb-6 h-5 w-64" />
          <div className="grid gap-8 lg:grid-cols-2 bg-white p-6 rounded-lg">
            <div className="space-y-4">
              <Skeleton className="aspect-[4/5] w-full rounded-lg" />
              <div className="grid grid-cols-6 gap-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4]" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.product) {
    console.error('❌ GraphQL Error:', error);
    console.error('❌ GraphQL Response:', data);
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#b8933d]/10 mb-6">
              <Sparkles className="w-10 h-10 text-[#b8933d]" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Oups, cette pépite a été victime de son succès !
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Mais ne t'inquiète pas, j'ai plein d'autres merveilles à te montrer.
            </p>
          </div>

          <Alert className="bg-white border-[#b8933d]/20 shadow-lg">
            <Sparkles className="h-5 w-5 text-[#b8933d]" />
            <AlertTitle className="text-lg font-semibold text-gray-900 mb-2">
              Redirection automatique dans {redirectCountdown} seconde{redirectCountdown > 1 ? 's' : ''}...
            </AlertTitle>
            <AlertDescription className="text-gray-700">
              <p className="mb-4">
                Ce produit n'est plus disponible, mais nos nouveautés vont te plaire !
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/" className="flex-1">
                  <Button className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white">
                    <Home className="w-4 h-4 mr-2" />
                    Découvrir nos nouveautés
                  </Button>
                </Link>
                <Link href="/promos" className="flex-1">
                  <Button variant="outline" className="w-full border-[#b8933d] text-[#b8933d] hover:bg-[#b8933d]/5">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Voir les promotions
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>

          {error && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Erreur technique : {error.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  const rawProduct = data.product;

  const product = {
    ...rawProduct,
    variations: rawProduct.variations?.nodes ? {
      nodes: rawProduct.variations.nodes.map((variation: any) => ({
        ...variation,
        attributes: variation.attributes?.nodes?.map((attr: any) => ({
          name: attr.name,
          option: attr.value || attr.option
        })) || []
      }))
    } : undefined
  };

  console.log('🔄 Raw product loaded:', rawProduct.name);
  console.log('🔄 Variations available:', rawProduct.variations?.nodes?.length || 0);
  if (rawProduct.variations?.nodes && rawProduct.variations.nodes.length > 0) {
    console.log('🔄 Raw variation sample:', rawProduct.variations.nodes[0]);
    console.log('🔄 Mapped variation sample:', product.variations?.nodes[0]);
    console.log('📦 Stock Status (raw):', rawProduct.variations.nodes[0].stockStatus);
    console.log('📦 Stock Quantity (raw):', rawProduct.variations.nodes[0].stockQuantity);
    console.log('📦 Stock Status (mapped):', product.variations?.nodes[0].stockStatus);
    console.log('📦 Stock Quantity (mapped):', product.variations?.nodes[0].stockQuantity);
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

  const handleAddToCart = () => {
    if (isVariable && selectedVariation) {
      const cartItem = {
        ...product,
        id: `${product.id}-${selectedVariation.id}`,
        variationId: selectedVariation.id,
        price: selectedVariation.price,
        variationPrice: selectedVariation.price,
        image: selectedVariation.image || product.image,
        variationImage: selectedVariation.image,
        selectedAttributes: selectedCharacteristics,
      };
      addToCart(cartItem, quantity);

      const attributesText = Object.entries(selectedCharacteristics)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      toast.success(`${quantity} × ${product.name} (${attributesText}) ajouté au panier !`);
    } else {
      const hasSelectedAttributes = Object.keys(selectedCharacteristics).length > 0;

      const cartItem = hasSelectedAttributes ? {
        ...product,
        id: `${product.id}-${Object.values(selectedCharacteristics).join('-')}`,
        selectedAttributes: selectedCharacteristics,
      } : product;

      addToCart(cartItem, quantity);

      if (hasSelectedAttributes) {
        const attributesText = Object.entries(selectedCharacteristics)
          .map(([key, value]) => `${formatAttributeName(key)}: ${value}`)
          .join(', ');
        toast.success(`${quantity} × ${product.name} (${attributesText}) ajouté au panier !`);
      } else {
        toast.success(`${quantity} × ${product.name} ajouté au panier !`);
      }
    }
  };

  const handleToggleWishlist = async () => {
    try {
      if (isInWishlist(product.slug)) {
        await removeFromWishlist(product.slug);
        toast.success(`${product.name} retiré de vos coups de cœur`);
      } else {
        await addToWishlist(product);
        toast.success(`${product.name} ajouté à vos coups de cœur !`);
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  const handleNotifyAvailability = async () => {
    if (!user && !notifyEmail) {
      setShowNotifyDialog(true);
      return;
    }

    setIsSubmittingNotification(true);

    try {
      const { error } = await supabase
        .from('product_availability_notifications')
        .insert({
          user_id: user?.id || null,
          product_slug: product.slug,
          product_name: product.name,
          email: user ? profile?.email : notifyEmail,
        });

      if (error) throw error;

      toast.success('Vous serez notifié quand ce produit sera de nouveau disponible !');
      setShowNotifyDialog(false);
      setNotifyEmail('');
    } catch (error) {
      toast.error('Erreur lors de l\'inscription à la notification');
    } finally {
      setIsSubmittingNotification(false);
    }
  };

  const inWishlist = isInWishlist(product.slug);
  const galleryImages = product.galleryImages?.nodes || [];
  const defaultImages = product.image ? [product.image, ...galleryImages] : galleryImages;
  const isVariable = product.__typename === 'VariableProduct';
  const variations = product.variations?.nodes || [];
  const variationAttributes = product.attributes?.nodes?.filter((attr: any) => attr.variation) || [];

  const wrappedHandleVariationChange = (variation: any) => {
    handleVariationChange(variation, defaultImages);
  };

  const wrappedHandleAttributeSelect = (attributeName: string, value: string) => {
    handleAttributeSelect(attributeName, value, selectedCharacteristics, variations, variationAttributes, defaultImages);
  };

  const allImages = currentImages.length > 0 ? currentImages : defaultImages;
  const displayPrice = selectedVariation ? selectedVariation.price : product.price;
  const displayRegularPrice = selectedVariation ? selectedVariation.regularPrice : product.regularPrice;
  const isOnSale = selectedVariation
    ? selectedVariation.salePrice && parseFloat(selectedVariation.salePrice) > 0
    : product.onSale;
  const displayStockQuantity = selectedVariation
    ? selectedVariation.stockQuantity
    : product.stockQuantity;
  const displayStockStatus = selectedVariation
    ? selectedVariation.stockStatus
    : product.stockStatus;
  const isProductInStock = isStockAvailable(displayStockStatus, displayStockQuantity);

  console.log('🏷️ Product:', product.name);
  console.log('📦 Is Variable:', isVariable);
  console.log('🎯 Variations count:', variations.length);
  console.log('🔧 Variation attributes:', variationAttributes.map((a: any) => a.name));

  if (variations.length > 0) {
    console.log('📋 First variation sample:', {
      id: variations[0].id,
      price: variations[0].price,
      attributes: variations[0].attributes.map((a: any) => ({
        name: a.name,
        option: a.option
      }))
    });
  }

  console.log('✨ Current selected variation:', selectedVariation?.id || 'none');
  console.log('💵 Display price:', displayPrice);
  console.log('🎨 Selected characteristics:', selectedCharacteristics);

  return (
    <>
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Être notifié de la disponibilité</DialogTitle>
            <DialogDescription>
              Recevez un email dès que {product.name} sera de nouveau en stock.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleNotifyAvailability}
              disabled={!notifyEmail || isSubmittingNotification}
            >
              {isSubmittingNotification ? 'Inscription...' : 'Me notifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-[#b8933d] flex items-center gap-1">
            <Home className="h-4 w-4" />
            Accueil
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-10">
            <div className="relative">
              {hasHiddenDiamond && diamondPosition === 'image' && product.databaseId && (
                <HiddenDiamond
                  diamondId={`product-${product.databaseId}`}
                  pageUrl={`/product/${product.slug}`}
                  inline={false}
                />
              )}
              <ProductGallery images={allImages} productName={product.name} />
            </div>

            <div className="space-y-6">
              <div>
                {hasHiddenDiamond && diamondPosition === 'title' && product.databaseId && (
                  <div className="mb-4">
                    <HiddenDiamond
                      diamondId={`product-${product.databaseId}`}
                      pageUrl={`/product/${product.slug}`}
                      inline={true}
                    />
                  </div>
                )}
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-3 flex-wrap">
                  {isOnSale && displayRegularPrice ? (
                    <>
                      <p className="text-2xl text-gray-500 line-through">
                        {formatPrice(displayRegularPrice)}
                      </p>
                      <p className="text-3xl lg:text-4xl font-bold text-[#b8933d]">
                        {formatPrice(displayPrice)}
                      </p>
                      <span className="bg-[#DF30CF] text-white px-3 py-1 rounded-full text-sm font-bold">
                        PROMO
                      </span>
                    </>
                  ) : (
                    <p className="text-3xl lg:text-4xl font-bold text-[#b8933d]">
                      {formatPrice(displayPrice)}
                    </p>
                  )}
                </div>
                {isVariable && !selectedVariation && (
                  <p className="text-sm text-gray-600 italic mt-2">
                    Sélectionnez les options ci-dessous pour découvrir le prix
                  </p>
                )}
              </div>

              {!isVariable && displayStockQuantity !== null && displayStockQuantity !== undefined && (
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      displayStockQuantity > 0 ? 'bg-[#B6914A]' : 'bg-[#DF30CF]'
                    }`}
                  />
                  <p className="text-sm font-medium">
                    {displayStockQuantity > 0 ? (
                      <span className="text-[#B6914A]">Produit disponible</span>
                    ) : (
                      <span className="text-[#DF30CF]">Rupture de stock</span>
                    )}
                  </p>
                </div>
              )}

              {isVariable && variationAttributes.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <ProductVariationSelector
                    variations={variations}
                    attributes={variationAttributes.map((attr: any) => ({
                      name: attr.name,
                      options: attr.options || []
                    }))}
                    onVariationChange={wrappedHandleVariationChange}
                    onAttributeSelect={wrappedHandleAttributeSelect}
                    externalSelectedAttributes={selectedCharacteristics}
                  />
                </div>
              )}

              {!isVariable && (product.attributes?.nodes && product.attributes.nodes.filter((attr: any) => !attr.variation).length > 0) && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Sélectionnez vos options</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {product.attributes.nodes.filter((attr: any) => !attr.variation).map((attr: any, index: number) => {
                      const isSizeAttribute = attr.name.toLowerCase().includes('taille');
                      const isColorAttr = isColorAttribute(attr.name);
                      const sortedOptions = isSizeAttribute ? sortSizes(attr.options || []) : (attr.options || []);
                      const normalizedAttrName = attr.name.replace(/^pa_/, '');
                      const isSelected = selectedCharacteristics[normalizedAttrName];

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              {formatAttributeName(attr.name)} <span className="text-red-500">*</span>
                            </label>
                            {isSelected && (
                              <span className="text-xs text-[#b8933d] font-medium">
                                Sélectionné : {isSelected}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sortedOptions.map((option: string, optIndex: number) => {
                              const isOptionSelected = selectedCharacteristics[normalizedAttrName] === option;

                              if (isColorAttr) {
                                return (
                                  <div key={optIndex} className="relative">
                                    <ColorSwatch
                                      color={option}
                                      isSelected={isOptionSelected}
                                      onClick={() => {
                                        setSelectedCharacteristics(prev => ({
                                          ...prev,
                                          [normalizedAttrName]: option
                                        }));
                                      }}
                                      size="md"
                                    />
                                  </div>
                                );
                              }

                              return (
                                <button
                                  key={optIndex}
                                  onClick={() => {
                                    setSelectedCharacteristics(prev => ({
                                      ...prev,
                                      [normalizedAttrName]: option
                                    }));
                                  }}
                                  className={`inline-flex items-center px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all ${
                                    isOptionSelected
                                      ? 'border-[#b8933d] bg-[#b8933d] text-white shadow-md'
                                      : 'border-gray-300 bg-white text-gray-700 hover:border-[#b8933d] hover:bg-[#b8933d]/5'
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                    Quantité:
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-gray-50 transition-colors"
                      aria-label="Diminuer la quantité"
                    >
                      -
                    </button>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 hover:bg-gray-50 transition-colors"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>

                {(() => {
                  const simpleProductAttributes = !isVariable ? (product.attributes?.nodes?.filter((attr: any) => !attr.variation) || []) : [];
                  const hasRequiredAttributes = simpleProductAttributes.length > 0;
                  const allAttributesSelected = simpleProductAttributes.every((attr: any) => {
                    const normalizedAttrName = attr.name.replace(/^pa_/, '');
                    return selectedCharacteristics[normalizedAttrName];
                  });

                  if (isVariable && !selectedVariation) {
                    return (
                      <Button
                        disabled
                        className="w-full bg-gray-400 text-white h-12 text-lg font-semibold cursor-not-allowed"
                      >
                        Veuillez sélectionner une option
                      </Button>
                    );
                  }

                  if (!isVariable && hasRequiredAttributes && !allAttributesSelected) {
                    return (
                      <Button
                        disabled
                        className="w-full bg-gray-400 text-white h-12 text-lg font-semibold cursor-not-allowed"
                      >
                        Veuillez sélectionner toutes les options
                      </Button>
                    );
                  }

                  if (!isProductInStock) {
                    return (
                      <Button
                        onClick={handleNotifyAvailability}
                        className="w-full bg-[#B6914A] hover:bg-[#a07c2f] text-white h-12 text-lg font-semibold"
                      >
                        <Bell className="mr-2 h-5 w-5" />
                        Me notifier quand disponible
                      </Button>
                    );
                  }

                  return (
                    <Button
                      onClick={handleAddToCart}
                      className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white h-12 text-lg font-semibold"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Ajouter au panier
                    </Button>
                  );
                })()}

                <div className="flex gap-3">
                  <Button
                    variant={inWishlist ? "default" : "outline"}
                    className={`flex-1 ${
                      inWishlist
                        ? 'bg-[#DF30CF] hover:bg-[#c82bb7] text-white border-[#DF30CF]'
                        : 'border-gray-300'
                    }`}
                    onClick={handleToggleWishlist}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
                    {inWishlist ? 'Dans mes coups de cœur' : 'Coups de cœur'}
                  </Button>
                  <ShareButtons
                    title={product.name}
                    description={product.description || ''}
                    imageUrl={product.image?.sourceUrl}
                    price={formatPrice(product.price)}
                  />
                </div>
              </div>

              {product.description && (
                <Accordion type="single" collapsible defaultValue="description" className="border-t">
                  {hasHiddenDiamond && diamondPosition === 'description' && product.databaseId && (
                    <div className="pt-4 pb-2">
                      <HiddenDiamond
                        diamondId={`product-${product.databaseId}`}
                        pageUrl={`/product/${product.slug}`}
                        inline={true}
                      />
                    </div>
                  )}
                  <AccordionItem value="description">
                    <AccordionTrigger className="text-lg font-semibold hover:text-[#b8933d]">
                      Description
                    </AccordionTrigger>
                    <AccordionContent>
                      <div
                        className="prose prose-sm text-gray-600 max-w-none"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="composition">
                    <AccordionTrigger className="text-lg font-semibold hover:text-[#b8933d]">
                      Composition & Entretien
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-gray-600 space-y-2">
                        <p>Composition à définir dans WordPress</p>
                        <p className="text-sm">Lavage: Suivre les instructions sur l&apos;étiquette</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="shipping">
                    <AccordionTrigger className="text-lg font-semibold hover:text-[#b8933d]">
                      Livraison & Retours
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-gray-600 space-y-2">
                        <p>Livraison standard : 1 à 5 jours ouvrés</p>
                        <p>Retours sous 14 jours</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <ProductReviews productId={product.databaseId?.toString() || product.id} productName={product.name} />
        </div>

        <RelatedProductsDisplay productId={product.databaseId?.toString() || product.id} />
      </div>
    </div>
    </>
  );
}
