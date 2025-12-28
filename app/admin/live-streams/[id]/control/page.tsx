'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Play,
  Square,
  Eye,
  TrendingUp,
  Package,
  Search,
  Plus,
  Trash2,
  Star,
  ArrowLeft,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LiveStream {
  id: string;
  title: string;
  status: string;
  current_viewers: number;
  peak_viewers: number;
}

interface LiveProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_price: string;
  is_current: boolean;
}

interface WooProduct {
  id: string;
  name: string;
  price: string;
  images: Array<{ src: string }>;
}

export default function LiveControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [wooProducts, setWooProducts] = useState<WooProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadStream();
    loadProducts();

    const channel = supabase
      .channel(`live_control_${resolvedParams.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams',
          filter: `id=eq.${resolvedParams.id}`,
        },
        (payload) => {
          if (payload.new) {
            setStream(payload.new as LiveStream);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_stream_products',
          filter: `live_stream_id=eq.${resolvedParams.id}`,
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [resolvedParams.id]);

  const loadStream = async () => {
    try {
      const response = await fetch(`/api/live/streams/${resolvedParams.id}`);
      const data = await response.json();
      setStream(data.stream);
    } catch (error) {
      toast.error('Erreur lors du chargement du stream');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`/api/live/streams/${resolvedParams.id}/products`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des produits');
    }
  };

  const searchWooProducts = async () => {
    if (!searchTerm.trim()) return;

    try {
      const response = await fetch(`/api/woocommerce/products?search=${searchTerm}`);
      const data = await response.json();
      setWooProducts(data.products || []);
    } catch (error) {
      toast.error('Erreur lors de la recherche de produits');
    }
  };

  const addProduct = async (wooProduct: WooProduct) => {
    try {
      const response = await fetch(`/api/live/streams/${resolvedParams.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: wooProduct.id,
          product_name: wooProduct.name,
          product_price: wooProduct.price,
          product_image: wooProduct.images[0]?.src,
          product_url: `/product/${wooProduct.id}`,
          is_current: false,
        }),
      });

      if (response.ok) {
        toast.success('Produit ajouté au live');
        loadProducts();
        setIsSearchOpen(false);
        setSearchTerm('');
        setWooProducts([]);
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du produit');
    }
  };

  const setCurrentProduct = async (productId: string) => {
    try {
      await fetch(`/api/live/streams/${resolvedParams.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          is_current: true,
        }),
      });

      toast.success('Produit mis en avant');
      loadProducts();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const removeProduct = async (productDbId: string) => {
    if (!confirm('Retirer ce produit du live ?')) return;

    try {
      await supabase.from('live_stream_products').delete().eq('id', productDbId);
      toast.success('Produit retiré');
      loadProducts();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const startStream = async () => {
    try {
      const response = await fetch(`/api/live/streams/${resolvedParams.id}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Live démarré');
        loadStream();
      }
    } catch (error) {
      toast.error('Erreur lors du démarrage');
    }
  };

  const endStream = async () => {
    if (!confirm('Terminer le live ?')) return;

    try {
      const response = await fetch(`/api/live/streams/${resolvedParams.id}/end`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Live terminé');
        router.push('/admin/live-streams');
      }
    } catch (error) {
      toast.error('Erreur lors de la fin du live');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="container mx-auto p-6">
        <p>Stream introuvable</p>
      </div>
    );
  }

  const currentProduct = products.find((p) => p.is_current);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/live-streams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{stream.title}</h1>
            <p className="text-gray-500">Contrôle du live en direct</p>
          </div>
        </div>
        <div className="flex gap-2">
          {stream.status === 'scheduled' && (
            <Button onClick={startStream} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Démarrer le Live
            </Button>
          )}
          {stream.status === 'live' && (
            <Button onClick={endStream} size="lg" variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              Terminer le Live
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Spectateurs actuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stream.current_viewers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Pic de spectateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stream.peak_viewers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Produits ajoutés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Produit en vedette</CardTitle>
              {currentProduct && (
                <Badge variant="destructive">EN DIRECT</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentProduct ? (
              <div className="flex gap-4">
                {currentProduct.product_image && (
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <Image
                      src={currentProduct.product_image}
                      alt={currentProduct.product_name}
                      fill
                      sizes="128px"
                      className="object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {currentProduct.product_name}
                  </h3>
                  <p className="text-2xl font-bold text-red-600">
                    {currentProduct.product_price}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Aucun produit en vedette
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Produits du live</CardTitle>
              <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter un produit</DialogTitle>
                    <DialogDescription>
                      Recherchez un produit WooCommerce à ajouter au live
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchWooProducts()}
                        placeholder="Rechercher un produit..."
                      />
                      <Button onClick={searchWooProducts}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {wooProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-4 p-3 border rounded hover:bg-gray-50"
                          >
                            {product.images[0] && (
                              <div className="relative w-16 h-16 flex-shrink-0">
                                <Image
                                  src={product.images[0].src}
                                  alt={product.name}
                                  fill
                                  sizes="64px"
                                  className="object-cover rounded"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold">{product.name}</h4>
                              <p className="text-sm text-gray-600">{product.price}</p>
                            </div>
                            <Button onClick={() => addProduct(product)} size="sm">
                              Ajouter
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 p-3 border rounded ${
                      product.is_current ? 'border-red-500 bg-red-50' : ''
                    }`}
                  >
                    {product.product_image && (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={product.product_image}
                          alt={product.product_name}
                          fill
                          sizes="48px"
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{product.product_name}</h4>
                      <p className="text-sm text-gray-600">{product.product_price}</p>
                    </div>
                    <div className="flex gap-1">
                      {!product.is_current && (
                        <Button
                          onClick={() => setCurrentProduct(product.product_id)}
                          size="sm"
                          variant="outline"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => removeProduct(product.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
