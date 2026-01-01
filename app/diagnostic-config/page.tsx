"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ConfigStatus {
  supabaseUrl: string;
  supabaseAnonKey: string;
  wordpressUrl: string;
  usingBypass: boolean;
}

export default function DiagnosticConfigPage() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Erreur de configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isQcqbtmv = config?.supabaseUrl?.includes('qcqbtmv');
  const isHondlef = config?.supabaseUrl?.includes('hondlef');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diagnostic Configuration Supabase</h1>
        <p className="text-gray-600 mt-1">
          Vérification des variables d'environnement et du projet actif
        </p>
      </div>

      <div className="grid gap-4">
        <Card className={isQcqbtmv ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isQcqbtmv ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              Projet Supabase Actif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">URL:</p>
              <p className="text-sm text-gray-600 font-mono break-all">{config?.supabaseUrl}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Projet:</p>
              <Badge variant={isQcqbtmv ? 'default' : 'secondary'}>
                {isQcqbtmv ? 'qcqbtmv (NOUVEAU)' : isHondlef ? 'hondlef (ANCIEN)' : 'INCONNU'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Utilise BYPASS variables:</p>
              <Badge variant={config?.usingBypass ? 'default' : 'secondary'}>
                {config?.usingBypass ? 'OUI' : 'NON'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {config?.supabaseAnonKey ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Clé ANON
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {config?.supabaseAnonKey ? 'Configurée' : 'MANQUANTE'}
            </p>
            {config?.supabaseAnonKey && (
              <p className="text-xs text-gray-500 font-mono mt-2 truncate">
                {config.supabaseAnonKey.substring(0, 40)}...
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {config?.wordpressUrl ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              WordPress URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-mono">{config?.wordpressUrl || 'Non configurée'}</p>
          </CardContent>
        </Card>
      </div>

      {!isQcqbtmv && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Action Requise
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-600">
            <p className="font-medium mb-2">Le projet qcqbtmv n'est pas utilisé!</p>
            <p className="text-sm">
              Vérifiez que les variables BYPASS_SUPABASE_URL et BYPASS_SUPABASE_ANON_KEY sont correctement définies dans le fichier .env
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
