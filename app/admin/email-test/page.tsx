'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function EmailTestPage() {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    to: '',
    subject: 'Test email - La Boutique de Morgane',
    message: 'Ceci est un email de test envoyé depuis le panneau d\'administration.',
  });

  const verifyConnection = async () => {
    setIsVerifying(true);
    setVerificationStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous devez être connecté',
        });
        return;
      }

      const response = await fetch('/api/send-email', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setVerificationStatus({ success: true, message: result.message });
        toast({
          title: 'Connexion réussie',
          description: 'La connexion SMTP est opérationnelle',
        });
      } else {
        setVerificationStatus({ success: false, message: result.error || 'Erreur de connexion' });
        toast({
          variant: 'destructive',
          title: 'Erreur de connexion',
          description: result.error || 'La connexion SMTP a échoué',
        });
      }
    } catch (error) {
      console.error('Error verifying connection:', error);
      setVerificationStatus({ success: false, message: 'Erreur lors de la vérification' });
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de vérifier la connexion SMTP',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const sendTestEmail = async () => {
    if (!formData.to || !formData.subject || !formData.message) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
      });
      return;
    }

    setIsSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous devez être connecté',
        });
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${formData.subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333333; margin-bottom: 20px;">La Boutique de Morgane</h2>
            <div style="color: #666666;">
              ${formData.message.replace(/\n/g, '<br>')}
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eeeeee;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} La Boutique de Morgane - Email de test
            </p>
          </div>
        </body>
        </html>
      `;

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          html,
          text: formData.message,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Email envoyé',
          description: `L'email de test a été envoyé à ${formData.to}`,
        });
        setFormData({
          ...formData,
          message: 'Ceci est un email de test envoyé depuis le panneau d\'administration.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur d\'envoi',
          description: result.error || 'Impossible d\'envoyer l\'email',
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'envoi de l\'email',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test du système d'emails</h1>
        <p className="text-muted-foreground">
          Vérifiez la connexion SMTP et envoyez des emails de test
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Vérification de la connexion
            </CardTitle>
            <CardDescription>
              Testez la connexion au serveur SMTP o2switch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Serveur:</strong> {process.env.NEXT_PUBLIC_SMTP_HOST || 'laboutiquedemorgane.com'}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Port:</strong> 465 (SSL)
              </p>
            </div>

            {verificationStatus && (
              <div className={`flex items-start gap-2 p-3 rounded-md ${
                verificationStatus.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {verificationStatus.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    verificationStatus.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {verificationStatus.message}
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={verifyConnection}
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Vérifier la connexion'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Envoyer un email de test</CardTitle>
            <CardDescription>
              Envoyez un email de test pour valider le système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">Destinataire</Label>
              <Input
                id="to"
                type="email"
                placeholder="email@example.com"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                type="text"
                placeholder="Sujet de l'email"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Contenu de l'email"
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <Button
              onClick={sendTestEmail}
              disabled={isSending}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer l'email
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
