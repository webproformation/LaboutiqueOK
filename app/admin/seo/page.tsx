'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Save, Plus, Edit2, Trash2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SeoMetadata {
  id: string;
  entity_type: string;
  entity_identifier: string;
  seo_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  robots_meta: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SeoAdminPage() {
  const [metadata, setMetadata] = useState<SeoMetadata[]>([]);
  const [filteredMetadata, setFilteredMetadata] = useState<SeoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<SeoMetadata | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    entity_type: 'page',
    entity_identifier: '',
    seo_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    canonical_url: '',
    robots_meta: 'index, follow',
    is_active: true,
  });

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    filterMetadata();
  }, [metadata, searchTerm, selectedEntityType]);

  const loadMetadata = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .order('entity_type', { ascending: true })
        .order('entity_identifier', { ascending: true });

      if (error) throw error;
      setMetadata(data || []);
    } catch (error) {
      console.error('Error loading SEO metadata:', error);
      toast.error('Erreur lors du chargement des métadonnées');
    } finally {
      setLoading(false);
    }
  };

  const filterMetadata = () => {
    let filtered = metadata;

    if (selectedEntityType !== 'all') {
      filtered = filtered.filter(item => item.entity_type === selectedEntityType);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.entity_identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.seo_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meta_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMetadata(filtered);
  };

  const handleEdit = (item: SeoMetadata) => {
    setEditingItem(item);
    setFormData({
      entity_type: item.entity_type,
      entity_identifier: item.entity_identifier,
      seo_title: item.seo_title || '',
      meta_description: item.meta_description || '',
      meta_keywords: item.meta_keywords || '',
      og_title: item.og_title || '',
      og_description: item.og_description || '',
      og_image: item.og_image || '',
      canonical_url: item.canonical_url || '',
      robots_meta: item.robots_meta || 'index, follow',
      is_active: item.is_active,
    });
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      entity_type: 'page',
      entity_identifier: '',
      seo_title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: '',
      canonical_url: '',
      robots_meta: 'index, follow',
      is_active: true,
    });
    setShowCreateDialog(true);
  };

  const handleSave = async () => {
    if (!formData.entity_identifier) {
      toast.error('L\'identifiant de l\'entité est requis');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('seo_metadata')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Métadonnées mises à jour avec succès');
      } else {
        const { error } = await supabase
          .from('seo_metadata')
          .insert([formData]);

        if (error) throw error;
        toast.success('Métadonnées créées avec succès');
      }

      setShowEditDialog(false);
      setShowCreateDialog(false);
      loadMetadata();
    } catch (error: any) {
      console.error('Error saving SEO metadata:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ces métadonnées ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('seo_metadata')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Métadonnées supprimées');
      loadMetadata();
    } catch (error) {
      console.error('Error deleting SEO metadata:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'page': return 'Page';
      case 'category': return 'Catégorie';
      case 'post': return 'Article';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gestion SEO</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  const renderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="entity_type">Type d'entité</Label>
          <Select
            value={formData.entity_type}
            onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
            disabled={!!editingItem}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="page">Page</SelectItem>
              <SelectItem value="category">Catégorie</SelectItem>
              <SelectItem value="post">Article</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="entity_identifier">Identifiant (slug)</Label>
          <Input
            id="entity_identifier"
            value={formData.entity_identifier}
            onChange={(e) => setFormData({ ...formData, entity_identifier: e.target.value })}
            placeholder="ex: home, robes, article-123"
            disabled={!!editingItem}
          />
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basique</TabsTrigger>
          <TabsTrigger value="opengraph">Open Graph</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="seo_title">Titre SEO</Label>
            <Input
              id="seo_title"
              value={formData.seo_title}
              onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
              placeholder="Titre optimisé pour les moteurs de recherche (60-70 caractères)"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.seo_title.length} caractères</p>
          </div>
          <div>
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              placeholder="Description pour les résultats de recherche (150-160 caractères)"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.meta_description.length} caractères</p>
          </div>
          <div>
            <Label htmlFor="meta_keywords">Mots-clés</Label>
            <Input
              id="meta_keywords"
              value={formData.meta_keywords}
              onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
              placeholder="mot-clé 1, mot-clé 2, mot-clé 3"
            />
          </div>
        </TabsContent>

        <TabsContent value="opengraph" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="og_title">Titre Open Graph</Label>
            <Input
              id="og_title"
              value={formData.og_title}
              onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
              placeholder="Titre pour les partages sur réseaux sociaux"
            />
          </div>
          <div>
            <Label htmlFor="og_description">Description Open Graph</Label>
            <Textarea
              id="og_description"
              value={formData.og_description}
              onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
              placeholder="Description pour les partages sur réseaux sociaux"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="og_image">Image Open Graph (URL)</Label>
            <Input
              id="og_image"
              value={formData.og_image}
              onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="canonical_url">URL Canonique</Label>
            <Input
              id="canonical_url"
              value={formData.canonical_url}
              onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="robots_meta">Directives Robots</Label>
            <Select
              value={formData.robots_meta}
              onValueChange={(value) => setFormData({ ...formData, robots_meta: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="index, follow">Index, Follow</SelectItem>
                <SelectItem value="noindex, follow">NoIndex, Follow</SelectItem>
                <SelectItem value="index, nofollow">Index, NoFollow</SelectItem>
                <SelectItem value="noindex, nofollow">NoIndex, NoFollow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Actif</Label>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8 text-[#b8933d]" />
            Gestion SEO
          </h1>
          <p className="text-gray-600 mt-1">
            Gérer les métadonnées SEO pour les pages, catégories et articles
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-[#b8933d] hover:bg-[#a07c2f]">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle entrée SEO
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Rechercher et filtrer les métadonnées SEO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Rechercher par identifiant, titre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="entity_type_filter">Type d'entité</Label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger id="entity_type_filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="page">Pages</SelectItem>
                  <SelectItem value="category">Catégories</SelectItem>
                  <SelectItem value="post">Articles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredMetadata.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-[#b8933d]/10 text-[#b8933d] text-xs font-semibold rounded">
                      {getEntityTypeLabel(item.entity_type)}
                    </span>
                    <span className="text-sm font-mono text-gray-600">
                      {item.entity_identifier}
                    </span>
                    {!item.is_active && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                        Inactif
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.seo_title || 'Sans titre'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {item.meta_description || 'Pas de description'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {item.meta_keywords && (
                      <span>Mots-clés: {item.meta_keywords}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMetadata.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">Aucune métadonnée SEO trouvée</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les métadonnées SEO</DialogTitle>
            <DialogDescription>
              Optimisez le référencement de {formData.entity_identifier}
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#b8933d] hover:bg-[#a07c2f]"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer des métadonnées SEO</DialogTitle>
            <DialogDescription>
              Ajoutez de nouvelles métadonnées pour optimiser le référencement
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#b8933d] hover:bg-[#a07c2f]"
            >
              <Plus className="h-4 w-4 mr-2" />
              {saving ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
