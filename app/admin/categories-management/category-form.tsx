"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, Save, Menu } from "lucide-react";
import Link from "next/link";
import { ProductMediaSelector } from "@/components/product-media-selector";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  meta_title: string | null;
  meta_description: string | null;
  seo_keywords: string | null;
  show_in_main_menu: boolean;
}

interface CategoryFormProps {
  category?: Category | null;
  categories: Category[];
}

export default function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    image_url: category?.image_url ?? "",
    parent_id: category?.parent_id ?? null,
    display_order: category?.display_order ?? 0,
    meta_title: category?.meta_title ?? "",
    meta_description: category?.meta_description ?? "",
    seo_keywords: category?.seo_keywords ?? "",
    show_in_main_menu: category?.show_in_main_menu ?? false,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: category ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error("Le nom et le slug sont requis");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image_url: formData.image_url || null,
        parent_id: formData.parent_id || null,
        display_order: formData.display_order,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        seo_keywords: formData.seo_keywords || null,
        show_in_main_menu: formData.parent_id === null ? formData.show_in_main_menu : false,
      };

      if (category) {
        const { error } = await supabase
          .from("categories")
          .update(dataToSave)
          .eq("id", category.id);

        if (error) throw error;
        toast.success("Catégorie mise à jour avec succès");
      } else {
        // Generate unique ID using timestamp + random
        const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const { error } = await supabase
          .from("categories")
          .insert({ id: newId, ...dataToSave });

        if (error) {
          if (error.code === "23505") {
            toast.error("Une catégorie avec cet ID ou slug existe déjà");
          } else {
            throw error;
          }
          return;
        }
        toast.success("Catégorie créée avec succès");
      }

      router.push("/admin/categories-management");
      router.refresh();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableParentCategories = categories
    .filter(c => !category || c.id !== category.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/categories-management">
            <Button type="button" variant="ghost" size="icon" className="text-[#d4af37] hover:bg-[#d4af37]/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#d4af37]">
              {category ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </h1>
            <p className="text-gray-600 mt-1">
              {category ? `Modification de "${category.name}"` : "Créer une nouvelle catégorie de produits"}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white">
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Informations générales</CardTitle>
              <CardDescription>
                Informations de base de la catégorie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[#d4af37]">Nom de la catégorie *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Nouveautés, Mode, Maison..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug" className="text-[#d4af37]">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="nouveautes, mode, maison..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Utilisé dans l'URL : /categorie/{formData.slug || "slug"}
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="text-[#d4af37]">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de la catégorie..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#d4af37]">SEO</CardTitle>
              <CardDescription>
                Optimisation pour les moteurs de recherche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title" className="text-[#d4af37]">Titre SEO</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="Titre pour les moteurs de recherche"
                  maxLength={60}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.meta_title.length}/60 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="meta_description" className="text-[#d4af37]">Description SEO</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Description pour les moteurs de recherche"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.meta_description.length}/160 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="seo_keywords" className="text-[#d4af37]">Mots-clés SEO</Label>
                <Input
                  id="seo_keywords"
                  value={formData.seo_keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_keywords: e.target.value }))}
                  placeholder="mode, vêtements, accessoires"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Séparez les mots-clés par des virgules
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Image</CardTitle>
              <CardDescription>
                Image représentative de la catégorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductMediaSelector
                currentImageUrl={formData.image_url}
                onSelect={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                label="Image de la catégorie"
                bucket="category-images"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Organisation</CardTitle>
              <CardDescription>
                Hiérarchie et ordre d'affichage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="parent_id" className="text-[#d4af37]">Catégorie parente</Label>
                <Select
                  value={formData.parent_id || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parent_id: value === "none" ? null : value, show_in_main_menu: value === "none" ? prev.show_in_main_menu : false }))}
                >
                  <SelectTrigger id="parent_id">
                    <SelectValue placeholder="Aucune (catégorie principale)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune (catégorie principale)</SelectItem>
                    {availableParentCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!formData.parent_id && (
                <div className="flex items-center justify-between p-4 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Menu className="h-4 w-4 text-[#d4af37]" />
                      <Label htmlFor="show_in_main_menu" className="text-[#d4af37] font-semibold cursor-pointer">
                        Afficher dans le menu principal
                      </Label>
                    </div>
                    <p className="text-xs text-gray-600">
                      Cette catégorie apparaîtra dans le bandeau noir de navigation. Si elle a des sous-catégories, un méga-menu s'affichera au survol.
                    </p>
                  </div>
                  <Switch
                    id="show_in_main_menu"
                    checked={formData.show_in_main_menu}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_in_main_menu: checked }))}
                    className="data-[state=checked]:bg-[#d4af37]"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="display_order" className="text-[#d4af37]">Ordre d'affichage</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Plus le nombre est bas, plus la catégorie apparaît en premier
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
