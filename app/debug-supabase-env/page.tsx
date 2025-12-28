"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function DebugSupabaseEnvPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const supabaseUrl = typeof window !== 'undefined'
    ? (window as any).NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey = typeof window !== 'undefined'
    ? (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const testConnection = async () => {
    setLoading(true);
    setTestResult("");

    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        setTestResult("❌ Variables d'environnement manquantes!");
        return;
      }

      const url = `${supabaseUrl}/rest/v1/home_slides?select=id&limit=1`;
      console.log("Testing URL:", url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        setTestResult(`❌ Status ${response.status}: ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log("Response data:", data);
      setTestResult(`✅ Connexion réussie! Données reçues: ${JSON.stringify(data, null, 2)}`);

    } catch (e: any) {
      console.error("Fetch error:", e);
      setTestResult(`❌ Erreur: ${e.message}\n\nStack: ${e.stack}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Current URL:", window.location.href);
    console.log("Origin:", window.location.origin);
    console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "SET" : "MISSING");
  }, []);

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Supabase - Production</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Origine de la requête</h3>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {typeof window !== 'undefined' ? window.location.origin : 'SSR'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">NEXT_PUBLIC_SUPABASE_URL</h3>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                {supabaseUrl || "❌ MANQUANT"}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">NEXT_PUBLIC_SUPABASE_ANON_KEY</h3>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                {supabaseAnonKey ? `${supabaseAnonKey.substring(0, 50)}...` : "❌ MANQUANT"}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Test de Connexion</h3>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={testConnection}
                disabled={loading}
              >
                {loading ? "Test en cours..." : "Tester la connexion Supabase"}
              </button>

              {testResult && (
                <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                  {testResult}
                </pre>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
