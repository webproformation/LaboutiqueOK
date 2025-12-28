"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function DebugAuthPage() {
  const { user, profile, loading } = useAuth();
  const [sessionCheck, setSessionCheck] = useState<any>(null);
  const [envCheck, setEnvCheck] = useState<any>({});

  useEffect(() => {
    const checkEnv = () => {
      setEnvCheck({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING',
        wordpressUrl: process.env.NEXT_PUBLIC_WORDPRESS_API_URL ? 'OK' : 'MISSING',
        paypalClientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'OK' : 'MISSING',
      });
    };

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        setSessionCheck({
          hasSession: !!data.session,
          hasUser: !!data.session?.user,
          error: error?.message || null,
          userId: data.session?.user?.id || null,
          email: data.session?.user?.email || null,
        });
      } catch (err: any) {
        setSessionCheck({
          hasSession: false,
          hasUser: false,
          error: err.message,
        });
      }
    };

    checkEnv();
    checkSession();
  }, []);

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Debug Authentication</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Variables d'environnement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(envCheck).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="font-mono text-sm">{key}</span>
                  <Badge variant={value === 'OK' ? 'default' : 'destructive'}>
                    {value as string}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              État du contexte Auth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Loading</span>
                <StatusIcon status={!loading} />
              </div>
              <div className="flex items-center justify-between">
                <span>User présent</span>
                <StatusIcon status={!!user} />
              </div>
              <div className="flex items-center justify-between">
                <span>Profile chargé</span>
                <StatusIcon status={!!profile} />
              </div>
              {user && (
                <>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600">User ID:</p>
                    <p className="font-mono text-xs break-all">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email:</p>
                    <p className="font-mono text-xs">{user.email}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Session Supabase directe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionCheck ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Session active</span>
                  <StatusIcon status={sessionCheck.hasSession} />
                </div>
                <div className="flex items-center justify-between">
                  <span>User dans session</span>
                  <StatusIcon status={sessionCheck.hasUser} />
                </div>
                {sessionCheck.error && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-red-600">Erreur:</p>
                    <p className="font-mono text-xs text-red-500">{sessionCheck.error}</p>
                  </div>
                )}
                {sessionCheck.userId && (
                  <>
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600">User ID:</p>
                      <p className="font-mono text-xs break-all">{sessionCheck.userId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email:</p>
                      <p className="font-mono text-xs">{sessionCheck.email}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Chargement...</p>
            )}
          </CardContent>
        </Card>

        {profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Profil utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
