'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, MapPin, Plus, Edit, Trash2, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Address {
  id: string;
  address_type: string;
  first_name: string;
  last_name: string;
  street: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  label?: string;
  is_default: boolean;
}

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [addressType, setAddressType] = useState('shipping');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('France');
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAddresses(data || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAddressType('shipping');
    setFirstName('');
    setLastName('');
    setStreet('');
    setAddressLine2('');
    setCity('');
    setPostalCode('');
    setCountry('France');
    setPhone('');
    setLabel('');
    setIsDefault(false);
    setEditingAddress(null);
  };

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressType(address.address_type);
      setFirstName(address.first_name || '');
      setLastName(address.last_name || '');
      setStreet(address.street || address.address_line1 || '');
      setAddressLine2(address.address_line2 || '');
      setCity(address.city);
      setPostalCode(address.postal_code);
      setCountry(address.country);
      setPhone(address.phone || '');
      setLabel(address.label || '');
      setIsDefault(address.is_default);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !street || !city || !postalCode || !phone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);

    try {
      const addressData = {
        address_type: addressType,
        first_name: firstName,
        last_name: lastName,
        street,
        address_line1: street,
        address_line2: addressLine2 || null,
        city,
        postal_code: postalCode,
        country,
        phone,
        label: label || `${firstName} ${lastName}`,
        is_default: isDefault,
      };

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', editingAddress.id);

        if (error) throw error;

        toast.success('Adresse mise à jour', {
          position: 'bottom-right'
        });
      } else {
        const newAddressId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const { error } = await supabase.from('addresses').insert({
          id: newAddressId,
          user_id: user?.id,
          ...addressData,
        });

        if (error) throw error;

        toast.success('Adresse ajoutée', {
          position: 'bottom-right'
        });
      }

      await loadAddresses();
      setDialogOpen(false);
      resetForm();
      loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse?')) {
      return;
    }

    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id);

      if (error) throw error;

      toast.success('Adresse supprimée', {
        position: 'bottom-right'
      });
      loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Mes adresses</h2>
          <p className="text-gray-600">Gérez vos adresses de livraison et de facturation</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter une adresse
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations de votre adresse
              </DialogDescription>
            </DialogHeader>
            <form id="address-form" onSubmit={handleSave} className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="space-y-2">
                <Label htmlFor="label">
                  Nom de l'adresse
                </Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Domicile, Travail, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">
                  Adresse <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="27, rue de l'abbé Doudermy"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">
                  Complément d'adresse
                </Label>
                <Input
                  id="addressLine2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Appartement, bâtiment, étage..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">
                    Code postal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  Pays <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="France"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Téléphone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Définir comme adresse par défaut
                </Label>
              </div>

            </form>
            <div className="flex gap-2 mt-4 flex-shrink-0 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                form="address-form"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
                onClick={(e) => {
                  e.preventDefault();
                  const form = document.getElementById('address-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune adresse</h3>
            <p className="text-gray-600 mb-6">Ajoutez une adresse pour faciliter vos commandes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_default ? 'border-[#D4AF37] border-2' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-[#D4AF37]" />
                    <CardTitle className="text-lg">
                      {address.label || `${address.first_name} ${address.last_name}`}
                    </CardTitle>
                  </div>
                  {address.is_default && (
                    <span className="text-xs bg-[#D4AF37] text-white px-2 py-1 rounded">
                      Par défaut
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-4">
                  <p className="font-medium text-sm">{address.first_name} {address.last_name}</p>
                  <p className="text-sm">{address.street || address.address_line1}</p>
                  {address.address_line2 && <p className="text-sm">{address.address_line2}</p>}
                  <p className="text-sm">
                    {address.postal_code} {address.city}
                  </p>
                  <p className="text-sm">{address.country}</p>
                  <p className="text-sm text-gray-600">Tél: {address.phone}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(address)}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
