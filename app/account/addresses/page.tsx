"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Edit, Loader2, Check } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    first_name: '',
    last_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'France',
    phone: '',
    is_default: false,
  });

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      setAddresses(data);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user!.id);
    }

    if (editingAddress) {
      const { error } = await supabase
        .from('addresses')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', editingAddress.id);

      if (error) {
        toast.error('Erreur lors de la mise à jour de l\'adresse');
      } else {
        toast.success('Adresse mise à jour avec succès !');
        setDialogOpen(false);
        loadAddresses();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('addresses')
        .insert({ ...formData, user_id: user!.id });

      if (error) {
        toast.error('Erreur lors de l\'ajout de l\'adresse');
      } else {
        toast.success('Adresse ajoutée avec succès !');
        setDialogOpen(false);
        loadAddresses();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression de l\'adresse');
    } else {
      toast.success('Adresse supprimée avec succès !');
      loadAddresses();
    }
  };

  const handleSetDefault = async (id: string) => {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user!.id);

    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la mise à jour de l\'adresse');
    } else {
      toast.success('Adresse par défaut mise à jour !');
      loadAddresses();
    }
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAddress(null);
    setFormData({
      label: '',
      first_name: '',
      last_name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      postal_code: '',
      country: 'France',
      phone: '',
      is_default: false,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#b8933d] rounded-full">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Mes adresses</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {addresses.length} adresse{addresses.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#b8933d] hover:bg-[#a07c2f]">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une adresse
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de votre adresse
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="label">Libellé</Label>
                      <Input
                        id="label"
                        placeholder="Domicile, Travail..."
                        value={formData.label}
                        onChange={(e) =>
                          setFormData({ ...formData, label: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Prénom</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) =>
                            setFormData({ ...formData, first_name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Nom</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) =>
                            setFormData({ ...formData, last_name: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line1">Adresse</Label>
                      <Input
                        id="address_line1"
                        value={formData.address_line1}
                        onChange={(e) =>
                          setFormData({ ...formData, address_line1: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line2">Complément d'adresse</Label>
                      <Input
                        id="address_line2"
                        placeholder="Appartement, bâtiment..."
                        value={formData.address_line2}
                        onChange={(e) =>
                          setFormData({ ...formData, address_line2: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Code postal</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) =>
                            setFormData({ ...formData, postal_code: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Pays</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({ ...formData, country: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={formData.is_default}
                        onChange={(e) =>
                          setFormData({ ...formData, is_default: e.target.checked })
                        }
                        className="rounded border-gray-300 text-[#b8933d] focus:ring-[#b8933d]"
                      />
                      <Label htmlFor="is_default" className="cursor-pointer">
                        Définir comme adresse par défaut
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-[#b8933d] hover:bg-[#a07c2f]">
                      {editingAddress ? 'Enregistrer' : 'Ajouter'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune adresse
              </h3>
              <p className="text-gray-600">
                Ajoutez une adresse de livraison
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              {address.is_default && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    <Check className="h-3 w-3" />
                    Par défaut
                  </span>
                </div>
              )}
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {address.label && (
                    <h3 className="font-semibold text-gray-900">{address.label}</h3>
                  )}
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">
                      {address.first_name} {address.last_name}
                    </p>
                    <p>{address.address_line1}</p>
                    {address.address_line2 && <p>{address.address_line2}</p>}
                    <p>
                      {address.postal_code} {address.city}
                    </p>
                    <p>{address.country}</p>
                    <p>{address.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Par défaut
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(address)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      className="text-[#DF30CF] hover:text-[#c82bb7] hover:bg-pink-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
