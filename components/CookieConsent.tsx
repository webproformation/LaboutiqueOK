'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Settings, X } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const savedPreferences = localStorage.getItem('cookie-preferences');
    if (!savedPreferences) {
      setShowBanner(true);
    } else {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  };

  const acceptNecessary = () => {
    savePreferences(DEFAULT_PREFERENCES);
  };

  const openSettings = () => {
    setShowBanner(false);
    setShowSettings(true);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner && !showSettings) {
    return null;
  }

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-[#D4AF37] shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0 w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center">
                  <Cookie className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Gestion des Cookies
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Nous utilisons des cookies pour améliorer votre expérience sur notre site.
                    Certains cookies sont nécessaires au fonctionnement du site, tandis que d'autres
                    nous aident à analyser l'utilisation du site et à personnaliser votre expérience.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <Button
                  onClick={openSettings}
                  variant="outline"
                  className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </Button>
                <Button
                  onClick={acceptNecessary}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Nécessaires uniquement
                </Button>
                <Button
                  onClick={acceptAll}
                  className="bg-[#D4AF37] hover:bg-[#B4941F] text-white"
                >
                  Tout accepter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Cookie className="h-6 w-6 text-[#D4AF37]" />
              Paramètres des Cookies
            </DialogTitle>
            <DialogDescription>
              Gérez vos préférences de cookies. Les cookies nécessaires sont toujours actifs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <Label className="text-base font-semibold text-gray-900">
                    Cookies Nécessaires
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Ces cookies sont essentiels au fonctionnement du site. Ils permettent
                    la navigation, la sécurité et l'accès aux fonctionnalités de base.
                  </p>
                </div>
                <Switch checked={true} disabled className="ml-4" />
              </div>
            </div>

            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <Label className="text-base font-semibold text-gray-900">
                    Cookies de Préférences
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Ces cookies permettent de mémoriser vos choix (langue, devise, paramètres d'affichage)
                    pour améliorer votre expérience lors de vos prochaines visites.
                  </p>
                </div>
                <Switch
                  checked={preferences.preferences}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, preferences: checked })
                  }
                  className="ml-4"
                />
              </div>
            </div>

            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <Label className="text-base font-semibold text-gray-900">
                    Cookies Analytiques
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site
                    en collectant des informations de manière anonyme (pages visitées, temps passé, etc.).
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                  className="ml-4"
                />
              </div>
            </div>

            <div className="pb-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <Label className="text-base font-semibold text-gray-900">
                    Cookies Marketing
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Ces cookies sont utilisés pour suivre les visiteurs sur différents sites web
                    et afficher des publicités pertinentes et personnalisées.
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                  className="ml-4"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t">
            <Button
              onClick={() => setShowSettings(false)}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={acceptNecessary}
              variant="outline"
              className="flex-1 border-gray-300"
            >
              Nécessaires uniquement
            </Button>
            <Button
              onClick={saveCustomPreferences}
              className="flex-1 bg-[#D4AF37] hover:bg-[#B4941F] text-white"
            >
              Enregistrer mes choix
            </Button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            Pour plus d'informations, consultez notre{' '}
            <a
              href="/politique-confidentialite"
              className="text-[#D4AF37] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Politique de Confidentialité
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
