'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowUp, Cookie } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    const savedPreferences = localStorage.getItem('cookie-preferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const openCookieSettings = () => {
    setShowCookieSettings(true);
  };

  const savePreferences = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
    setShowCookieSettings(false);
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    localStorage.setItem('cookie-preferences', JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setShowCookieSettings(false);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    localStorage.setItem('cookie-preferences', JSON.stringify(necessaryOnly));
    setPreferences(necessaryOnly);
    setShowCookieSettings(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <Button
          onClick={openCookieSettings}
          size="icon"
          className="h-14 w-14 rounded-full bg-[#D4AF37] hover:bg-[#B4941F] text-white shadow-lg transition-all duration-300 hover:scale-110"
          title="Paramètres des cookies"
        >
          <Cookie className="h-6 w-6" />
        </Button>

        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            size="icon"
            className="h-14 w-14 rounded-full bg-[#D4AF37] hover:bg-[#B4941F] text-white shadow-lg transition-all duration-300 hover:scale-110 animate-in fade-in slide-in-from-bottom-2"
            title="Retour en haut"
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
        )}
      </div>

      <Dialog open={showCookieSettings} onOpenChange={setShowCookieSettings}>
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
              onClick={() => setShowCookieSettings(false)}
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
              onClick={savePreferences}
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
