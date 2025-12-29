"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        setResult(`Erreur: ${error.message}`);
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setResult('Erreur: Utilisateur non créé');
        toast.error('Utilisateur non créé');
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error: profileError } = await supabase.rpc(
        'create_user_profile_manually',
        {
          p_user_id: data.user.id,
          p_email: email,
          p_first_name: firstName,
          p_last_name: lastName,
          p_birth_date: null,
          p_wordpress_user_id: null,
        }
      );

      if (profileError) {
        console.error('Erreur création profil:', profileError);
        setResult(`Utilisateur créé mais erreur profil: ${profileError.message}`);
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: data.user.id,
          role: 'admin'
        });

      if (roleError) {
        console.error('Erreur rôle admin:', roleError);
        setResult(`Utilisateur créé mais erreur rôle: ${roleError.message}`);
      } else {
        setResult(`✅ Compte admin créé avec succès!\nEmail: ${email}\nID: ${data.user.id}`);
        toast.success('Compte admin créé avec succès!');
      }
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
