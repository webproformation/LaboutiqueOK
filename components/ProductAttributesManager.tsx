"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2, Check, RefreshCw, AlertCircle, Sparkles, Tag, Box } from 'lucide-react';
import { toast } from 'sonner';

interface ProductAttribute {
  name: string;
  options: string[];
  visible: boolean;
  variation: boolean;
}

interface WooCommerceAttribute {
  id: number;
  name: string;
  slug: string;
  terms: Array<{ id: number; name: string; slug: string }>;
}

interface ProductAttributesManagerProps {
  attributes: ProductAttribute[];
  onChange: (attributes: ProductAttribute[]) => void;
}

export default function ProductAttributesManager({ attributes, onChange }: ProductAttributesManagerProps) {
  const [wooAttributes, setWooAttributes] = useState<WooCommerceAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWooAttr, setSelectedWooAttr] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [newTermName, setNewTermName] = useState('');
  const [addingTerm, setAddingTerm] = useState(false);
  const [customAttributeName, setCustomAttributeName] = useState('');
  const [customAttributeOptions, setCustomAttributeOptions] = useState('');

  useEffect(() => {
    loadWooCommerceAttributes();
  }, []);

  const loadWooCommerceAttributes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/woocommerce/attributes');
      const data = await response.json();

      console.log('WooCommerce attributes API response:', data);

      if (!response.ok) {
        console.error('API Error:', data);
        toast.error(`Erreur API: ${data.error || 'Erreur inconnue'}`);
        setWooAttributes([]);
        return;
      }

      if (data.message) {
        console.warn('WooCommerce message:', data.message);
        toast.warning(data.message);
      }

      const attrs = data.attributes || [];
      console.log(`Loaded ${attrs.length} WooCommerce attributes:`, attrs);
      setWooAttributes(attrs);

      if (attrs.length === 0) {
        toast.info('Aucun attribut WooCommerce trouvé.');
      } else {
        toast.success(`${attrs.length} attribut(s) WooCommerce chargé(s)`);
      }
    } catch (error) {
      console.error('Error loading WooCommerce attributes:', error);
      toast.error('Erreur réseau lors du chargement des attributs');
      setWooAttributes([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWooAttribute = () => {
    return wooAttributes.find(attr => attr.slug === selectedWooAttr);
  };

  const handleAddWooAttribute = () => {
    if (!selectedWooAttr || selectedOptions.length === 0) {
      toast.error('Veuillez sélectionner un attribut et au moins une option');
      return;
    }

    const wooAttr = getCurrentWooAttribute();
    if (!wooAttr) return;

    const existingAttrIndex = attributes.findIndex(
      attr => attr.name.toLowerCase() === wooAttr.name.toLowerCase()
    );

    if (existingAttrIndex >= 0) {
      const updatedAttributes = [...attributes];
      const existingOptions = updatedAttributes[existingAttrIndex].options;
      const newOptions = Array.from(new Set([...existingOptions, ...selectedOptions]));
      updatedAttributes[existingAttrIndex] = {
        ...updatedAttributes[existingAttrIndex],
        options: newOptions,
      };
      onChange(updatedAttributes);
    } else {
      const newAttribute: ProductAttribute = {
        name: wooAttr.name,
        options: selectedOptions,
        visible: true,
        variation: false,
      };
      onChange([...attributes, newAttribute]);
    }

    setSelectedWooAttr('');
    setSelectedOptions([]);
    toast.success('Attribut ajouté avec succès');
  };

  const handleAddNewTerm = async () => {
    if (!newTermName.trim() || !selectedWooAttr) return;

    setAddingTerm(true);
    try {
      const wooAttr = getCurrentWooAttribute();
      if (!wooAttr) return;

      const response = await fetch('/api/woocommerce/attributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attributeId: wooAttr.id,
          termName: newTermName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du terme');
      }

      const data = await response.json();

      await loadWooCommerceAttributes();

      setSelectedOptions([...selectedOptions, data.term.name]);
      setNewTermName('');
      toast.success(`Terme "${data.term.name}" ajouté à WooCommerce`);
    } catch (error) {
      console.error('Error adding term:', error);
      toast.error('Erreur lors de l\'ajout du terme');
    } finally {
      setAddingTerm(false);
    }
  };

  const handleAddCustomAttribute = () => {
    if (!customAttributeName.trim() || !customAttributeOptions.trim()) {
      toast.error('Veuillez remplir le nom et les options de l\'attribut');
      return;
    }

    const options = customAttributeOptions
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt);

    const newAttribute: ProductAttribute = {
      name: customAttributeName.trim(),
      options,
      visible: true,
      variation: false,
    };

    onChange([...attributes, newAttribute]);
    setCustomAttributeName('');
    setCustomAttributeOptions('');
    toast.success('Attribut personnalisé ajouté');
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    onChange(newAttributes);
  };

  const handleUpdateAttribute = (index: number, field: keyof ProductAttribute, value: any) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    onChange(newAttributes);
  };

  const handleToggleOption = (optionName: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionName)
        ? prev.filter(o => o !== optionName)
        : [...prev, optionName]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <Loader2 className="w-8 h-8 animate-spin text-[#b8933d]" />
          <Sparkles className="w-4 h-4 text-[#b8933d] absolute -top-1 -right-1 animate-pulse" />
        </div>
        <p className="text-sm text-gray-600">Chargement des attributs WooCommerce...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {attributes.map((attr, index) => (
        <Card key={index} className="border-2 hover:border-[#b8933d]/30 transition-all duration-200 hover:shadow-lg bg-gradient-to-br from-white to-gray-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#b8933d]/20 to-amber-100 flex items-center justify-center">
                <Tag className="w-6 h-6 text-[#b8933d]" />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="font-bold text-lg text-gray-800">{attr.name}</Label>
                    {attr.variation && (
                      <Badge className="bg-[#b8933d] text-white">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Variation
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attr.options.map((option, optIndex) => (
                      <Badge
                        key={optIndex}
                        variant="secondary"
                        className="bg-gradient-to-r from-gray-100 to-gray-50 hover:from-[#b8933d]/10 hover:to-amber-50 transition-colors border border-gray-200"
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3 group">
                    <Switch
                      checked={attr.visible}
                      onCheckedChange={(checked) => handleUpdateAttribute(index, 'visible', checked)}
                      className="data-[state=checked]:bg-[#b8933d]"
                    />
                    <Label className="text-sm font-medium text-gray-700 cursor-pointer group-hover:text-[#b8933d] transition-colors">
                      Visible sur la page produit
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 group">
                    <Switch
                      checked={attr.variation}
                      onCheckedChange={(checked) => handleUpdateAttribute(index, 'variation', checked)}
                      className="data-[state=checked]:bg-[#b8933d]"
                    />
                    <Label className="text-sm font-medium text-gray-700 cursor-pointer group-hover:text-[#b8933d] transition-colors">
                      Utilisé pour les variations
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAttribute(index)}
                className="hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-2 border-[#b8933d]/30 bg-gradient-to-br from-[#b8933d]/5 to-amber-50/30 shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b8933d]/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#b8933d] to-amber-600 flex items-center justify-center shadow-md">
                <Box className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-[#b8933d] to-amber-700 bg-clip-text text-transparent">
                Ajouter un attribut WooCommerce
              </CardTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadWooCommerceAttributes}
              disabled={loading}
              className="hover:bg-[#b8933d] hover:text-white transition-colors border-[#b8933d]/30"
              title="Recharger les attributs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div>
            <Label htmlFor="woo-attr-select" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#b8933d]" />
              Sélectionner un attribut
            </Label>
            {wooAttributes.length === 0 ? (
              <div className="mt-2 p-4 border-2 border-dashed border-amber-300 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 shadow-inner">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-900">
                      Aucun attribut WooCommerce disponible
                    </p>
                    <p className="text-xs text-amber-700">
                      Créez des attributs dans votre administration WooCommerce (Produits → Attributs) puis cliquez sur le bouton de rechargement ci-dessus.
                    </p>
                    <p className="text-xs text-amber-700">
                      Ou utilisez un attribut personnalisé dans la section ci-dessous.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Select value={selectedWooAttr} onValueChange={(value) => {
                setSelectedWooAttr(value);
                setSelectedOptions([]);
              }}>
                <SelectTrigger id="woo-attr-select" className="mt-2 border-2 focus:border-[#b8933d] bg-white">
                  <SelectValue placeholder="Choisir un attribut..." />
                </SelectTrigger>
                <SelectContent>
                  {wooAttributes.map((attr) => (
                    <SelectItem key={attr.id} value={attr.slug}>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#b8933d]" />
                        <span className="font-medium">{attr.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {attr.terms.length} options
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedWooAttr && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#b8933d]" />
                  Options disponibles (cliquez pour sélectionner)
                </Label>
                <div className="flex flex-wrap gap-2 p-4 border-2 rounded-lg bg-white shadow-inner">
                  {getCurrentWooAttribute()?.terms.map((term) => (
                    <Badge
                      key={term.id}
                      variant={selectedOptions.includes(term.name) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedOptions.includes(term.name)
                          ? 'bg-[#b8933d] hover:bg-[#a07d35] text-white shadow-md scale-105'
                          : 'hover:bg-[#b8933d]/10 hover:border-[#b8933d]'
                      }`}
                      onClick={() => handleToggleOption(term.name)}
                    >
                      {selectedOptions.includes(term.name) && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {term.name}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-2">
                  <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#b8933d] to-amber-500 transition-all duration-300"
                      style={{ width: `${(selectedOptions.length / (getCurrentWooAttribute()?.terms.length || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {selectedOptions.length} / {getCurrentWooAttribute()?.terms.length}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg border-2 border-dashed border-[#b8933d]/30 shadow-inner">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#b8933d]" />
                  Ajouter un nouveau terme
                </Label>
                <div className="flex gap-2 mt-3">
                  <Input
                    value={newTermName}
                    onChange={(e) => setNewTermName(e.target.value)}
                    placeholder="Ex: Rose poudré"
                    className="flex-1 border-2 focus:border-[#b8933d]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewTerm}
                    disabled={!newTermName.trim() || addingTerm}
                    className="bg-[#b8933d] hover:bg-[#a07d35]"
                  >
                    {addingTerm ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Le nouveau terme sera ajouté à WooCommerce et sélectionné automatiquement
                </p>
              </div>

              <Button
                type="button"
                onClick={handleAddWooAttribute}
                disabled={selectedOptions.length === 0}
                className="w-full bg-gradient-to-r from-[#b8933d] to-amber-600 hover:from-[#a07d35] hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Ajouter cet attribut au produit
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-[#b8933d]/50 transition-all duration-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-700">Ou créer un attribut personnalisé</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="custom-attr-name" className="text-sm font-medium text-gray-700">
                Nom de l'attribut
              </Label>
              <Input
                id="custom-attr-name"
                value={customAttributeName}
                onChange={(e) => setCustomAttributeName(e.target.value)}
                placeholder="Ex: Matière, Style..."
                className="mt-1 border-2 focus:border-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="custom-attr-options" className="text-sm font-medium text-gray-700">
                Options (séparées par des virgules)
              </Label>
              <Input
                id="custom-attr-options"
                value={customAttributeOptions}
                onChange={(e) => setCustomAttributeOptions(e.target.value)}
                placeholder="Ex: Coton, Polyester, Lin"
                className="mt-1 border-2 focus:border-gray-400"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddCustomAttribute}
            disabled={!customAttributeName.trim() || !customAttributeOptions.trim()}
            className="w-full border-2 hover:bg-gray-100 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter l'attribut personnalisé
          </Button>
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Les attributs personnalisés ne seront pas synchronisés avec WooCommerce
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
