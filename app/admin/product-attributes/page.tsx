'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Palette, Type } from 'lucide-react';
import { toast } from 'sonner';

interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_visible: boolean;
  order_by: number;
  created_at: string;
}

interface ProductAttributeTerm {
  id: string;
  attribute_id: string;
  name: string;
  slug: string;
  value: string | null;
  color_code: string | null;
  order_by: number;
  is_active: boolean;
  created_at: string;
}

export default function ProductAttributesPage() {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [terms, setTerms] = useState<ProductAttributeTerm[]>([]);
  const [selectedAttribute, setSelectedAttribute] = useState<ProductAttribute | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false);
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<ProductAttribute | null>(null);
  const [editingTerm, setEditingTerm] = useState<ProductAttributeTerm | null>(null);

  const [attributeForm, setAttributeForm] = useState({
    name: '',
    slug: '',
    type: 'select',
  });

  const [termForm, setTermForm] = useState({
    name: '',
    slug: '',
    value: '',
    color_code: '#000000',
  });

  useEffect(() => {
    loadAttributes();
  }, []);

  useEffect(() => {
    if (selectedAttribute) {
      loadTerms(selectedAttribute.id);
    }
  }, [selectedAttribute]);

  const loadAttributes = async () => {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .order('order_by', { ascending: true });

      if (error) throw error;
      setAttributes(data || []);
      if (data && data.length > 0 && !selectedAttribute) {
        setSelectedAttribute(data[0]);
      }
    } catch (error) {
      console.error('Error loading attributes:', error);
      toast.error('Erreur lors du chargement des attributs');
    } finally {
      setLoading(false);
    }
  };

  const loadTerms = async (attributeId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_attribute_terms')
        .select('*')
        .eq('attribute_id', attributeId)
        .order('order_by', { ascending: true });

      if (error) throw error;
      setTerms(data || []);
    } catch (error) {
      console.error('Error loading terms:', error);
      toast.error('Erreur lors du chargement des termes');
    }
  };

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!attributeForm.name || !attributeForm.slug) {
      toast.error('Le nom et le slug sont requis');
      return;
    }

    try {
      const attributeData = {
        name: attributeForm.name,
        slug: attributeForm.slug,
        type: attributeForm.type,
        order_by: attributes.length + 1,
      };

      if (editingAttribute) {
        const { error } = await supabase
          .from('product_attributes')
          .update(attributeData)
          .eq('id', editingAttribute.id);

        if (error) throw error;
        toast.success('Attribut modifié avec succès');
      } else {
        const { error } = await supabase
          .from('product_attributes')
          .insert([attributeData]);

        if (error) throw error;
        toast.success('Attribut créé avec succès');
      }

      setAttributeForm({ name: '', slug: '', type: 'select' });
      setEditingAttribute(null);
      setIsAttributeDialogOpen(false);
      loadAttributes();
    } catch (error: any) {
      console.error('Error saving attribute:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAttribute || !termForm.name || !termForm.slug) {
      toast.error('Sélectionnez un attribut et remplissez les champs requis');
      return;
    }

    try {
      const termData = {
        attribute_id: selectedAttribute.id,
        name: termForm.name,
        slug: termForm.slug,
        value: termForm.value || termForm.name,
        color_code: selectedAttribute.type === 'select' && termForm.color_code ? termForm.color_code : null,
        order_by: terms.length + 1,
      };

      if (editingTerm) {
        const { error } = await supabase
          .from('product_attribute_terms')
          .update(termData)
          .eq('id', editingTerm.id);

        if (error) throw error;
        toast.success('Terme modifié avec succès');
      } else {
        const { error } = await supabase
          .from('product_attribute_terms')
          .insert([termData]);

        if (error) throw error;
        toast.success('Terme créé avec succès');
      }

      setTermForm({ name: '', slug: '', value: '', color_code: '#000000' });
      setEditingTerm(null);
      setIsTermDialogOpen(false);
      loadTerms(selectedAttribute.id);
    } catch (error: any) {
      console.error('Error saving term:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet attribut et tous ses termes ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('product_attributes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Attribut supprimé avec succès');
      loadAttributes();
    } catch (error) {
      console.error('Error deleting attribute:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce terme ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('product_attribute_terms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Terme supprimé avec succès');
      if (selectedAttribute) {
        loadTerms(selectedAttribute.id);
      }
    } catch (error) {
      console.error('Error deleting term:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEditAttribute = (attribute: ProductAttribute) => {
    setEditingAttribute(attribute);
    setAttributeForm({
      name: attribute.name,
      slug: attribute.slug,
      type: attribute.type,
    });
    setIsAttributeDialogOpen(true);
  };

  const openEditTerm = (term: ProductAttributeTerm) => {
    setEditingTerm(term);
    setTermForm({
      name: term.name,
      slug: term.slug,
      value: term.value || '',
      color_code: term.color_code || '#000000',
    });
    setIsTermDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attributs de produits</h1>
          <p className="text-gray-600 mt-2">
            Gérez les attributs (couleurs, tailles, etc.) et leurs valeurs
          </p>
        </div>
        <Dialog open={isAttributeDialogOpen} onOpenChange={setIsAttributeDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingAttribute(null);
                setAttributeForm({ name: '', slug: '', type: 'select' });
              }}
              className="bg-gradient-to-r from-[#C6A15B] to-[#b8933d] hover:from-[#b8933d] hover:to-[#a88230]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvel attribut
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAttribute ? 'Modifier l\'attribut' : 'Nouvel attribut'}
              </DialogTitle>
              <DialogDescription>
                Définissez le type d'attribut (ex: Couleur, Taille, Matière)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveAttribute} className="space-y-4">
              <div>
                <Label htmlFor="attr-name">Nom *</Label>
                <Input
                  id="attr-name"
                  value={attributeForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setAttributeForm({
                      ...attributeForm,
                      name,
                      slug: name.toLowerCase().replace(/\s+/g, '-'),
                    });
                  }}
                  placeholder="Couleur"
                  required
                />
              </div>
              <div>
                <Label htmlFor="attr-slug">Slug *</Label>
                <Input
                  id="attr-slug"
                  value={attributeForm.slug}
                  onChange={(e) => setAttributeForm({ ...attributeForm, slug: e.target.value })}
                  placeholder="couleur"
                  required
                />
              </div>
              <div>
                <Label htmlFor="attr-type">Type</Label>
                <Select
                  value={attributeForm.type}
                  onValueChange={(value) => setAttributeForm({ ...attributeForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="color">Couleur</SelectItem>
                    <SelectItem value="button">Bouton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAttributeDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-[#C6A15B] hover:bg-[#b8933d]">
                  {editingAttribute ? 'Modifier' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Attributs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attributes.map((attribute) => (
                <div
                  key={attribute.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAttribute?.id === attribute.id
                      ? 'border-[#C6A15B] bg-[#C6A15B]/5'
                      : 'border-gray-200 hover:border-[#C6A15B]/50'
                  }`}
                  onClick={() => setSelectedAttribute(attribute)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {attribute.type === 'color' ? (
                        <Palette className="h-5 w-5 text-[#C6A15B]" />
                      ) : (
                        <Type className="h-5 w-5 text-[#C6A15B]" />
                      )}
                      <div>
                        <p className="font-medium">{attribute.name}</p>
                        <p className="text-xs text-gray-500">{attribute.slug}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditAttribute(attribute);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAttribute(attribute.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Termes {selectedAttribute ? `- ${selectedAttribute.name}` : ''}
              </CardTitle>
              <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingTerm(null);
                      setTermForm({ name: '', slug: '', value: '', color_code: '#000000' });
                    }}
                    disabled={!selectedAttribute}
                    size="sm"
                    className="bg-[#C6A15B] hover:bg-[#b8933d]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un terme
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTerm ? 'Modifier le terme' : 'Nouveau terme'}
                    </DialogTitle>
                    <DialogDescription>
                      Ajoutez une valeur pour l'attribut {selectedAttribute?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveTerm} className="space-y-4">
                    <div>
                      <Label htmlFor="term-name">Nom *</Label>
                      <Input
                        id="term-name"
                        value={termForm.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setTermForm({
                            ...termForm,
                            name,
                            slug: name.toLowerCase().replace(/\s+/g, '-'),
                            value: name,
                          });
                        }}
                        placeholder="Rouge"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="term-slug">Slug *</Label>
                      <Input
                        id="term-slug"
                        value={termForm.slug}
                        onChange={(e) => setTermForm({ ...termForm, slug: e.target.value })}
                        placeholder="rouge"
                        required
                      />
                    </div>
                    {selectedAttribute?.type === 'select' && (
                      <div>
                        <Label htmlFor="term-color">Code couleur</Label>
                        <div className="flex gap-2">
                          <Input
                            id="term-color"
                            type="color"
                            value={termForm.color_code}
                            onChange={(e) => setTermForm({ ...termForm, color_code: e.target.value })}
                            className="w-20 h-10"
                          />
                          <Input
                            value={termForm.color_code}
                            onChange={(e) => setTermForm({ ...termForm, color_code: e.target.value })}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsTermDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" className="bg-[#C6A15B] hover:bg-[#b8933d]">
                        {editingTerm ? 'Modifier' : 'Créer'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedAttribute ? (
              <div className="text-center py-10 text-gray-500">
                Sélectionnez un attribut pour voir ses termes
              </div>
            ) : terms.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Aucun terme pour cet attribut
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug</TableHead>
                    {selectedAttribute.type === 'select' && <TableHead>Couleur</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">{term.name}</TableCell>
                      <TableCell><code className="text-xs bg-gray-100 px-2 py-1 rounded">{term.slug}</code></TableCell>
                      {selectedAttribute.type === 'select' && (
                        <TableCell>
                          {term.color_code && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded border-2 border-gray-300"
                                style={{ backgroundColor: term.color_code }}
                              />
                              <span className="text-sm text-gray-600">{term.color_code}</span>
                            </div>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditTerm(term)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTerm(term.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
