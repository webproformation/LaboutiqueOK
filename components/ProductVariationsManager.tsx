"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase-client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MediaLibrary from '@/components/MediaLibrary';

interface ProductVariation {
  id?: string;
  attribute_term_id: string;
  term_name: string;
  image_url: string;
  price: string;
  sale_price: string;
  is_main_image: boolean;
  stock_quantity: number;
}

interface ProductVariationsManagerProps {
  productId: string;
  attributes: Array<{ attribute_id: string; term_ids: string[] }>;
}

export default function ProductVariationsManager({ productId, attributes }: ProductVariationsManagerProps) {
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [currentEditingTermId, setCurrentEditingTermId] = useState<string | null>(null);

  useEffect(() => {
    if (productId && attributes.length > 0) {
      loadVariations();
    }
  }, [productId, attributes]);

  const loadVariations = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const allTermIds = attributes.flatMap(attr => attr.term_ids);
      if (allTermIds.length === 0) {
        setVariations([]);
        return;
      }

      const { data: terms, error: termsError } = await supabase
        .from('product_attribute_terms')
        .select('id, name')
        .in('id', allTermIds);

      if (termsError) throw termsError;

      const { data: existingVariations, error: variationsError } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', productId)
        .in('attribute_term_id', allTermIds);

      if (variationsError) throw variationsError;

      const variationsMap = new Map(existingVariations?.map(v => [v.attribute_term_id, v]) || []);

      const allVariations: ProductVariation[] = (terms || []).map(term => {
        const existing = variationsMap.get(term.id);
        return {
          id: existing?.id,
          attribute_term_id: term.id,
          term_name: term.name,
          image_url: existing?.image_url || '',
          price: existing?.price?.toString() || '',
          sale_price: existing?.sale_price?.toString() || '',
          is_main_image: existing?.is_main_image || false,
          stock_quantity: existing?.stock_quantity || 0,
        };
      });

      setVariations(allVariations);
    } catch (error) {
      console.error('Error loading variations:', error);
      toast.error('Erreur lors du chargement des variations');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVariations = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      const variationsToUpsert = variations.map(v => ({
        id: v.id,
        product_id: productId,
        attribute_term_id: v.attribute_term_id,
        image_url: v.image_url || '',
        price: v.price ? parseFloat(v.price) : 0,
        sale_price: v.sale_price ? parseFloat(v.sale_price) : null,
        is_main_image: v.is_main_image,
        stock_quantity: v.stock_quantity || 0,
      }));

      const { error } = await supabase
        .from('product_variations')
        .upsert(variationsToUpsert, {
          onConflict: 'product_id,attribute_term_id',
          ignoreDuplicates: false,
        });

      if (error) throw error;

      toast.success('Variations enregistrées avec succès');
      await loadVariations();
    } catch (error) {
      console.error('Error saving variations:', error);
      toast.error('Erreur lors de l\'enregistrement des variations');
    } finally {
      setSaving(false);
    }
  };

  const updateVariation = (termId: string, field: keyof ProductVariation, value: any) => {
    setVariations(prev =>
      prev.map(v =>
        v.attribute_term_id === termId ? { ...v, [field]: value } : v
      )
    );
  };

  const setMainImage = (termId: string) => {
    setVariations(prev =>
      prev.map(v => ({
        ...v,
        is_main_image: v.attribute_term_id === termId,
      }))
    );
  };

  if (attributes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <p>Aucun attribut sélectionné</p>
          <p className="text-sm mt-1">Sélectionnez des attributs (couleurs, tailles, etc.) pour gérer les variations</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Déclinaisons</CardTitle>
            <Button
              type="button"
              onClick={handleSaveVariations}
              disabled={saving || variations.length === 0}
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les variations'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {variations.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Aucune variation disponible</p>
          ) : (
            variations.map((variation) => (
              <div key={variation.attribute_term_id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">{variation.term_name}</h3>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={variation.is_main_image}
                      onCheckedChange={() => setMainImage(variation.attribute_term_id)}
                    />
                    <Label className="text-sm">Image principale</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Image spécifique</Label>
                    {variation.image_url ? (
                      <div className="relative mt-2">
                        <img
                          src={variation.image_url}
                          alt={variation.term_name}
                          className="w-32 h-32 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentEditingTermId(variation.attribute_term_id);
                            setMediaLibraryOpen(true);
                          }}
                          className="mt-2"
                        >
                          Changer l'image
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="w-32 h-32 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentEditingTermId(variation.attribute_term_id);
                            setMediaLibraryOpen(true);
                          }}
                          className="mt-2"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Ajouter une image
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Prix (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variation.price}
                        onChange={(e) => updateVariation(variation.attribute_term_id, 'price', e.target.value)}
                        placeholder="Prix spécifique"
                      />
                    </div>

                    <div>
                      <Label>Prix promo (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variation.sale_price}
                        onChange={(e) => updateVariation(variation.attribute_term_id, 'sale_price', e.target.value)}
                        placeholder="Prix promo spécifique"
                      />
                    </div>

                    <div>
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        value={variation.stock_quantity}
                        onChange={(e) => updateVariation(variation.attribute_term_id, 'stock_quantity', parseInt(e.target.value) || 0)}
                        placeholder="Quantité"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={mediaLibraryOpen} onOpenChange={setMediaLibraryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Médiathèque - Image de variation</DialogTitle>
            <DialogDescription>
              Sélectionnez une image pour cette variation
            </DialogDescription>
          </DialogHeader>
          <MediaLibrary
            bucket="product-images"
            onSelect={(url) => {
              if (currentEditingTermId) {
                updateVariation(currentEditingTermId, 'image_url', url);
                setMediaLibraryOpen(false);
                setCurrentEditingTermId(null);
                toast.success('Image sélectionnée');
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
