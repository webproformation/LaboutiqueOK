"use client";

import { useState } from "react";
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
import { ArrowLeft, Save, FileText, Globe } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import { ProductMediaSelector } from "@/components/product-media-selector";

export default function NewPageSEO() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    page_type: "static" as "home" | "static" | "custom",
    is_published: false,
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    canonical_url: "",
    robots_index: true,
    robots_follow: true,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.slug) {
      toast.error("Le titre et le slug sont requis");
      return;
    }

    setIsSubmitting(true);
    try {
      const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const { error } = await supabase.from("pages_seo").insert({
        id: newId,
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        page_type: formData.page_type,
        is_published: formData.is_published,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        meta_keywords: formData.meta_keywords || null,
        og_title: formData.og_title || null,
        og_description: formData.og_description || null,
        og_image: formData.og_image || null,
        canonical_url: formData.canonical_url || null,
        robots_index: formData.robots_index,
        robots_follow: formData.robots_follow,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Une page avec ce slug existe déjà");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Page créée avec succès");
      router.push("/admin/site-pages");
      router.refresh();
    } catch (error) {
      console.error("Error creating page:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/site-pages">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-[#d4af37] hover:bg-[#d4af37]/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#d4af37]">
              Nouvelle page
            </h1>
            <p className="text-gray-600 mt-1">
              Créer une nouvelle page avec son contenu et métadonnées SEO
            </p>
          </div>
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#d4af37]">
                Informations générales
              </CardTitle>
              <CardDescription>
                Titre, slug et type de la page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-[#d4af37]">
                  Titre de la page *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Qui sommes-nous, CGV, Contact..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug" className="text-[#d4af37]">
                  Slug *
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="qui-sommes-nous, cgv, contact..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL de la page : /{formData.slug || "slug"}
                </p>
              </div>

              <div>
                <Label htmlFor="page_type" className="text-[#d4af37]">
                  Type de page
                </Label>
                <Select
                  value={formData.page_type}
                  onValueChange={(value: "home" | "static" | "custom") =>
                    setFormData((prev) => ({ ...prev, page_type: value }))
                  }
                >
                  <SelectTrigger id="page_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Page d'accueil</SelectItem>
                    <SelectItem value="static">Page statique</SelectItem>
                    <SelectItem value="custom">Page personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-lg">
                <div>
                  <Label htmlFor="is_published" className="text-[#d4af37] font-semibold cursor-pointer">
                    Publier la page
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    La page sera visible sur le site
                  </p>
                </div>
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_published: checked }))
                  }
                  className="data-[state=checked]:bg-[#d4af37]"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#d4af37] flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contenu de la page
              </CardTitle>
              <CardDescription>
                Éditeur WYSIWYG pour le contenu HTML de la page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={formData.content}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, content: value }))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#d4af37]">
                Métadonnées SEO
              </CardTitle>
              <CardDescription>
                Optimisation pour les moteurs de recherche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title" className="text-[#d4af37]">
                  Titre SEO
                </Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      meta_title: e.target.value,
                    }))
                  }
                  placeholder="Titre optimisé pour Google"
                  maxLength={60}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.meta_title.length}/60 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="meta_description" className="text-[#d4af37]">
                  Description SEO
                </Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      meta_description: e.target.value,
                    }))
                  }
                  placeholder="Description pour les résultats de recherche"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.meta_description.length}/160 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="meta_keywords" className="text-[#d4af37]">
                  Mots-clés SEO
                </Label>
                <Input
                  id="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      meta_keywords: e.target.value,
                    }))
                  }
                  placeholder="mot-clé1, mot-clé2, mot-clé3"
                />
              </div>

              <div>
                <Label htmlFor="canonical_url" className="text-[#d4af37]">
                  URL Canonique
                </Label>
                <Input
                  id="canonical_url"
                  value={formData.canonical_url}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      canonical_url: e.target.value,
                    }))
                  }
                  placeholder="https://laboutiquedemorgane.com/page"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#d4af37] flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Open Graph (Réseaux sociaux)
              </CardTitle>
              <CardDescription>
                Métadonnées pour le partage sur les réseaux sociaux
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="og_title" className="text-[#d4af37]">
                  Titre OG
                </Label>
                <Input
                  id="og_title"
                  value={formData.og_title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, og_title: e.target.value }))
                  }
                  placeholder="Titre pour Facebook, Twitter..."
                />
              </div>

              <div>
                <Label htmlFor="og_description" className="text-[#d4af37]">
                  Description OG
                </Label>
                <Textarea
                  id="og_description"
                  value={formData.og_description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      og_description: e.target.value,
                    }))
                  }
                  placeholder="Description pour le partage social"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-[#d4af37]">Image OG</Label>
                <ProductMediaSelector
                  currentImageUrl={formData.og_image}
                  onSelect={(url) =>
                    setFormData((prev) => ({ ...prev, og_image: url }))
                  }
                  label="Image pour le partage (1200x630px recommandé)"
                  bucket="media"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#d4af37]">
                Paramètres robots
              </CardTitle>
              <CardDescription>
                Contrôle de l'indexation par les moteurs de recherche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="robots_index" className="cursor-pointer">
                    Index
                  </Label>
                  <p className="text-xs text-gray-600">
                    Autoriser l'indexation
                  </p>
                </div>
                <Switch
                  id="robots_index"
                  checked={formData.robots_index}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, robots_index: checked }))
                  }
                  className="data-[state=checked]:bg-[#d4af37]"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="robots_follow" className="cursor-pointer">
                    Follow
                  </Label>
                  <p className="text-xs text-gray-600">
                    Suivre les liens
                  </p>
                </div>
                <Switch
                  id="robots_follow"
                  checked={formData.robots_follow}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, robots_follow: checked }))
                  }
                  className="data-[state=checked]:bg-[#d4af37]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
