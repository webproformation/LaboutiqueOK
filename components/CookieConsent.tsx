'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/AuthContext';
import { X, Cookie, Shield, BarChart3, Megaphone } from 'lucide-react';
import Link from 'next/link';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('cookie_session_id');
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random()}`;
        localStorage.setItem('cookie_session_id', sid);
      }
      return sid;
    }
    return '';
  });

  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    checkConsent();
  }, [user, sessionId]);

  const checkConsent = async () => {
    if (typeof window === 'undefined') return;

    const localConsent = localStorage.getItem('cookie_consent');
    if (localConsent) {
      const consent = JSON.parse(localConsent);
      setPreferences(consent);
      return;
    }

    let existingConsent = null;

    if (user) {
      const { data } = await supabase
        .from('cookie_consents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      existingConsent = data;
    } else if (sessionId) {
      const { data } = await supabase
        .from('cookie_consents')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      existingConsent = data;
    }

    if (existingConsent) {
      const prefs = {
        necessary: existingConsent.necessary,
        functional: existingConsent.functional,
        analytics: existingConsent.analytics,
        marketing: existingConsent.marketing,
      };
      setPreferences(prefs);
      localStorage.setItem('cookie_consent', JSON.stringify(prefs));
    } else {
      setShowBanner(true);
    }
  };

  const saveConsent = async (prefs: CookiePreferences) => {
    try {
      const consentData = {
        ...prefs,
        user_id: user?.id || null,
        session_id: !user ? sessionId : null,
      };

      await supabase.from('cookie_consents').insert(consentData);

      localStorage.setItem('cookie_consent', JSON.stringify(prefs));
      setPreferences(prefs);
      setShowBanner(false);
      setShowPreferences(false);
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  };

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  };

  const savePreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner && !showPreferences) return null;

  if (showPreferences) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="h-6 w-6 text-[#C6A15B]" />
                <CardTitle>Paramètres des cookies</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreferences(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Gérez vos préférences de cookies. Les cookies nécessaires sont toujours activés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <Label className="text-base font-semibold">Cookies nécessaires</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Requis pour le fonctionnement du site
                        </p>
                      </div>
                    </div>
                    <Switch checked={true} disabled />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Cookie className="h-5 w-5 text-[#C6A15B] mt-1" />
                      <div>
                        <Label htmlFor="functional" className="text-base font-semibold">
                          Cookies fonctionnels
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Améliorent l'expérience utilisateur
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="functional"
                      checked={preferences.functional}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, functional: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <Label htmlFor="analytics" className="text-base font-semibold">
                          Cookies analytiques
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Nous aident à améliorer le site
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="analytics"
                      checked={preferences.analytics}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, analytics: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Megaphone className="h-5 w-5 text-purple-600 mt-1" />
                      <div>
                        <Label htmlFor="marketing" className="text-base font-semibold">
                          Cookies marketing
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Personnalisent les publicités
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="marketing"
                      checked={preferences.marketing}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, marketing: checked })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      Cookies nécessaires
                    </h3>
                    <p className="text-gray-600">
                      Ces cookies sont indispensables au fonctionnement du site. Ils permettent
                      des fonctionnalités de base comme la navigation sur le site et l'accès
                      aux zones sécurisées. Sans ces cookies, le site ne peut pas fonctionner
                      correctement.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Cookie className="h-4 w-4 text-[#C6A15B]" />
                      Cookies fonctionnels
                    </h3>
                    <p className="text-gray-600">
                      Ces cookies permettent au site de se souvenir de vos choix (comme votre
                      langue ou votre région) et de fournir des fonctionnalités améliorées et
                      plus personnelles.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      Cookies analytiques
                    </h3>
                    <p className="text-gray-600">
                      Ces cookies nous permettent de compter les visites et les sources de
                      trafic afin de mesurer et d'améliorer les performances de notre site.
                      Ils nous aident à savoir quelles pages sont les plus et les moins
                      populaires.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-purple-600" />
                      Cookies marketing
                    </h3>
                    <p className="text-gray-600">
                      Ces cookies peuvent être placés par nos partenaires publicitaires. Ils
                      peuvent être utilisés pour créer un profil de vos intérêts et vous
                      montrer des publicités pertinentes sur d'autres sites.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                Pour plus d'informations, consultez notre{' '}
                <Link href="/politique-confidentialite" className="text-[#C6A15B] hover:underline font-semibold">
                  Politique de confidentialité
                </Link>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={acceptNecessary} variant="outline" className="flex-1">
              Nécessaires uniquement
            </Button>
            <Button onClick={savePreferences} className="flex-1 bg-[#C6A15B] hover:bg-[#B7933F]">
              Enregistrer les préférences
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-[#C6A15B] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-1">Ce site utilise des cookies</h3>
              <p className="text-sm text-gray-600">
                Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic
                et personnaliser le contenu. En cliquant sur "Tout accepter", vous consentez
                à l'utilisation de tous les cookies.{' '}
                <Link href="/politique-confidentialite" className="text-[#C6A15B] hover:underline">
                  En savoir plus
                </Link>
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button
              onClick={() => setShowPreferences(true)}
              variant="outline"
              className="whitespace-nowrap"
            >
              Personnaliser
            </Button>
            <Button
              onClick={acceptNecessary}
              variant="outline"
              className="whitespace-nowrap"
            >
              Nécessaires uniquement
            </Button>
            <Button
              onClick={acceptAll}
              className="bg-[#C6A15B] hover:bg-[#B7933F] whitespace-nowrap"
            >
              Tout accepter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
