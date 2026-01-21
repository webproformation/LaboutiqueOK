'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Search, Loader2, Clock } from 'lucide-react';

// --- TYPES ---
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
  
  // États locaux pour la recherche
  const [searchPostalCode, setSearchPostalCode] = useState('');
  const [searchCity, setSearchCity] = useState('');
  
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const providerNames = {
    'mondial-relay': 'Mondial Relay',
    'chronopost': 'Chronopost',
    'gls': 'GLS Relais'
  };

  // --- 1. INITIALISATION À L'OUVERTURE ---
  useEffect(() => {
    if (open) {
      const initialZip = customerAddress?.postalCode || '';
      const initialCity = customerAddress?.city || '';
      
      setSearchPostalCode(initialZip);
      setSearchCity(initialCity);

      if (initialZip && relayPoints.length === 0) {
        setTimeout(() => handleAutoSearch(initialZip, initialCity), 100);
      }

      if (!mapLoaded) {
        loadGoogleMaps();
      }
    }
  }, [open]); 

  const handleAutoSearch = (zip: string, city: string) => {
      searchRelayPoints(zip, city);
  };

  const loadGoogleMaps = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
      const checkGoogle = setInterval(() => {
        if ((window as any).google) {
            setMapLoaded(true);
            clearInterval(checkGoogle);
        }
      }, 500);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  };

  // --- 2. GESTION DE LA CARTE ---
  useEffect(() => {
    if (open && mapLoaded && (window as any).google) {
        initMapWithMarkers();
    }
  }, [open, mapLoaded, relayPoints]);

  const initMapWithMarkers = () => {
    const mapElement = document.getElementById('relay-map');
    if (!mapElement) return;

    const defaultCenter = { lat: 48.8566, lng: 2.3522 };
    
    const center = relayPoints.length > 0 && relayPoints[0].latitude && relayPoints[0].longitude
        ? { lat: relayPoints[0].latitude, lng: relayPoints[0].longitude }
        : defaultCenter;

    if (!mapRef.current) {
        mapRef.current = new (window as any).google.maps.Map(mapElement, {
            center: center,
            zoom: relayPoints.length > 0 ? 13 : 11,
            mapTypeControl: false,
            streetViewControl: false,
        });
    } else {
        mapRef.current.setCenter(center);
        mapRef.current.setZoom(relayPoints.length > 0 ? 13 : 11);
        (window as any).google.maps.event.trigger(mapRef.current, 'resize');
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    relayPoints.forEach((point) => {
        if (point.latitude && point.longitude) {
            const marker = new (window as any).google.maps.Marker({
                position: { lat: point.latitude, lng: point.longitude },
                map: mapRef.current,
                title: point.name,
                animation: (window as any).google.maps.Animation.DROP,
            });

            marker.addListener("click", () => {
                handleSelectPoint(point);
            });

            markersRef.current.push(marker);
        }
    });
  };

  // --- 3. RECHERCHE ---
  const searchRelayPoints = async (overrideZip?: string, overrideCity?: string) => {
    const zipToUse = overrideZip !== undefined ? overrideZip : searchPostalCode;
    const cityToUse = overrideCity !== undefined ? overrideCity : searchCity;

    if (!zipToUse) {
      if (overrideZip === undefined) toast.error('Veuillez saisir un code postal');
      return;
    }

    setLoading(true);
    setRelayPoints([]); 

    try {
      const response = await fetch(`/api/${provider}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: zipToUse,
          city: cityToUse,
        }),
      });

      if (!response.ok) throw new Error('Erreur réseau');

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setRelayPoints(data.points || []);
      setHasSearched(true);

      if (data.points && data.points.length === 0 && overrideZip === undefined) {
        toast.info('Aucun point relais trouvé dans cette zone');
      }
    } catch (error: any) {
      console.error('Error searching relay points:', error);
      if (overrideZip === undefined) {
          toast.error("Impossible de récupérer les points relais.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPoint = (point: RelayPoint) => {
    onSelect(point);
    setOpen(false);
    toast.success(`Point relais sélectionné : ${point.name}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* --- MODIFICATION ICI : BOUTON DORÉ ET PLUS GROS --- */}
        <Button 
          type="button" 
          variant="default" 
          className="w-full h-12 bg-[#D4AF37] hover:bg-[#b8933d] text-white text-lg font-semibold shadow-md transition-all hover:scale-[1.01] rounded-xl flex items-center justify-center gap-3 border-0"
        >
          <MapPin className="h-5 w-5 text-white" />
          {selectedPoint ? (
            <span className="truncate">Modifier : {selectedPoint.name}</span>
          ) : (
            <span>Choisir un point {providerNames[provider]}</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-6 w-6 text-[#D4AF37]" />
            Sélectionnez votre point relais {providerNames[provider]}
          </DialogTitle>
          <DialogDescription>
            Recherchez et sélectionnez le point de retrait le plus pratique pour vous.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Formulaire de recherche */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3 items-end">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Code postal <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Ex: 59000"
                  value={searchPostalCode}
                  onChange={(e) => setSearchPostalCode(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Ville (Optionnel)
                </label>
                <Input
                  placeholder="Ex: Lille"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="bg-white"
                />
              </div>
              <Button
                type="button"
                onClick={() => searchRelayPoints()}
                disabled={loading}
                className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 h-[500px]">
            {/* CARTE GOOGLE MAPS */}
            <div className="relative h-full rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100">
                <div id="relay-map" className="w-full h-full" />
                
                {!mapLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 z-10">
                        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37] mb-2" />
                        <p className="text-sm font-medium text-gray-600">Chargement de la carte...</p>
                    </div>
                )}
            </div>

            {/* LISTE DES RÉSULTATS */}
            <div className="flex flex-col h-full overflow-hidden bg-white rounded-xl border border-gray-200">
              <div className="p-3 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white border shadow-sm">
                    {relayPoints.length}
                  </Badge>
                  points trouvés
                </h4>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {relayPoints.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                    <Search className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm">
                      Les résultats de votre recherche apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  relayPoints.map((point) => (
                    <div
                      key={point.id}
                      onClick={() => handleSelectPoint(point)}
                      className="group border border-gray-100 p-3 rounded-lg hover:border-[#D4AF37] hover:bg-[#FFF9F0] transition-all cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37] group-hover:text-white transition-colors">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h5 className="font-bold text-gray-900 text-sm truncate">{point.name}</h5>
                                    {point.distance && (
                                        <Badge variant="outline" className="text-[10px] px-1 h-5 bg-white whitespace-nowrap">
                                            {point.distance > 1000 ? (point.distance / 1000).toFixed(1) : point.distance} km
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 truncate">{point.address}</p>
                                <p className="text-sm text-gray-600 font-medium">{point.postalCode} {point.city}</p>
                                
                                {point.openingHours && (
                                    <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500 bg-gray-50 p-1.5 rounded">
                                        <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2">{point.openingHours}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col justify-center">
                             <Button
                                size="sm"
                                className="h-8 px-3 bg-white text-gray-700 border border-gray-200 hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37]"
                             >
                                Choisir
                             </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}