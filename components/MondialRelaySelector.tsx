'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader as Loader2, CircleCheck as CheckCircle2, Clock, Navigation, Search, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
interface RelayPoint {
  Id: string;
  Name: string;
  Address1: string;
  Address2?: string;
  City: string;
  PostCode: string;
  Country: string;
  Latitude: number;
  Longitude: number;
  Distance?: number;
  OpeningHours?: {
    Monday?: string;
    Tuesday?: string;
    Wednesday?: string;
    Thursday?: string;
    Friday?: string;
    Saturday?: string;
    Sunday?: string;
  };
  LocalizationHints?: string[];
  Num?: string;
  LgAdr1?: string;
  LgAdr2?: string;
  CP?: string;
  Ville?: string;
  Pays?: string;
}

interface MondialRelaySelectorProps {
  postalCode: string;
  country?: string;
  onRelaySelected: (relay: RelayPoint) => void;
  selectedRelay?: RelayPoint | null;
  deliveryMode: '24R' | '24L';
}

const formatOpeningHours = (hours?: string): string => {
  if (!hours) return 'Fermé';
  return hours.replace(/(\d{2})(\d{2})-(\d{2})(\d{2})/, '$1:$2 - $3:$4');
};

const getDaySchedule = (hours: any): string[] => {
  if (!hours) return [];
  const days = [
    { name: 'Lundi', value: hours.Monday },
    { name: 'Mardi', value: hours.Tuesday },
    { name: 'Mercredi', value: hours.Wednesday },
    { name: 'Jeudi', value: hours.Thursday },
    { name: 'Vendredi', value: hours.Friday },
    { name: 'Samedi', value: hours.Saturday },
    { name: 'Dimanche', value: hours.Sunday },
  ];
  return days.map(day => `${day.name}: ${formatOpeningHours(day.value)}`);
};

