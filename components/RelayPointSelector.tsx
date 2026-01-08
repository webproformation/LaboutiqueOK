'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Search, Loader2, Clock, Navigation } from 'lucide-react';

interface RelayPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  distance?: number;
  openingHours?: string;
  provider: 'mondial-relay' | 'chronopost' | 'gls';
  latitude?: number;
  longitude?: number;
}

interface RelayPointSelectorProps {
  provider: 'mondial-relay' | 'chronopost' | 'gls';
  onSelect: (point: RelayPoint) => void;
  selectedPoint?: RelayPoint | null;
  customerAddress?: {
    postalCode: string;
    city: string;
  };
}

export function RelayPointSelector({ provider, onSelect, selectedPoint, customerAddress }: RelayPointSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchPostalCode, setSearchPostalCode] = useState(customerAddress?.postalCode || '');
  const [searchCity, setSearchCity] = useState(customerAddress?.city || '');
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const providerNames = {
    'mondial-relay': 'Mondial Relay',
    'chronopost': 'Chronopost',
    'gls': 'GLS Relais'
  };

  useEffect(() => {
    if (open && !mapLoaded) {
      loadGoogleMaps();
    }
  }, [open]);

  const loadGoogleMaps = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return;
    }

    if (typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
        initializeMap();
      };
      document.head.appendChild(script);
    } else if ((window as any).google) {
      setMapLoaded(true);
      initializeMap();
    }
  };

  const initializeMap = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      const mapElement = document.getElementById('relay-map');
      if (mapElement) {
        const map = new (window as any).google.maps.Map(mapElement, {
          center: { lat: 48.8566, lng: 2.3522 },
          zoom: 12,
        });
      }
    }
  };

  const searchRelayPoints = async () => {
    if (!searchPostalCode || !searchCity) {
      toast.error('Veuillez saisir un code postal et une ville');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/${provider}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: searchPostalCode,
          city: searchCity,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche des points relais');
      }

      const data = await response.json();
      setRelayPoints(data.points || []);

      if (data.points && data.points.length === 0) {
        toast.info('Aucun point relais trouvé dans cette zone');
      }
    } catch (error: any) {
      console.error('Error searching relay points:', error);
      toast.error('Erreur lors de la recherche des points relais');

      setRelayPoints([
        {
          id: 'demo-1',
          name: `${providerNames[provider]} - Point démo 1`,
          address: '123 Rue Example',
          city: searchCity,
          postalCode: searchPostalCode,
          distance: 1.2,
          openingHours: 'Lun-Sam: 9h-19h',
          provider: provider,
        },
        {
          id: 'demo-2',
          name: `${providerNames[provider]} - Point démo 2`,
          address: '456 Avenue Test',
          city: searchCity,
          postalCode: searchPostalCode,
          distance: 2.5,
          openingHours: 'Lun-Ven: 8h-18h, Sam: 9h-12h',
          provider: provider,
        },
        {
          id: 'demo-3',
          name: `${providerNames[provider]} - Point démo 3`,
          address: '789 Boulevard Sample',
          city: searchCity,
          postalCode: searchPostalCode,
          distance: 3.8,
          openingHours: 'Lun-Sam: 8h30-19h30',
          provider: provider,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPoint = (point: RelayPoint) => {
    onSelect(point);
    setOpen(false);
    toast.success(`Point relais ${point.name} sélectionné`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <MapPin className="h-4 w-4 mr-2" />
          {selectedPoint ? 'Modifier le point relais' : `Choisir un point ${providerNames[provider]}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#D4AF37]" />
            Sélectionnez votre point relais {providerNames[provider]}
          </DialogTitle>
          <DialogDescription>
            Trouvez le point relais le plus proche de chez vous
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Code postal
                </label>
                <Input
                  placeholder="Ex: 75001"
                  value={searchPostalCode}
                  onChange={(e) => setSearchPostalCode(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Ville
                </label>
                <Input
                  placeholder="Ex: Paris"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={searchRelayPoints}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div
              id="relay-map"
              className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center"
            >
              {!mapLoaded ? (
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Chargement de la carte...</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Carte Google Maps</p>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              <h4 className="font-semibold text-gray-900 sticky top-0 bg-white py-2">
                Points relais disponibles
                {relayPoints.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {relayPoints.length} résultats
                  </Badge>
                )}
              </h4>

              {relayPoints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">
                    Lancez une recherche pour afficher les points relais disponibles
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {relayPoints.map((point) => (
                    <div
                      key={point.id}
                      className="border border-gray-200 p-3 rounded-lg hover:border-[#D4AF37] hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{point.name}</p>
                            {point.distance && (
                              <Badge variant="secondary" className="text-xs">
                                <Navigation className="h-3 w-3 mr-1" />
                                {point.distance} km
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {point.address}
                          </p>
                          <p className="text-sm text-gray-600">
                            {point.postalCode} {point.city}
                          </p>
                          {point.openingHours && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {point.openingHours}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSelectPoint(point)}
                          className="shrink-0"
                        >
                          Sélectionner
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
