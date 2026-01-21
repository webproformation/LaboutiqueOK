'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RichTextEditor from '@/components/RichTextEditor';
import MediaLibrary from '@/components/MediaLibrary';
import { ArrowLeft, Save, Eye, RefreshCw } from 'lucide-react'; // Ajout de RefreshCw
import { toast } from 'sonner';

// --- IMPORT DU HOOK DE SAUVEGARDE ---
import { useAutoSave } from "@/hooks/useAutoSave";

interface NewsCategory {
  id: string;
  name: string;
  color: string;
}

export default function NewsEditorPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id === 'new' ? null : (params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showSocialMediaLibrary, setShowSocialMediaLibrary] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    status: 'draft' as 'draft' | 'publish' | 'pending',
    published_at: '',
    category_ids: [] as string[],
    seo_title: '',
    meta_description: '',
    meta_social_title: '',
    meta_social_description: '',
    meta_social_image: '',
  });

  // --- INTÉGRATION AUTO-SAVE ---
  // On génère une clé unique. Si c'est une création, ce sera "draft_news_new"
  const autoSaveKey = `draft_news_${postId || 'new'}`;

  const { clearSavedData } = useAutoSave(
    autoSaveKey,
    formData,
    (savedData) => {
        // Restauration des données
        setFormData(prev => ({ ...prev, ...savedData }));
    }
  );
  // -----------------------------

  useEffect(() => {
    loadCategories();
    if (postId) {
      loadPost();
    } else {
      setLoading(false);
    }
  }, [postId]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('news_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPost = async () => {
    if (!postId) return;

    try {
      const { data: postData, error: postError } = await supabase
        .from('news_posts')
        .select(`
          *,
          news_post_categories (
            category_id
          )
        `)
        .eq('id', postId)
        .maybeSingle();

      if (postError) throw postError;

      if (!postData) {
        toast.error('Article introuvable');
        router.push('/admin/actualites');
        return;
      }

      // Note : On ne met à jour le state que si le AutoSave n'a pas déjà restauré un travail plus récent
      // (La logique précise dépend de votre préférence, ici on charge la DB, 
      // mais le hook useAutoSave écrasera si un brouillon local existe et est détecté)
      
      setFormData({
        title: postData.title,
        slug: postData.slug,
        content: postData.content || '',
        excerpt: postData.excerpt || '',
        featured_image_url: postData.featured_image_url || '',
        status: postData.status,
        published_at: postData.published_at ? new Date(postData.published_at).toISOString().split('T')[0] : '',
        category_ids: postData.news_post_categories.map((pc: any) => pc.category_id),
        seo_title: postData.seo_title || '',
        meta_description: postData.meta_description || '',
        meta_social_title: postData.meta_social_title || '',
        meta_social_description: postData.meta_social_description || '',
        meta_social_image: postData.meta_social_image || '',
      });
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: postId ? formData.slug : generateSlug(title),
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.slug) {
      toast.error('Le titre est requis');
      return;
    }

    if (formData.category_ids.length === 0) {
      toast.error('Veuillez sélectionner au moins une catégorie');
      return;
    }

    setSaving(true);

    try {
      const postData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        featured_image_url: formData.featured_image_url || null,
        status: formData.status,
        published_at: formData.published_at || (formData.status === 'publish' ? new Date().toISOString() : null),
        seo_title: formData.seo_title || null,
        meta_description: formData.meta_description || null,
        meta_social_title: formData.meta_social_title || null,
        meta_social_description: formData.meta_social_description || null,
        meta_social_image: formData.meta_social_image || null,
      };

      let savedPostId = postId;

      if (postId) {
        const { error } = await supabase
          .from('news_posts')
          .update(postData)
          .eq('id', postId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('news_posts')
          .insert([postData])
          .select()
          .single();

        if (error) throw error;
        savedPostId = data.id;
      }

      await supabase
        .from('news_post_categories')
        .delete()
        .eq('post_id', savedPostId);

      const categoryMappings = formData.category_ids.map(catId => ({
        post_id: savedPostId,
        category_id: catId
      }));

      await supabase
        .from('news_post_categories')
        .insert(categoryMappings);

      // --- NETTOYAGE DU BROUILLON APRÈS SUCCÈS ---
      clearSavedData();
      // -------------------------------------------

      toast.success(postId ? 'Article modifié' : 'Article créé');

      if (!postId) {
        router.push(`/admin/actualites/edit/${savedPostId}`);
      }
    } catch (error: any) {
      console.error('Error saving post:', error);
      if (error.code === '23505') {
        toast.error('Ce slug existe déjà');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
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
        <div className="flex flex-col">
            <Link href="/admin/actualites" className="inline-flex items-center text-gray-400 hover:text-[#d4af37] mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux actualités
            </Link>
            {/* Indicateur visuel Auto-save */}
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                <RefreshCw className="w-3 h-3" /> Auto-save actif
            </span>
        </div>
        
        <div className="flex items-center gap-3">
          {postId && formData.status === 'publish' && (
            <Link href={`/actualites/${formData.slug}`} target="_blank">
              <Button variant="outline" className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10">
                <Eye className="h-4 w-4 mr-2" />
                Voir l'article
              </Button>
            </Link>
          )}
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement...' : (postId ? 'Enregistrer' : 'Créer')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-[#d4af37]/30">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Contenu de l'article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-gray-700">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Titre de l'article"
                  className="text-lg font-semibold bg-white border-[#d4af37]/30 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="excerpt" className="text-gray-700">Extrait</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Court résumé de l'article (150-200 caractères recommandés)"
                  rows={3}
                  className="bg-white border-[#d4af37]/30 text-gray-900 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.excerpt.length} / 200 caractères
                </p>
              </div>

              <div>
                <Label className="text-gray-700">Contenu *</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#d4af37]/30">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo_title" className="text-gray-700">Titre SEO</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  placeholder={formData.title || 'Titre pour les moteurs de recherche'}
                  className="bg-white border-[#d4af37]/30 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="meta_description" className="text-gray-700">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Description pour les moteurs de recherche"
                  rows={3}
                  className="bg-white border-[#d4af37]/30 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#d4af37]/30">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Partage Réseaux Sociaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_social_title" className="text-gray-700">Titre Social</Label>
                <Input
                  id="meta_social_title"
                  value={formData.meta_social_title}
                  onChange={(e) => setFormData({ ...formData, meta_social_title: e.target.value })}
                  placeholder={formData.title || 'Titre pour Facebook, Twitter, etc.'}
                  className="bg-white border-[#d4af37]/30 text-gray-900 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Titre affiché lors du partage sur les réseaux sociaux
                </p>
              </div>

              <div>
                <Label htmlFor="meta_social_description" className="text-gray-700">Description Sociale</Label>
                <Textarea
                  id="meta_social_description"
                  value={formData.meta_social_description}
                  onChange={(e) => setFormData({ ...formData, meta_social_description: e.target.value })}
                  placeholder={formData.excerpt || 'Description pour les réseaux sociaux'}
                  rows={3}
                  className="bg-white border-[#d4af37]/30 text-gray-900 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Description affichée lors du partage
                </p>
              </div>

              <div>
                <Label className="text-gray-700">Image Sociale</Label>
                {formData.meta_social_image ? (
                  <div className="space-y-3">
                    <img
                      src={formData.meta_social_image}
                      alt="Image sociale"
                      className="w-full h-auto rounded-lg border border-[#d4af37]/30"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSocialMediaLibrary(true)}
                        className="flex-1 border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
                      >
                        Changer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, meta_social_image: '' })}
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowSocialMediaLibrary(true)}
                    className="w-full border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
                  >
                    Sélectionner une image
                  </Button>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Image affichée lors du partage (recommandé : 1200x630px)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white border-[#d4af37]/30">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Publication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-gray-700">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'publish' | 'pending') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="bg-white border-[#d4af37]/30 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#d4af37]/30">
                    <SelectItem value="draft" className="text-gray-900 hover:bg-[#d4af37]/20">Brouillon</SelectItem>
                    <SelectItem value="pending" className="text-gray-900 hover:bg-[#d4af37]/20">En attente</SelectItem>
                    <SelectItem value="publish" className="text-gray-900 hover:bg-[#d4af37]/20">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="published_at" className="text-gray-700">Date de publication</Label>
                <Input
                  id="published_at"
                  type="date"
                  value={formData.published_at}
                  onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                  className="bg-white border-[#d4af37]/30 text-gray-900"
                />
              </div>

              <Separator className="bg-[#d4af37]/30" />

              <div>
                <Label htmlFor="slug" className="text-gray-700">URL (slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-de-larticle"
                  className="bg-white border-[#d4af37]/30 text-gray-900 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  /actualites/{formData.slug || 'url-de-larticle'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#d4af37]/30">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Catégories *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={formData.category_ids.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                      className="border-[#d4af37]/50 data-[state=checked]:bg-[#d4af37] data-[state=checked]:border-[#d4af37]"
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="flex items-center gap-2 cursor-pointer text-gray-900"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#d4af37]/30">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Image à la une</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.featured_image_url ? (
                <div className="space-y-3">
                  <img
                    src={formData.featured_image_url}
                    alt="Image à la une"
                    className="w-full h-auto rounded-lg border border-[#d4af37]/30"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMediaLibrary(true)}
                      className="flex-1 border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
                    >
                      Changer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, featured_image_url: '' })}
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowMediaLibrary(true)}
                  className="w-full border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
                >
                  Sélectionner une image
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-0 shrink-0">
            <DialogTitle>Sélectionner une image à la une</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4 overflow-y-auto flex-1">
            <MediaLibrary
              bucket="media"
              onSelect={(url) => {
                setFormData({ ...formData, featured_image_url: url });
                setShowMediaLibrary(false);
              }}
              onClose={() => setShowMediaLibrary(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSocialMediaLibrary} onOpenChange={setShowSocialMediaLibrary}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-0 shrink-0">
            <DialogTitle>Sélectionner une image sociale</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4 overflow-y-auto flex-1">
            <MediaLibrary
              bucket="media"
              onSelect={(url) => {
                setFormData({ ...formData, meta_social_image: url });
                setShowSocialMediaLibrary(false);
              }}
              onClose={() => setShowSocialMediaLibrary(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}