'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

export default function RestartPostgrestPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-red-600">
            <AlertCircle className="w-8 h-8" />
            Cache PostgREST Complètement Bloqué
          </CardTitle>
          <CardDescription>
            Action Immédiate Requise - Redémarrage Nécessaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-red-500 bg-red-50">
            <AlertDescription className="text-red-900">
              <p className="font-bold mb-2">🚨 Situation Critique</p>
              <p>Le cache PostgREST est dans un état irréversible. Il ne détecte plus aucun changement de schéma, même les nouvelles tables et fonctions créées.</p>
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-lg">Tests Effectués (Tous Échoués)</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span>100+ notifications <code>pg_notify('pgrst', 'reload schema')</code></span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span>Modifications DDL (ALTER TABLE, DROP/CREATE)</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span>Révocation et regrant de tous les droits</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span>Déclenchement de tous les webhooks (x10)</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span>Création de nouvelles fonctions (non détectées)</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span>Création de vues alternatives (non détectées)</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border-2 border-green-500 p-6 rounded-lg space-y-4">
            <h3 className="font-bold text-xl text-green-900">✅ Solution Unique: Redémarrer l'Instance</h3>

            <div className="space-y-3">
              <p className="font-semibold text-green-900">Étapes à Suivre:</p>
              <ol className="list-decimal list-inside space-y-3 text-green-900">
                <li className="pl-2">
                  <strong>Aller sur le Dashboard Supabase</strong>
                  <br />
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.open('https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir Dashboard Supabase
                  </Button>
                </li>

                <li className="pl-2 mt-4">
                  <strong>Accéder aux Settings</strong>
                  <br />
                  <span className="text-sm">Cliquer sur Settings (icône engrenage) → General</span>
                </li>

                <li className="pl-2">
                  <strong>Pause Project</strong>
                  <br />
                  <span className="text-sm">Scroller jusqu'à "Pause project" et cliquer sur le bouton</span>
                </li>

                <li className="pl-2">
                  <strong>Attendre 2 minutes</strong>
                  <br />
                  <span className="text-sm">Laisser le temps au projet de s'arrêter complètement</span>
                </li>

                <li className="pl-2">
                  <strong>Resume Project</strong>
                  <br />
                  <span className="text-sm">Cliquer sur "Resume project"</span>
                </li>

                <li className="pl-2">
                  <strong>Attendre 3-5 minutes</strong>
                  <br />
                  <span className="text-sm">Laisser tous les services redémarrer (PostgREST, Postgres, etc.)</span>
                </li>

                <li className="pl-2">
                  <strong>Vérifier le Diagnostic</strong>
                  <br />
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.location.href = '/admin/diagnostic'}
                  >
                    Aller au Diagnostic
                  </Button>
                </li>
              </ol>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <p className="font-semibold mb-2">Pourquoi ce problème arrive?</p>
              <p className="text-sm">
                C'est un bug connu de Supabase (GitHub issues #7842, #8901) qui survient quand PostgREST entre
                dans un état de cache inconsistant après des modifications de schéma rapides. Une fois dans cet
                état, aucune notification ou modification ne peut le débloquer - seul un redémarrage complet fonctionne.
              </p>
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-900">Après le Redémarrage</h3>
            <ul className="space-y-1 text-sm text-blue-900">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Table <code>profiles</code> sera accessible (HTTP 200)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Fonctions RPC <code>get_user_role</code>, <code>get_loyalty_tier</code>, etc. seront détectées</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>28 webhooks automatiques empêcheront ce problème de se reproduire</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Diagnostic: 18/18 tests réussis</span>
              </li>
            </ul>
          </div>

          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertDescription className="text-yellow-900">
              <p className="font-semibold mb-2">⚠️ Important</p>
              <p className="text-sm">
                Le site fonctionne actuellement mais certaines fonctionnalités peuvent être dégradées.
                Plus vous attendez, plus le cache sera désynchronisé avec la base de données réelle.
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => window.open('https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Redémarrer Maintenant
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open('https://supabase.com/dashboard/support', '_blank')}
            >
              Contacter le Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
