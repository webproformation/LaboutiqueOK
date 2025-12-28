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
import { Gift, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface GiftThreshold {
  id: string;
  threshold_amount: number;
  gift_name: string;
  gift_description: string;
  is_active: boolean;
  display_message_before: string;
  display_message_after: string;
}

export default function AdminGiftThresholdsPage() {
  const [thresholds, setThresholds] = useState<GiftThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<GiftThreshold | null>(null);

  const [formData, setFormData] = useState({
    threshold_amount: 69.0,
    gift_name: "",
    gift_description: "",
    is_active: true,
    display_message_before: "Plus que {amount}€ pour recevoir un cadeau surprise ! 🎁",
    display_message_after: "Félicitations ! Votre cadeau surprise est débloqué ! ✨",
  });

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("gift_thresholds")
        .select("*")
        .order("threshold_amount");

      if (error) throw error;
      setThresholds(data || []);
    } catch (error) {
      console.error("Error fetching thresholds:", error);
      toast.error("Erreur lors du chargement des paliers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const supabase = createClient();

      if (editingThreshold) {
        const { error } = await supabase
          .from("gift_thresholds")
          .update(formData)
          .eq("id", editingThreshold.id);

        if (error) throw error;
        toast.success("Palier modifié avec succès");
      } else {
        const { error } = await supabase.from("gift_thresholds").insert([formData]);

        if (error) throw error;
        toast.success("Palier créé avec succès");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchThresholds();
    } catch (error: any) {
      console.error("Error saving threshold:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (threshold: GiftThreshold) => {
    setEditingThreshold(threshold);
    setFormData({
      threshold_amount: threshold.threshold_amount,
      gift_name: threshold.gift_name,
      gift_description: threshold.gift_description || "",
      is_active: threshold.is_active,
      display_message_before: threshold.display_message_before,
      display_message_after: threshold.display_message_after,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce palier ?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("gift_thresholds").delete().eq("id", id);

      if (error) throw error;
      toast.success("Palier supprimé avec succès");
      fetchThresholds();
    } catch (error: any) {
      console.error("Error deleting threshold:", error);
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const toggleActive = async (threshold: GiftThreshold) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("gift_thresholds")
        .update({ is_active: !threshold.is_active })
        .eq("id", threshold.id);

      if (error) throw error;
      toast.success(threshold.is_active ? "Palier désactivé" : "Palier activé");
      fetchThresholds();
    } catch (error: any) {
      console.error("Error toggling threshold:", error);
      toast.error(error.message || "Erreur");
    }
  };

  const resetForm = () => {
    setEditingThreshold(null);
    setFormData({
      threshold_amount: 69.0,
      gift_name: "",
      gift_description: "",
      is_active: true,
      display_message_before: "Plus que {amount}€ pour recevoir un cadeau surprise ! 🎁",
      display_message_after: "Félicitations ! Votre cadeau surprise est débloqué ! ✨",
    });
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
          <Gift className="h-8 w-8 text-[#D4AF37]" />
          <div>
            <h1 className="text-3xl font-bold">Paliers de Cadeaux Surprise</h1>
            <p className="text-muted-foreground">
              Configurez les paliers pour débloquer des cadeaux
            </p>
          </div>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#D4AF37] hover:bg-[#B8941F]">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Palier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingThreshold ? "Modifier le Palier" : "Créer un Nouveau Palier"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="threshold_amount">
                  Montant du Palier (€) *
                </Label>
                <Input
                  id="threshold_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.threshold_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      threshold_amount: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gift_name">Nom du Cadeau *</Label>
                <Input
                  id="gift_name"
                  value={formData.gift_name}
                  onChange={(e) =>
                    setFormData({ ...formData, gift_name: e.target.value })
                  }
                  required
                  placeholder="Cadeau Surprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gift_description">Description du Cadeau</Label>
                <Textarea
                  id="gift_description"
                  value={formData.gift_description}
                  onChange={(e) =>
                    setFormData({ ...formData, gift_description: e.target.value })
                  }
                  rows={3}
                  placeholder="Un cadeau surprise sera inclus dans votre colis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_message_before">
                  Message AVANT d&apos;atteindre le palier
                </Label>
                <Textarea
                  id="display_message_before"
                  value={formData.display_message_before}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_message_before: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Plus que {amount}€ pour recevoir un cadeau surprise ! 🎁"
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez {"{amount}"} pour afficher le montant restant
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_message_after">
                  Message APRÈS avoir atteint le palier
                </Label>
                <Textarea
                  id="display_message_after"
                  value={formData.display_message_after}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_message_after: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Félicitations ! Votre cadeau surprise est débloqué ! ✨"
                />
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
                  Palier actif (visible sur le site)
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
                  {editingThreshold ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {thresholds.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun palier créé pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {thresholds.map((threshold) => (
            <Card key={threshold.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-[#D4AF37]">
                    {threshold.threshold_amount.toFixed(2)}€
                  </span>
                  <Badge
                    className={threshold.is_active ? "bg-green-500" : "bg-gray-500"}
                  >
                    {threshold.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{threshold.gift_name}</h3>
                  {threshold.gift_description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {threshold.gift_description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs font-semibold text-orange-800 mb-1">
                      Avant le palier:
                    </p>
                    <p className="text-sm text-orange-900">
                      {threshold.display_message_before}
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-800 mb-1">
                      Après le palier:
                    </p>
                    <p className="text-sm text-green-900">
                      {threshold.display_message_after}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(threshold)}
                    className="flex-1"
                  >
                    {threshold.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(threshold)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(threshold.id)}
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
