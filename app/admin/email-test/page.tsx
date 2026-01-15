'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailTestPage() {
  const [email, setEmail] = useState('greg.demeulenaere@gmail.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendTestEmail = async () => {
    if (!email) {
      toast.error('Veuillez saisir une adresse e-mail');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/debug/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          details: `Message ID: ${data.messageId}\nRéponse: ${data.response}`,
        });
        toast.success('E-mail envoyé avec succès !');
      } else {
        const smtpInfo = data.smtp_config
          ? `\n\nConfiguration SMTP:\nServeur: ${data.smtp_config.host}\nPort: ${data.smtp_config.port}\nSecure: ${data.smtp_config.secure}\nUtilisateur: ${data.smtp_config.user}`
          : '';

        setResult({
          success: false,
          error: data.error || 'Erreur inconnue',
          code: data.code || '',
          details: data.details || '',
          smtpInfo,
          stack: data.stack || '',
        });
        toast.error('Erreur lors de l\'envoi de l\'e-mail');
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: 'Erreur réseau',
        details: error.message,
      });
      toast.error('Erreur réseau lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test SMTP - Envoi d'e-mail</h1>
        <p className="text-gray-600">
          Testez la configuration SMTP du serveur o2switch
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configuration SMTP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-semibold">Serveur:</span>{' '}
              <span className="text-gray-600">laboutiquedemorgane.com</span>
            </div>
            <div>
              <span className="font-semibold">Port:</span>{' '}
              <span className="text-gray-600">465 (SSL)</span>
            </div>
            <div>
              <span className="font-semibold">Utilisateur:</span>{' '}
              <span className="text-gray-600">email@laboutiquedemorgane.com</span>
            </div>
            <div>
              <span className="font-semibold">De:</span>{' '}
              <span className="text-gray-600">La Boutique de Morgane</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Envoyer un test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email destinataire</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              onClick={sendTestEmail}
              disabled={loading}
              className="w-full bg-[#d4af37] hover:bg-[#c6a15b] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer le test
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card className={`mt-6 ${result.success ? 'border-green-300' : 'border-red-300'}`}>
          <CardHeader>
            <CardTitle className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.success ? '✅ Succès' : '❌ Erreur'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-semibold mb-1">
                  {result.success ? 'Message' : 'Erreur'}:
                </p>
                <p className="text-sm bg-gray-50 p-3 rounded border">
                  {result.success ? result.message : result.error}
                </p>
              </div>

              {result.code && (
                <div>
                  <p className="font-semibold mb-1">Code d'erreur:</p>
                  <p className="text-xs bg-orange-50 p-2 rounded border border-orange-200 font-mono">
                    {result.code}
                  </p>
                </div>
              )}

              {result.details && (
                <div>
                  <p className="font-semibold mb-1">Détails:</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto whitespace-pre-wrap">
                    {result.details}
                  </pre>
                </div>
              )}

              {result.smtpInfo && (
                <div>
                  <p className="font-semibold mb-1">Configuration SMTP:</p>
                  <pre className="text-xs bg-blue-50 p-3 rounded border border-blue-200 overflow-auto whitespace-pre-wrap">
                    {result.smtpInfo}
                  </pre>
                </div>
              )}

              {result.stack && (
                <div>
                  <p className="font-semibold mb-1">Stack trace:</p>
                  <pre className="text-xs bg-red-50 p-3 rounded border overflow-auto text-red-900">
                    {result.stack}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
