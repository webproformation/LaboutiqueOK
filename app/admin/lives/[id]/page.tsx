'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Video, MessageSquare, ShoppingBag, BarChart3, Settings, Copy, Trash2, Pin, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: string;
  scheduled_start: string;
  stream_key: string;
  thumbnail_url: string;
  chat_enabled: boolean;
  products_enabled: boolean;
  is_recorded: boolean;
  current_viewers: number;
  total_views: number;
  max_viewers: number;
  likes_count: number;
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface SharedProduct {
  id: string;
  product_id: string;
  is_featured: boolean;
  special_offer: string;
  clicks: number;
  shared_at: string;
  products: {
    name: string;
    price: number;
    image_url: string | null;
  };
}

export default function LiveManagementPage() {
  const params = useParams();
  const router = useRouter();
  const liveId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [live, setLive] = useState<LiveStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sharedProducts, setSharedProducts] = useState<SharedProduct[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  useEffect(() => {
    loadLive();
    loadChatMessages();
    loadSharedProducts();

    const chatSubscription = supabase
      .channel(`live_chat_${liveId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_chat_messages',
        filter: `live_stream_id=eq.${liveId}`
      }, () => {
        loadChatMessages();
      })
      .subscribe();

    return () => {
      chatSubscription.unsubscribe();
    };
  }, [liveId]);

  async function loadLive() {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('id', liveId)
        .single();

      if (error) throw error;
      setLive(data);
    } catch (error) {
      console.error('Error loading live:', error);
      toast.error('Erreur lors du chargement du live');
    } finally {
      setLoading(false);
    }
  }

  async function loadChatMessages() {
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*, profiles(first_name, last_name, email)')
        .eq('live_stream_id', liveId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setChatMessages(data || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  }

  async function loadSharedProducts() {
    try {
      const { data, error } = await supabase
        .from('live_shared_products')
        .select('*, products(name, price, image_url)')
        .eq('live_stream_id', liveId)
        .order('shared_at', { ascending: false });

      if (error) throw error;
      setSharedProducts(data || []);
    } catch (error) {
      console.error('Error loading shared products:', error);
      toast.error('Erreur lors du chargement des produits partagés');
    }
  }

  async function saveLive(e: React.FormEvent) {
    e.preventDefault();
    if (!live) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('live_streams')
        .update({
          title: live.title,
          description: live.description,
          scheduled_start: live.scheduled_start,
          thumbnail_url: live.thumbnail_url,
          chat_enabled: live.chat_enabled,
          products_enabled: live.products_enabled,
          is_recorded: live.is_recorded,
        })
        .eq('id', liveId);

      if (error) throw error;
      toast.success('Live mis à jour avec succès');
    } catch (error) {
      console.error('Error saving live:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function deleteMessage(messageId: string) {
    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message supprimé');
      loadChatMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function togglePinMessage(message: ChatMessage) {
    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .update({ is_pinned: !message.is_pinned })
        .eq('id', message.id);

      if (error) throw error;
      toast.success(message.is_pinned ? 'Message détaché' : 'Message épinglé');
      loadChatMessages();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Erreur');
    }
  }

  async function shareProduct(productId: string) {
    try {
      const { error } = await supabase
        .from('live_shared_products')
        .insert([{
          live_stream_id: liveId,
          product_id: productId,
          is_featured: false,
          clicks: 0
        }]);

      if (error) {
        console.error('Error sharing product:', error);
        console.error('Product ID type:', typeof productId, 'Value:', productId);
        throw error;
      }
      toast.success('Produit partagé avec les spectateurs');
      loadSharedProducts();
      setSearchProduct('');
      setAvailableProducts([]);
    } catch (error: any) {
      console.error('Error sharing product:', error);
      toast.error(`Erreur lors du partage: ${error.message || 'Erreur inconnue'}`);
    }
  }

  async function removeSharedProduct(shareId: string) {
    try {
      const { error } = await supabase
        .from('live_shared_products')
        .delete()
        .eq('id', shareId);

      if (error) throw error;
      toast.success('Produit retiré');
      loadSharedProducts();
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Erreur');
    }
  }

  async function searchProducts(query: string) {
    if (query.length < 2) {
      setAvailableProducts([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching products:', error);
        toast.error('Erreur lors de la recherche de produits');
        throw error;
      }
      setAvailableProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  }

  function copyStreamKey() {
    if (live?.stream_key) {
      navigator.clipboard.writeText(live.stream_key);
      toast.success('Clé de stream copiée');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!live) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Live non trouvé</p>
        <Link href="/admin/lives">
          <Button className="mt-4">Retour aux lives</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/lives">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{live.title}</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre live stream et interagissez avec vos spectateurs
          </p>
        </div>
        {live.status === 'live' && (
          <Badge className="bg-red-100 text-red-800 animate-pulse">
            🔴 EN DIRECT - {live.current_viewers} spectateurs
          </Badge>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat ({chatMessages.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Produits ({sharedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={saveLive}>
            <Card>
              <CardHeader>
                <CardTitle>Informations du live</CardTitle>
                <CardDescription>
                  Modifiez les paramètres de votre live stream
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-sm font-semibold text-blue-900 mb-2 block">
                    Clé de stream (pour OBS)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={live.stream_key}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button type="button" onClick={copyStreamKey} variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Utilisez cette clé dans OBS pour streamer
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={live.title}
                    onChange={(e) => setLive({ ...live, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={live.description || ''}
                    onChange={(e) => setLive({ ...live, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_start">Date et heure de début</Label>
                  <Input
                    id="scheduled_start"
                    type="datetime-local"
                    value={live.scheduled_start ? new Date(live.scheduled_start).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setLive({ ...live, scheduled_start: new Date(e.target.value).toISOString() })}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Chat activé</Label>
                      <p className="text-sm text-gray-500">Les spectateurs peuvent discuter</p>
                    </div>
                    <Switch
                      checked={live.chat_enabled}
                      onCheckedChange={(checked) => setLive({ ...live, chat_enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Partage de produits</Label>
                      <p className="text-sm text-gray-500">Afficher des produits pendant le live</p>
                    </div>
                    <Switch
                      checked={live.products_enabled}
                      onCheckedChange={(checked) => setLive({ ...live, products_enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enregistrement</Label>
                      <p className="text-sm text-gray-500">Sauvegarder pour le replay</p>
                    </div>
                    <Switch
                      checked={live.is_recorded}
                      onCheckedChange={(checked) => setLive({ ...live, is_recorded: checked })}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#D4AF37] hover:bg-[#C6A15B]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Chat en direct</CardTitle>
              <CardDescription>
                Messages des spectateurs - {chatMessages.length} messages
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">
                    Aucun message pour le moment
                  </p>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border ${
                        msg.is_pinned ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {msg.profiles.first_name} {msg.profiles.last_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(msg.created_at), 'HH:mm:ss', { locale: fr })}
                            </span>
                            {msg.is_pinned && (
                              <Badge variant="outline" className="text-xs">
                                <Pin className="h-3 w-3 mr-1" />
                                Épinglé
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700">{msg.message}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePinMessage(msg)}
                          >
                            <Pin className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMessage(msg.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Partager un produit</CardTitle>
                <CardDescription>
                  Recherchez et partagez des produits avec vos spectateurs
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rechercher un produit</Label>
                  <Input
                    placeholder="Nom du produit..."
                    value={searchProduct}
                    onChange={(e) => {
                      setSearchProduct(e.target.value);
                      searchProducts(e.target.value);
                    }}
                  />
                </div>

                {availableProducts.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                    {availableProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.price}€</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => shareProduct(product.id)}
                          className="bg-[#D4AF37] hover:bg-[#C6A15B]"
                        >
                          Partager
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produits partagés ({sharedProducts.length})</CardTitle>
                <CardDescription>
                  Produits actuellement affichés aux spectateurs
                </CardDescription>
              </CardHeader>

              <CardContent>
                {sharedProducts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Aucun produit partagé
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sharedProducts.map((share) => (
                      <div key={share.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold">{share.products.name}</p>
                          <p className="text-sm text-gray-600">{share.products.price}€</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {share.clicks} clics
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeSharedProduct(share.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Vues totales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{live.total_views}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Spectateurs max</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{live.max_viewers}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Likes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{live.likes_count}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Messages chat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{chatMessages.length}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
