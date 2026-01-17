"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Search, Loader2, CheckCircle2, Clock, Navigation, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RelayPoint {
  Id: string;
  Name: string;
  Address1: string;
  PostCode: string;
  City: string;
  Country: string;
  Latitude: number;
  Longitude: number;
  Distance?: number;
  OpeningHours?: string;
}

interface MondialRelaySelectorProps {
  postalCode: string;
  country?: string;
  onRelaySelected: (relay: RelayPoint | null) => void;
  selectedRelay?: RelayPoint | null;
  deliveryMode: '24R' | '24L';
}

export function MondialRelaySelector({
  postalCode,
  country = 'FR',
  onRelaySelected,
  selectedRelay,
  deliveryMode,
}: MondialRelaySelectorProps) {
  const [searchPostalCode, setSearchPostalCode] = useState(postalCode);
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRelay, setExpandedRelay] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if ((window as any).google) {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (postalCode && postalCode !== searchPostalCode) {
      setSearchPostalCode(postalCode);
      handleSearch(postalCode);
    }
  }, [postalCode]);

  const initializeMap = (points: RelayPoint[]) => {
    if (!mapRef.current || !(window as any).google || points.length === 0) return;

    markersRef.current.forEach((marker: any) => marker.map = null);
    markersRef.current = [];

    const google = (window as any).google;
    const bounds = new google.maps.LatLngBounds();
    const centerLat = points.reduce((sum, p) => sum + p.Latitude, 0) / points.length;
    const centerLng = points.reduce((sum, p) => sum + p.Longitude, 0) / points.length;

    if (!googleMapRef.current) {
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 12,
        mapId: 'mondial-relay-map',
      });
    }

    points.forEach((point, index) => {
      const markerContent = document.createElement('div');
      markerContent.innerHTML = `
        <div style="
          background-color: ${deliveryMode === '24R' ? '#b8933d' : '#2563eb'};
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
        ">
          ${index + 1}
        </div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: point.Latitude, lng: point.Longitude },
        map: googleMapRef.current,
        title: point.Name,
        content: markerContent,
      });

      marker.addListener('click', () => {
        handleSelectRelay(point);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: point.Latitude, lng: point.Longitude });
    });

    if (googleMapRef.current) {
      googleMapRef.current.fitBounds(bounds);
    }
  };

  const handleSearch = async (searchCode?: string) => {
    const codeToSearch = searchCode || searchPostalCode;

    if (!codeToSearch || codeToSearch.length < 3) {
      setError('Veuillez entrer un code postal valide');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('mondial-relay-search', {
        body: {
          postalCode: codeToSearch,
          country,
          deliveryMode,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erreur lors de la recherche');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.relayPoints && data.relayPoints.length > 0) {
        setRelayPoints(data.relayPoints);
        if (mapLoaded) {
          setTimeout(() => initializeMap(data.relayPoints), 100);
        }
      } else {
        setError('Aucun point relais trouvé pour ce code postal');
        setRelayPoints([]);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setRelayPoints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRelay = (relay: RelayPoint) => {
    onRelaySelected(relay);
  };

  const getDaySchedule = (openingHours: string): string[] => {
    if (!openingHours) return [];

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const scheduleArray = openingHours.split('#').filter(s => s.trim());

    return days.map((day, index) => {
      const schedule = scheduleArray[index] || '';
      if (!schedule || schedule === '0000') {
        return `${day}: Fermé`;
      }

      const morning = schedule.substring(0, 4);
      const afternoon = schedule.substring(4);

      let timeStr = '';
      if (morning && morning !== '0000') {
        timeStr += `${morning.substring(0, 2)}:${morning.substring(2)} - `;
      }
      if (afternoon && afternoon !== '0000') {
        timeStr += `${afternoon.substring(0, 2)}:${afternoon.substring(2)}`;
      }

      return `${day}: ${timeStr || 'Fermé'}`;
    });
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
          {deliveryMode === '24R'
            ? 'Recherchez et choisissez le point relais le plus proche de chez vous'
            : 'Consignes automatiques accessibles 24h/24, 7j/7'}
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
            disabled={loading}
          />
          <Button
            onClick={() => handleSearch()}
            disabled={loading}
            className={deliveryMode === '24R' ? 'bg-[#b8933d] hover:bg-[#a07c2f]' : 'bg-blue-600 hover:bg-blue-700'}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedRelay && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <p className="font-semibold">Point relais sélectionné</p>
              <p className="text-sm">{selectedRelay.Name}</p>
              <p className="text-sm">{selectedRelay.Address1}</p>
              <p className="text-sm">{selectedRelay.PostCode} {selectedRelay.City}</p>
            </AlertDescription>
          </Alert>
        )}

        {relayPoints.length > 0 && mapLoaded && (
          <div className="border rounded-lg overflow-hidden">
            <div ref={mapRef} className="w-full h-[400px]" />
          </div>
        )}

        {!loading && relayPoints.length > 0 && (
          <ScrollArea className="h-[500px] w-full rounded-md border">
            <div className="space-y-3 p-4">
              {relayPoints.map((relay, index) => {
                const isSelected = selectedRelay?.Id === relay.Id;
                const isExpanded = expandedRelay === relay.Id;

                return (
                  <Card
                    key={relay.Id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-2 bg-amber-50' : ''
                    } ${deliveryMode === '24R' ? 'border-[#b8933d]' : 'border-blue-600'}`}
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
                                  <Badge className="text-xs bg-gray-700 text-white">
                                    #{index + 1}
                                  </Badge>
                                  <h3 className="font-semibold text-base">{relay.Name}</h3>
                                  <Badge
                                    variant={deliveryMode === '24R' ? 'default' : 'secondary'}
                                    className={deliveryMode === '24R' ? 'bg-[#b8933d]' : 'bg-blue-600'}
                                  >
                                    {deliveryMode === '24R' ? 'Point Relais' : 'Locker 24/7'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{relay.Address1}</p>
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
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleSelectRelay(relay)}
                            className={
                              isSelected
                                ? 'bg-green-600 hover:bg-green-700'
                                : deliveryMode === '24R'
                                ? 'bg-[#b8933d] hover:bg-[#a07c2f]'
                                : 'bg-blue-600 hover:bg-blue-700'
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

                        {relay.OpeningHours && deliveryMode === '24R' && (
                          <div className="pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRelay(isExpanded ? null : relay.Id);
                              }}
                              className="text-sm text-gray-600 hover:text-gray-900"
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
        )}

        {!loading && relayPoints.length === 0 && searchPostalCode && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Aucun point relais trouvé</p>
            <p className="text-sm">Essayez un autre code postal</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
