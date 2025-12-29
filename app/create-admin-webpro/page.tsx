"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader as Loader2 } from 'lucide-react';

export default function CreateAdminWebProPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const createAdminAccount = async () => {
    setLoading(true);
    setResult('');

    try {
      const email = 'contact@webproformation.fr';
      const password = '^dN49DHS$ZAesv*sj8#Ay@4p';
      const firstName = 'Admin';
      const lastName = 'WebPro';

      const response = await fetch('/api/admin/create-admin-webpro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setResult(`Erreur: ${result.error}`);
        toast.error(result.error);
        setLoading(false);
        return;
      }

      setResult(`✅ ${result.message}\nEmail: ${email}\nID: ${result.user.id}\n\nVous pouvez maintenant vous connecter avec ces identifiants.`);
      toast.success(result.message);
    } catch (err: any) {
      setResult(`Exception: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Créer Compte Admin WebPro</CardTitle>
          <CardDescription>
            Crée le compte contact@webproformation.fr avec droits admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={createAdminAccount}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              'Créer le compte admin'
            )}
          </Button>

          {result && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
