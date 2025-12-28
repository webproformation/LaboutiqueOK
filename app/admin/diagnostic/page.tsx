'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function DiagnosticPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const runDiagnostic = async () => {
    setTesting(true);
    const diagnosticResults: any = {
      envVariables: {},
      edgeFunctions: {},
    };

    diagnosticResults.envVariables = {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✓ Définie' : '✗ Manquante',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? '✓ Définie' : '✗ Manquante',
    };

    if (supabaseUrl && supabaseKey) {
      try {
        const debugUrl = `${supabaseUrl}/functions/v1/debug-env`;
        const debugResponse = await fetch(debugUrl, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        const debugData = await debugResponse.json();
        diagnosticResults.edgeFunctions.debug = {
          status: debugResponse.ok ? 'success' : 'error',
          statusCode: debugResponse.status,
          message: debugData.error || 'OK',
          data: debugData,
        };
      } catch (error: any) {
        diagnosticResults.edgeFunctions.debug = {
          status: 'error',
          message: error.message,
        };
      }

      // Test de la fonction test-secrets pour voir toutes les variables d'environnement
      try {
        const testSecretsUrl = `${supabaseUrl}/functions/v1/test-secrets`;
        const testSecretsResponse = await fetch(testSecretsUrl, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        const testSecretsData = await testSecretsResponse.json();
        diagnosticResults.edgeFunctions.testSecrets = {
          status: testSecretsResponse.ok ? 'success' : 'error',
          statusCode: testSecretsResponse.status,
          message: testSecretsData.error || 'OK',
          data: testSecretsData,
        };
      } catch (error: any) {
        diagnosticResults.edgeFunctions.testSecrets = {
          status: 'error',
          message: error.message,
        };
      }

      try {
        const productsUrl = `${supabaseUrl}/functions/v1/manage-woocommerce-products?action=list&page=1&per_page=1`;
        const productsResponse = await fetch(productsUrl, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        const productsData = await productsResponse.json();
        diagnosticResults.edgeFunctions.products = {
          status: productsResponse.ok ? 'success' : 'error',
          statusCode: productsResponse.status,
          message: productsData.error || 'OK',
          data: productsData,
        };
      } catch (error: any) {
        diagnosticResults.edgeFunctions.products = {
          status: 'error',
          message: error.message,
        };
      }

      try {
        const customersUrl = `${supabaseUrl}/functions/v1/manage-woocommerce-customers?action=list&page=1&per_page=1`;
        const customersResponse = await fetch(customersUrl, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        const customersData = await customersResponse.json();
        diagnosticResults.edgeFunctions.customers = {
          status: customersResponse.ok ? 'success' : 'error',
          statusCode: customersResponse.status,
          message: customersData.error || 'OK',
          data: customersData,
        };
      } catch (error: any) {
        diagnosticResults.edgeFunctions.customers = {
          status: 'error',
          message: error.message,
        };
      }
    }

    setResults(diagnosticResults);
    setTesting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diagnostic WooCommerce</h1>
        <p className="text-muted-foreground mt-2">
          Vérification de la configuration et des connexions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variables d'environnement (Frontend)</CardTitle>
          <CardDescription>
            Ces variables doivent être dans le fichier .env
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            {supabaseUrl ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
            {supabaseUrl && (
              <span className="text-xs text-muted-foreground ml-auto">
                {supabaseUrl}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {supabaseKey ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
            {supabaseKey && (
              <span className="text-xs text-muted-foreground ml-auto">
                {supabaseKey.substring(0, 20)}...
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {!supabaseUrl || !supabaseKey ? (
        <Alert>
          <AlertDescription>
            <strong>Action requise :</strong> Les variables d'environnement ne sont pas chargées.
            Assurez-vous que le fichier .env contient les variables et redémarrez le serveur de développement.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Button
            onClick={runDiagnostic}
            disabled={testing}
            size="lg"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              'Tester les Edge Functions'
            )}
          </Button>

          {results && (
            <div className="space-y-4">
              {results.edgeFunctions.testSecrets && (
                <Card>
                  <CardHeader>
                    <CardTitle>Toutes les variables d'environnement</CardTitle>
                    <CardDescription>
                      Liste complète des variables disponibles dans les Edge Functions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {results.edgeFunctions.testSecrets?.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-semibold">
                          Status: {results.edgeFunctions.testSecrets?.statusCode || 'Erreur'}
                        </span>
                      </div>
                      {results.edgeFunctions.testSecrets?.data?.totalEnvVars && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-semibold text-sm text-blue-900">
                            Total: {results.edgeFunctions.testSecrets.data.totalEnvVars} variables d'environnement trouvées
                          </p>
                        </div>
                      )}
                      {results.edgeFunctions.testSecrets?.data?.specificChecks && (
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                          <p className="font-semibold text-sm">Variables WooCommerce :</p>
                          {Object.entries(results.edgeFunctions.testSecrets.data.specificChecks).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm font-mono">
                              <span>{key}:</span>
                              <span className={typeof value === 'string' && value.includes('NOT_FOUND') ? 'text-red-600 font-bold' : 'text-green-600'}>
                                {value as string}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {results.edgeFunctions.testSecrets?.data?.envVars && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-muted-foreground">
                            Voir toutes les variables d'environnement
                          </summary>
                          <div className="mt-2 bg-muted p-4 rounded-lg space-y-1 max-h-96 overflow-auto">
                            {Object.entries(results.edgeFunctions.testSecrets.data.envVars).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-xs font-mono">
                                <span className="font-semibold">{key}:</span>
                                <span className="text-muted-foreground ml-4 truncate max-w-md">
                                  {value as string}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Diagnostic des secrets (Edge Functions)</CardTitle>
                  <CardDescription>
                    Test des variables d'environnement côté serveur
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {results.edgeFunctions.debug?.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-semibold">
                        Status: {results.edgeFunctions.debug?.statusCode || 'Erreur'}
                      </span>
                    </div>
                    {results.edgeFunctions.debug?.data?.envVars && (
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <p className="font-semibold text-sm">Variables d'environnement :</p>
                        {Object.entries(results.edgeFunctions.debug.data.envVars).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm font-mono">
                            <span>{key}:</span>
                            <span className={typeof value === 'string' && value.includes('NON DÉFINI') ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {value as string}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {results.edgeFunctions.debug?.data?.connectionTest && (
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <p className="font-semibold text-sm">Test de connexion WooCommerce :</p>
                        <div className="flex items-center gap-2">
                          {results.edgeFunctions.debug.data.connectionTest.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {results.edgeFunctions.debug.data.connectionTest.success ? 'Connexion réussie' : 'Connexion échouée'}
                          </span>
                        </div>
                        {results.edgeFunctions.debug.data.connectionTest.error && (
                          <p className="text-sm text-red-600 font-mono">
                            Erreur: {results.edgeFunctions.debug.data.connectionTest.error}
                          </p>
                        )}
                        {results.edgeFunctions.debug.data.connectionTest.errorBody && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-muted-foreground">
                              Voir la réponse du serveur
                            </summary>
                            <pre className="mt-2 bg-red-50 text-red-900 p-2 rounded text-xs overflow-auto">
                              {results.edgeFunctions.debug.data.connectionTest.errorBody}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                    {results.edgeFunctions.debug?.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                          Voir les détails complets
                        </summary>
                        <pre className="mt-2 bg-muted p-4 rounded-lg text-xs overflow-auto">
                          {JSON.stringify(results.edgeFunctions.debug.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Edge Function: Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {results.edgeFunctions.products?.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-semibold">
                        Status: {results.edgeFunctions.products?.statusCode || 'Erreur'}
                      </span>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-mono">
                        {results.edgeFunctions.products?.message}
                      </p>
                    </div>
                    {results.edgeFunctions.products?.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                          Voir les détails
                        </summary>
                        <pre className="mt-2 bg-muted p-4 rounded-lg text-xs overflow-auto">
                          {JSON.stringify(results.edgeFunctions.products.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Edge Function: Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {results.edgeFunctions.customers?.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-semibold">
                        Status: {results.edgeFunctions.customers?.statusCode || 'Erreur'}
                      </span>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-mono">
                        {results.edgeFunctions.customers?.message}
                      </p>
                    </div>
                    {results.edgeFunctions.customers?.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                          Voir les détails
                        </summary>
                        <pre className="mt-2 bg-muted p-4 rounded-lg text-xs overflow-auto">
                          {JSON.stringify(results.edgeFunctions.customers.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertDescription>
                  {results.edgeFunctions.products?.message?.includes('Configuration manquante') ||
                   results.edgeFunctions.customers?.message?.includes('Configuration manquante') ? (
                    <>
                      <strong>Configuration des secrets Supabase :</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Allez sur le dashboard Supabase</li>
                        <li>Project Settings → Edge Functions → Secrets</li>
                        <li>Ajoutez ces 3 variables :
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li><code>WORDPRESS_URL</code> = https://wp.laboutiquedemorgane.com</li>
                            <li><code>WC_CONSUMER_KEY</code> = Votre clé API WooCommerce</li>
                            <li><code>WC_CONSUMER_SECRET</code> = Votre secret API WooCommerce</li>
                          </ul>
                        </li>
                      </ol>
                    </>
                  ) : (
                    'Les tests sont terminés. Vérifiez les résultats ci-dessus.'
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </>
      )}
    </div>
  );
}
