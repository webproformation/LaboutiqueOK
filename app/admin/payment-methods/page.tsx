"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CreditCard,
  Wallet,
  Store,
  Euro,
  ArrowUpDown,
  Smartphone,
  Banknote,
  Building2,
  Gift,
  QrCode,
  CheckCircle2,
} from "lucide-react";

const PAYMENT_ICONS = [
  { value: "💳", label: "Carte bancaire" },
  { value: "🏦", label: "Banque" },
  { value: "💵", label: "Espèces" },
  { value: "💰", label: "Argent" },
  { value: "📱", label: "Mobile" },
  { value: "🎁", label: "Cadeau" },
  { value: "🔐", label: "Sécurisé" },
  { value: "✅", label: "Valide" },
  { value: "⚡", label: "Rapide" },
  { value: "🌟", label: "Premium" },
  { value: "💎", label: "Diamant" },
  { value: "🔵", label: "PayPal" },
  { value: "🟢", label: "Visa" },
  { value: "🔴", label: "Mastercard" },
  { value: "🟡", label: "Bitcoin" },
  { value: "📲", label: "Apple Pay" },
  { value: "🤖", label: "Google Pay" },
  { value: "🏪", label: "En boutique" },
  { value: "📦", label: "A la livraison" },
  { value: "💌", label: "Chèque" },
];

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  processing_fee_percentage: number;
  processing_fee_fixed: number;
  type: string;
  config: any;
  created_at: string;
  updated_at: string;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    icon: "",
    is_active: true,
    sort_order: 0,
    processing_fee_percentage: 0,
    processing_fee_fixed: 0,
    type: "online",
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error("Erreur lors du chargement des méthodes");
      console.error(error);
    } else {
      setMethods(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        code: method.code,
        description: method.description,
        icon: method.icon,
        is_active: method.is_active,
        sort_order: method.sort_order,
        processing_fee_percentage: method.processing_fee_percentage,
        processing_fee_fixed: method.processing_fee_fixed,
        type: method.type,
      });
    } else {
      setEditingMethod(null);
      const maxOrder = methods.reduce((max, m) => Math.max(max, m.sort_order), 0);
      setFormData({
        name: "",
        code: "",
        description: "",
        icon: "💳",
        is_active: true,
        sort_order: maxOrder + 1,
        processing_fee_percentage: 0,
        processing_fee_fixed: 0,
        type: "online",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMethod(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      icon: "💳",
      is_active: true,
      sort_order: 0,
      processing_fee_percentage: 0,
      processing_fee_fixed: 0,
      type: "online",
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error("Le nom et le code sont obligatoires");
      return;
    }

    setSaving(true);

    try {
      if (editingMethod) {
        const { error } = await supabase
          .from("payment_methods")
          .update(formData)
          .eq("id", editingMethod.id);

        if (error) throw error;
        toast.success("Méthode de paiement mise à jour");
      } else {
        const { error } = await supabase.from("payment_methods").insert([formData]);

        if (error) throw error;
        toast.success("Méthode de paiement créée");
      }

      await loadMethods();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette méthode de paiement ?")) {
      return;
    }

    const { error } = await supabase.from("payment_methods").delete().eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } else {
      toast.success("Méthode de paiement supprimée");
      await loadMethods();
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    const { error } = await supabase
      .from("payment_methods")
      .update({ is_active: !method.is_active })
      .eq("id", method.id);

    if (error) {
      toast.error("Erreur lors de la modification");
      console.error(error);
    } else {
      toast.success(`Méthode ${!method.is_active ? "activée" : "désactivée"}`);
      await loadMethods();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "offline":
        return <Store className="h-4 w-4" />;
      case "wallet":
        return <Wallet className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "offline":
        return <Badge className="bg-amber-500">Hors ligne</Badge>;
      case "wallet":
        return <Badge className="bg-purple-500">Portefeuille</Badge>;
      default:
        return <Badge className="bg-blue-500">En ligne</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#b8933d] to-[#d4af37] bg-clip-text text-transparent">
            Méthodes de paiement
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Gérez les moyens de paiement disponibles pour vos clients
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle méthode
        </Button>
      </div>

      {methods.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune méthode de paiement
            </h3>
            <p className="text-gray-600 mb-6">
              Créez votre première méthode de paiement
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une méthode
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Frais</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-gray-500">{method.code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(method.type)}</TableCell>
                    <TableCell>
                      {method.processing_fee_percentage > 0 || method.processing_fee_fixed > 0 ? (
                        <div className="text-sm">
                          {method.processing_fee_percentage > 0 && (
                            <div>{method.processing_fee_percentage}%</div>
                          )}
                          {method.processing_fee_fixed > 0 && (
                            <div>+ {method.processing_fee_fixed.toFixed(2)} €</div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Gratuit
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={method.is_active}
                        onCheckedChange={() => handleToggleActive(method)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(method)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(method.id)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Modifier" : "Créer"} une méthode de paiement
            </DialogTitle>
            <DialogDescription>
              Configurez les détails de la méthode de paiement
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: PayPal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code technique *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s/g, "_") })
                  }
                  placeholder="Ex: paypal"
                  disabled={!!editingMethod}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée de la méthode de paiement"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icône</Label>
                <select
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
                >
                  {PAYMENT_ICONS.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.value} {icon.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="processing_fee_percentage">Frais (%)</Label>
                <Input
                  id="processing_fee_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.processing_fee_percentage}
                  onChange={(e) => setFormData({ ...formData, processing_fee_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="processing_fee_fixed">Frais fixes (€)</Label>
                <Input
                  id="processing_fee_fixed"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.processing_fee_fixed}
                  onChange={(e) => setFormData({ ...formData, processing_fee_fixed: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordre</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="online">En ligne</option>
                  <option value="offline">Hors ligne</option>
                  <option value="wallet">Portefeuille</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Méthode active
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