const normalizeCountryCode = (country: string): string => {
  if (!country) return 'FR';

  const normalized = country.toUpperCase().trim();

  if (normalized.length === 2) {
    return normalized;
  }

  const countryMap: Record<string, string> = {
    'FRANCE': 'FR',
    'BELGIQUE': 'BE',
    'BELGIUM': 'BE',
    'LUXEMBOURG': 'LU',
    'ESPAGNE': 'ES',
    'SPAIN': 'ES',
    'PAYS-BAS': 'NL',
    'NETHERLANDS': 'NL',
    'ALLEMAGNE': 'DE',
    'GERMANY': 'DE',
    'ITALIE': 'IT',
    'ITALY': 'IT',
    'PORTUGAL': 'PT',
    'SUISSE': 'CH',
    'SWITZERLAND': 'CH',
  };

  return countryMap[normalized] || 'FR';
};

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function MondialRelaySelector({
  postalCode: initialPostalCode,
  country = 'FR',
  onRelaySelected,
  selectedRelay,
  deliveryMode,
}: MondialRelaySelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [searchPostalCode, setSearchPostalCode] = useState(initialPostalCode);
  const [expandedRelay, setExpandedRelay] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const normalizedCountry = normalizeCountryCode(country);

  const initializeMap = (points: RelayPoint[]) => {
    if (!mapRef.current || !window.google || !window.google.maps || points.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    const centerLat = points.reduce((sum, p) => sum + parseFloat(String(p.Latitude)), 0) / points.length;
    const centerLng = points.reduce((sum, p) => sum + parseFloat(String(p.Longitude)), 0) / points.length;

    if (!googleMapRef.current) {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        mapId: 'mondial-relay-map', // Required for AdvancedMarkerElement
      });
    }

    markersRef.current.forEach(marker => {
      if (marker.map) {
        marker.map = null;
      }
    });
    markersRef.current = [];

    points.forEach((point) => {
      const lat = parseFloat(String(point.Latitude));
      const lng = parseFloat(String(point.Longitude));

      if (isNaN(lat) || isNaN(lng)) return;

      const position = { lat, lng };
      bounds.extend(position);

      // Use AdvancedMarkerElement if available, fallback to legacy Marker
      let marker;
      if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
        // Create a custom pin element
        const pinElement = document.createElement('div');
        pinElement.innerHTML = `
          <div style="
            width: 30px;
            height: 30px;
            background: ${deliveryMode === '24R' ? '#dc2626' : '#2563eb'};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          ">
            <div style="
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(45deg);
              color: white;
              font-size: 16px;
              font-weight: bold;
            ">📍</div>
          </div>
        `;

        marker = new window.google.maps.marker.AdvancedMarkerElement({
          position,
          map: googleMapRef.current,
          title: point.Name,
          content: pinElement,
        });
      } else {
        // Fallback to legacy Marker
        marker = new window.google.maps.Marker({
          position,
          map: googleMapRef.current,
          title: point.Name,
          icon: {
            url: deliveryMode === '24R'
              ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
              : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          },
        });
      }

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600;">${point.Name}</h3>
            <p style="margin: 4px 0; font-size: 14px;">${point.Address1}</p>
            <p style="margin: 4px 0; font-size: 14px;">${point.PostCode} ${point.City}</p>
            ${point.Distance ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Distance: ${(point.Distance / 1000).toFixed(1)} km</p>` : ''}
          </div>
        `,
      });

      // AdvancedMarkerElement uses different event listener syntax
      if (marker.addListener) {
        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker);
        });
      } else if (marker.addEventListener) {
        marker.addEventListener('click', () => {
          infoWindow.open({ map: googleMapRef.current, anchor: marker });
        });
      }

      markersRef.current.push(marker);
    });

    if (points.length > 0) {
      googleMapRef.current.fitBounds(bounds);
    }
  };

  const searchRelayPoints = async (postcode: string, mode: '24R' | '24L' = deliveryMode) => {
    if (!postcode || postcode.length < 4) {
      setError('Veuillez saisir un code postal valide (minimum 4 caractères)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mondial-relay-api/pickup-points`;
      // Request more results for lockers since they are less common
      const numResults = mode === '24L' ? '30' : '20';
      const fullUrl = `${apiUrl}?postcode=${postcode}&country=${normalizedCountry}&deliveryMode=${mode}&numResults=${numResults}&radius=20000`;

      console.log('Fetching from URL:', fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const responseText = await response.text();
        console.error('API Error Response (text):', responseText);

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || 'Unknown error' };
        }

        console.error('API Error Response (parsed):', errorData);
        const errorMessage = errorData.error || errorData.details || 'Erreur lors de la recherche des points relais';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('API Success Response:', data);

      if (data.PickupPoints && Array.isArray(data.PickupPoints)) {
        setRelayPoints(data.PickupPoints);
        if (data.PickupPoints.length === 0) {
          const pointType = mode === '24R' ? 'points relais' : 'lockers';
          setError(`Aucun ${pointType} trouvé pour ce code postal. Essayez un code postal voisin.`);
        } else {
          setTimeout(() => initializeMap(data.PickupPoints), 100);
        }
      } else {
        const pointType = mode === '24R' ? 'points relais' : 'lockers';
        setError(`Aucun ${pointType} trouvé pour ce code postal.`);
        setRelayPoints([]);
      }
    } catch (err) {
      console.error('Error searching relay points:', err);
      const pointType = mode === '24R' ? 'points relais' : 'lockers';
      setError(`Erreur lors de la recherche des ${pointType}. Veuillez réessayer.`);
      setRelayPoints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const loadScript = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found. Map will not be displayed.');
        return;
      }

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      // Check if script is already in the document
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // If script exists, wait for it to load
        intervalId = setInterval(() => {
          if (window.google && window.google.maps) {
            setMapLoaded(true);
            if (intervalId) clearInterval(intervalId);
          }
        }, 100);
        return;
      }

      // Create global callback function
      (window as any).initGoogleMaps = () => {
        setMapLoaded(true);
        delete (window as any).initGoogleMaps;
      };

      // Create and add the script with callback
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => console.error('Failed to load Google Maps script');
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (initialPostalCode && initialPostalCode.length >= 4) {
      searchRelayPoints(initialPostalCode, deliveryMode);
    }
  }, [initialPostalCode, normalizedCountry, deliveryMode]);

  useEffect(() => {
    if (mapLoaded && relayPoints.length > 0) {
      initializeMap(relayPoints);
    }
  }, [mapLoaded, relayPoints, deliveryMode]);

  const handleSearch = () => {
    searchRelayPoints(searchPostalCode);
  };

  const handleSelectRelay = (relay: RelayPoint) => {
    const formattedRelay = {
      ...relay,
      Num: relay.Id,
      LgAdr1: relay.Name,
      LgAdr2: relay.Address1,
      CP: relay.PostCode,
      Ville: relay.City,
      Pays: relay.Country,
    };
    onRelaySelected(formattedRelay);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {deliveryMode === '24R' ? (
            <>
              <MapPin className="h-5 w-5 text-[#b8933d]" />
              Points Relais Mondial Relay
            </>
          ) : (
            <>
              <Package className="h-5 w-5 text-blue-600" />
              Lockers 24/7 Mondial Relay
            </>
          )}
        </CardTitle>
        <CardDescription>
          Recherchez et choisissez le point le plus proche de chez vous
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Code postal ou ville"
            value={searchPostalCode}
            onChange={(e) => setSearchPostalCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-[#b8933d] hover:bg-[#9a7a32]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {selectedRelay && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-1">
                <p className="font-semibold">Point relais sélectionné</p>
                <p className="text-sm">{selectedRelay.LgAdr1 || selectedRelay.Name}</p>
                <p className="text-sm">
                  {selectedRelay.CP || selectedRelay.PostCode} {selectedRelay.Ville || selectedRelay.City}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
            <span className="ml-3 text-gray-600">Recherche en cours...</span>
          </div>
        )}

        {relayPoints.length > 0 && mapLoaded && (
          <div className="border rounded-lg overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-[#b8933d]" />
                  <span className="text-sm font-medium">Mise à jour...</span>
                </div>
              </div>
            )}
            <div
              ref={mapRef}
              className="w-full h-[400px]"
              style={{ minHeight: '400px' }}
            />
          </div>
        )}

        {relayPoints.length > 0 && !mapLoaded && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <Alert>
            <AlertDescription>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Chargement de la carte...</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {relayPoints.length > 0 && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <Alert>
            <AlertDescription>
              Carte non disponible - Clé API Google Maps manquante
            </AlertDescription>
          </Alert>
        )}

        {!loading && relayPoints.length === 0 && searchPostalCode && (
          <Alert>
            <AlertDescription>
              Aucun {deliveryMode === '24R' ? 'point relais' : 'locker'} trouvé pour ce code postal.
              {deliveryMode === '24L' && (
                <span className="block mt-2 text-sm">
                  Note : Les lockers 24/7 ne sont pas disponibles partout. Essayez les Points Relais.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!loading && relayPoints.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-[#b8933d]">{relayPoints.length}</span> {deliveryMode === '24R' ? 'point(s) relais' : 'locker(s)'} trouvé(s)
              </p>
            </div>
            <ScrollArea className="h-[500px] w-full rounded-md border">
            <div className="space-y-3 p-4">
              {relayPoints.map((relay) => {
                const isSelected = selectedRelay?.Id === relay.Id || selectedRelay?.Num === relay.Id;
                const isExpanded = expandedRelay === relay.Id;

                return (
                  <Card
                    key={relay.Id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-[#b8933d] border-2 bg-amber-50' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-2">
                              {deliveryMode === '24R' ? (
                                <MapPin className="h-5 w-5 text-[#b8933d] mt-0.5 flex-shrink-0" />
                              ) : (
                                <Package className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-lg leading-tight">{relay.Name}</h3>
                                  <Badge variant={deliveryMode === '24R' ? 'default' : 'secondary'} className={deliveryMode === '24R' ? 'bg-[#b8933d]' : 'bg-blue-600'}>
                                    {deliveryMode === '24R' ? 'Point Relais' : 'Locker 24/7'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{relay.Address1}</p>
                                {relay.Address2 && (
                                  <p className="text-sm text-gray-600">{relay.Address2}</p>
                                )}
                                <p className="text-sm text-gray-600">
                                  {relay.PostCode} {relay.City}
                                </p>
                              </div>
                            </div>

                            {relay.Distance && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Navigation className="h-4 w-4" />
                                <span>{(relay.Distance / 1000).toFixed(1)} km</span>
                              </div>
                            )}

                            {relay.LocalizationHints && relay.LocalizationHints.length > 0 && (
                              <p className="text-sm text-gray-500 italic">
                                {relay.LocalizationHints.join(', ')}
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleSelectRelay(relay)}
                            className={
                              isSelected
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-[#b8933d] hover:bg-[#9a7a32]'
                            }
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Sélectionné
                              </>
                            ) : (
                              'Choisir'
                            )}
                          </Button>
                        </div>

                        {relay.OpeningHours && (
                          <div className="pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRelay(isExpanded ? null : relay.Id);
                              }}
                              className="text-sm text-gray-600 hover:text-[#b8933d] p-0 h-auto"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              {isExpanded ? 'Masquer les horaires' : 'Voir les horaires'}
                            </Button>

                            {isExpanded && (
                              <div className="mt-3 space-y-1 text-sm">
                                {getDaySchedule(relay.OpeningHours).map((schedule, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between py-1 border-b last:border-0"
                                  >
                                    <span className="font-medium text-gray-700">
                                      {schedule.split(':')[0]}:
                                    </span>
                                    <span className="text-gray-600">
                                      {schedule.split(':').slice(1).join(':')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
          </div>
        )}

        {!loading && relayPoints.length === 0 && !error && searchPostalCode && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Effectuez une recherche pour trouver des points relais</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
