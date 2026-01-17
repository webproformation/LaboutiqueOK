'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ClearCachePage() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentKey, setCurrentKey] = useState('');
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([]);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
      setCurrentKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + '...' || 'NOT SET');

      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      setLocalStorageKeys(keys);
    }
  }, []);

  const clearAllCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();

      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }

      setCleared(true);

      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);
    }
  };

  const reloadHard = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const expectedUrl = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
  const isCorrectUrl = currentUrl === expectedUrl;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Diagnostic & Nettoyage du Cache
          </CardTitle>
          <CardDescription>
            Cette page permet de diagnostiquer et résoudre les problèmes de cache
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {cleared && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Cache vidé avec succès ! Redirection en cours...
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3">Configuration Supabase Actuelle</h3>

              <div className="bg-slate-100 p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-600">URL Supabase:</span>
                  <div className="flex items-center gap-2 mt-1">
                    {isCorrectUrl ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <code className={`text-sm ${isCorrectUrl ? 'text-green-700' : 'text-red-700'}`}>
                      {currentUrl}
                    </code>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">URL Attendue:</span>
                  <div className="mt-1">
                    <code className="text-sm text-slate-700">{expectedUrl}</code>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">ANON Key (50 premiers chars):</span>
                  <div className="mt-1">
                    <code className="text-xs text-slate-700 break-all">{currentKey}</code>
                  </div>
                </div>
              </div>

              {!isCorrectUrl && (
                <Alert className="mt-3 bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>ERREUR DÉTECTÉE:</strong> L'URL Supabase ne correspond pas au projet qcqbtmv !
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">LocalStorage</h3>
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">
                  Clés trouvées: <strong>{localStorageKeys.length}</strong>
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {localStorageKeys.map(key => (
                    <div key={key} className="text-xs font-mono text-slate-700 bg-white px-2 py-1 rounded">
                      {key}
                    </div>
                  ))}
                  {localStorageKeys.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Aucune clé trouvée</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={clearAllCache}
              size="lg"
              className="flex-1"
              variant="destructive"
              disabled={cleared}
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Vider tout le cache et redémarrer
            </Button>

            <Button
              onClick={reloadHard}
              size="lg"
              variant="outline"
              disabled={cleared}
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Hard Reload
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Cliquez sur "Vider tout le cache et redémarrer"</li>
                <li>Vous serez redirigé vers le tableau de bord admin</li>
                <li>Testez à nouveau les pages qui posaient problème</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
