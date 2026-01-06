"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Truck,
  Package,
  Home,
  MapPin,
  Euro,
  Clock,
  ArrowUpDown,
} from "lucide-react";

interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  cost: number;
  is_relay: boolean;
  is_active: boolean;
  sort_order: number;
  delivery_time: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export default function ShippingMethodsPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    cost: 0,
    is_relay: false,
    is_active: true,
    sort_order: 0,
    delivery_time: "",
    type: "standard",
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shipping_methods")
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

  const handleOpenDialog = (method?: ShippingMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        code: method.code,
        description: method.description,
        cost: method.cost,
        is_relay: method.is_relay,
        is_active: method.is_active,
        sort_order: method.sort_order,
        delivery_time: method.delivery_time,
        type: method.type,
      });
    } else {
      setEditingMethod(null);
      const maxOrder = methods.reduce((max, m) => Math.max(max, m.sort_order), 0);
      setFormData({
        name: "",
        code: "",
        description: "",
        cost: 0,
        is_relay: false,
        is_active: true,
        sort_order: maxOrder + 1,
        delivery_time: "",
        type: "standard",
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
      cost: 0,
      is_relay: false,
      is_active: true,
      sort_order: 0,
      delivery_time: "",
      type: "standard",
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
          .from("shipping_methods")
          .update(formData)
          .eq("id", editingMethod.id);

        if (error) throw error;
        toast.success("Méthode de livraison mise à jour");
      } else {
        const { error } = await supabase.from("shipping_methods").insert([formData]);

        if (error) throw error;
        toast.success("Méthode de livraison créée");
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
    if (!confirm("Voulez-vous vraiment supprimer cette méthode de livraison ?")) {
      return;
    }

    const { error } = await supabase.from("shipping_methods").delete().eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } else {
      toast.success("Méthode de livraison supprimée");
      await loadMethods();
    }
  };

  const handleToggleActive = async (method: ShippingMethod) => {
    const { error } = await supabase
      .from("shipping_methods")
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
      case "free":
        return <Package className="h-4 w-4" />;
      case "relay":
        return <MapPin className="h-4 w-4" />;
      case "home":
        return <Home className="h-4 w-4" />;
      default:
        return <Truck className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "free":
        return <Badge className="bg-green-500">Gratuit</Badge>;
      case "relay":
        return <Badge className="bg-blue-500">Point Relais</Badge>;
      case "home":
        return <Badge className="bg-purple-500">Domicile</Badge>;
      default:
        return <Badge>Standard</Badge>;
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
            Méthodes de livraison
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Gérez les options de livraison disponibles pour vos clients
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle méthode
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Délai</TableHead>
                <TableHead>Point Relais</TableHead>
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
                      {getTypeIcon(method.type)}
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-gray-500">{method.code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(method.type)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">
                        {method.cost === 0 ? "Gratuit" : `${method.cost.toFixed(2)} €`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {method.delivery_time}
                    </div>
                  </TableCell>
                  <TableCell>
                    {method.is_relay ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Oui
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-600">
                        Non
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Modifier" : "Créer"} une méthode de livraison
            </DialogTitle>
            <DialogDescription>
              Configurez les détails de la méthode de livraison
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
                  placeholder="Ex: Mondial Relay"
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
                  placeholder="Ex: mondial_relay"
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
                placeholder="Description détaillée de la méthode de livraison"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Prix (€)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_time">Délai</Label>
                <Input
                  id="delivery_time"
                  value={formData.delivery_time}
                  onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                  placeholder="Ex: 24/48h"
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
                  <option value="standard">Standard</option>
                  <option value="free">Gratuit</option>
                  <option value="relay">Point Relais</option>
                  <option value="home">Domicile</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_relay"
                      checked={formData.is_relay}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_relay: checked })}
                    />
                    <Label htmlFor="is_relay" className="cursor-pointer">
                      Point Relais
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Active
                    </Label>
                  </div>
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
