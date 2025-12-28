"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Look {
  id: string;
  title: string;
  slug: string;
  description: string;
  morgane_advice: string;
  hero_image_url: string;
  discount_percentage: number;
  is_active: boolean;
  display_order: number;
}

export default function AdminLooksPage() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLook, setEditingLook] = useState<Look | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    morgane_advice: "",
    hero_image_url: "",
    discount_percentage: 5,
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchLooks();
  }, []);

  const fetchLooks = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("looks")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setLooks(data || []);
    } catch (error) {
      console.error("Error fetching looks:", error);
      toast.error("Erreur lors du chargement des looks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const supabase = createClient();

      if (editingLook) {
        const { error } = await supabase
          .from("looks")
          .update(formData)
          .eq("id", editingLook.id);

        if (error) throw error;
        toast.success("Look modifié avec succès");
      } else {
        const { error } = await supabase.from("looks").insert([formData]);

        if (error) throw error;
        toast.success("Look créé avec succès");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchLooks();
    } catch (error: any) {
      console.error("Error saving look:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (look: Look) => {
    setEditingLook(look);
    setFormData({
      title: look.title,
      slug: look.slug,
      description: look.description || "",
      morgane_advice: look.morgane_advice || "",
      hero_image_url: look.hero_image_url,
      discount_percentage: look.discount_percentage,
      is_active: look.is_active,
      display_order: look.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce look ?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("looks").delete().eq("id", id);

      if (error) throw error;
      toast.success("Look supprimé avec succès");
      fetchLooks();
    } catch (error: any) {
      console.error("Error deleting look:", error);
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const toggleActive = async (look: Look) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("looks")
        .update({ is_active: !look.is_active })
        .eq("id", look.id);

      if (error) throw error;
      toast.success(
        look.is_active ? "Look désactivé" : "Look activé"
      );
      fetchLooks();
    } catch (error: any) {
      console.error("Error toggling look:", error);
      toast.error(error.message || "Erreur");
    }
  };

  const resetForm = () => {
    setEditingLook(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      morgane_advice: "",
      hero_image_url: "",
      discount_percentage: 5,
      is_active: true,
      display_order: 0,
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-[#D4AF37]" />
          <div>
            <h1 className="text-3xl font-bold">Gestion des Looks</h1>
            <p className="text-muted-foreground">
              Créez et gérez vos looks "Acheter le Look"
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#D4AF37] hover:bg-[#B8941F]">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Look
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLook ? "Modifier le Look" : "Créer un Nouveau Look"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (!editingLook) {
                      setFormData({
                        ...formData,
                        title: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL: /look/{formData.slug}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="morgane_advice">
                  Pourquoi j&apos;aime ce look ? (Conseil de Morgane)
                </Label>
                <Textarea
                  id="morgane_advice"
                  value={formData.morgane_advice}
                  onChange={(e) =>
                    setFormData({ ...formData, morgane_advice: e.target.value })
                  }
                  rows={3}
                  placeholder="Le mariage parfait entre le confort du jean et le chic du pull doré..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_image_url">URL de l&apos;Image Principale *</Label>
                <Input
                  id="hero_image_url"
                  value={formData.hero_image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, hero_image_url: e.target.value })
                  }
                  required
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_percentage">Remise (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordre d&apos;affichage</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Look actif (visible sur le site)
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8941F]"
                >
                  {editingLook ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {looks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun look créé pour le moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {looks.map((look) => (
            <Card key={look.id} className="overflow-hidden">
              <div className="relative aspect-[3/4]">
                <img
                  src={look.hero_image_url}
                  alt={look.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge className={look.is_active ? "bg-green-500" : "bg-gray-500"}>
                    {look.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <Badge className="bg-[#D4AF37]">
                    -{look.discount_percentage}%
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{look.title}</h3>
                  {look.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {look.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(look)}
                    className="flex-1"
                  >
                    {look.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(look)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(`/admin/looks/${look.id}/products`, "_blank")
                    }
                    className="flex-1"
                  >
                    Produits
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(look.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
