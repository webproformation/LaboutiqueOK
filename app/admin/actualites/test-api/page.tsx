'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TestApiPage() {
  const [postId, setPostId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testFetch = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const url = postId
        ? `/api/wordpress/posts?id=${postId}`
        : '/api/wordpress/posts';

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        setError(JSON.stringify(data, null, 2));
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href="/admin/actualites">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux actualités
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Test API WordPress Posts</h1>
        <p className="text-gray-600 mt-2">
          Testez la connexion à l'API WordPress
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres</CardTitle>
          <CardDescription>
            Laissez vide pour récupérer tous les posts, ou entrez un ID spécifique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="postId">ID du post (optionnel)</Label>
            <Input
              id="postId"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              placeholder="Ex: 123"
              type="number"
            />
          </div>

          <Button
            onClick={testFetch}
            disabled={loading}
            className="bg-[#b8933d] hover:bg-[#a07c2f]"
          >
            {loading ? 'Chargement...' : 'Tester'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-red-600 overflow-auto">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Résultat</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
