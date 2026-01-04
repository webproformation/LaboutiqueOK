'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import dynamic from 'next/dynamic';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import {
  Eye,
  Heart,
  MessageCircle,
  ShoppingCart,
  Send,
  Users,
  User as UserIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface LivePlayerProps {
  streamId: string;
  autoplay?: boolean;
  showChat?: boolean;
  showProducts?: boolean;
}

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  status: string;
  playback_url?: string;
  current_viewers: number;
}

interface LiveProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_price: string;
  product_url: string;
  is_current: boolean;
}

interface ChatMessage {
  id: string;
  username: string;
  avatar_url?: string;
  message: string;
  created_at: string;
  is_pinned: boolean;
}

export default function LivePlayer({
  streamId,
  autoplay = true,
  showChat = true,
  showProducts = true,
}: LivePlayerProps) {
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const joinTimeRef = useRef<number>(Date.now());
  const messageCountRef = useRef<number>(0);
  const productClicksRef = useRef<number>(0);
  const { addToCart } = useCart();
  const supabase = createClient();

  useEffect(() => {
    initializeViewer();
    loadStream();
    loadProducts();
    if (showChat) loadMessages();

    const streamChannel = supabase
      .channel(`live_stream_${streamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams',
          filter: `id=eq.${streamId}`,
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
          filter: `live_stream_id=eq.${streamId}`,
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    if (showChat) {
      const chatChannel = supabase
        .channel(`live_chat_${streamId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'live_stream_chat_messages',
            filter: `live_stream_id=eq.${streamId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as ChatMessage]);
            scrollChatToBottom();
          }
        )
        .subscribe();

      return () => {
        streamChannel.unsubscribe();
        chatChannel.unsubscribe();
        handleViewerLeave();
      };
    }

    return () => {
      streamChannel.unsubscribe();
      handleViewerLeave();
    };
  }, [streamId]);

  const initializeViewer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);

    const response = await fetch('/api/live/viewers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ live_stream_id: streamId }),
    });

    const data = await response.json();
    setSessionId(data.session_id);

    let analyticsSessionId = sessionStorage.getItem('analytics_session_id');
    if (!analyticsSessionId) {
      analyticsSessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', analyticsSessionId);
    }

    try {
      const { data: analytics, error } = await supabase
        .from('live_stream_analytics')
        .insert({
          stream_id: streamId,
          user_id: user?.id || null,
          session_id: analyticsSessionId,
          joined_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!error && analytics) {
        setAnalyticsId(analytics.id);
        joinTimeRef.current = Date.now();
      }
    } catch (error) {
      console.error('Error creating analytics entry:', error);
    }
  };

  const handleViewerLeave = async () => {
    if (sessionId) {
      await fetch('/api/live/viewers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          live_stream_id: streamId,
        }),
      });
    }

    if (analyticsId) {
      const timeWatched = Math.floor((Date.now() - joinTimeRef.current) / 1000);
      try {
        await supabase
          .from('live_stream_analytics')
          .update({
            left_at: new Date().toISOString(),
            time_watched_seconds: timeWatched,
            messages_sent: messageCountRef.current,
            products_clicked: productClicksRef.current,
          })
          .eq('id', analyticsId);
      } catch (error) {
        console.error('Error updating analytics:', error);
      }
    }
  };

  const loadStream = async () => {
    const response = await fetch(`/api/live/streams/${streamId}`);
    const data = await response.json();
    setStream(data.stream);
  };

  const loadProducts = async () => {
    const response = await fetch(`/api/live/streams/${streamId}/products`);
    const data = await response.json();
    setProducts(data.products || []);
  };

  const loadMessages = async () => {
    const response = await fetch(`/api/live/chat?stream_id=${streamId}`);
    const data = await response.json();
    setMessages(data.messages || []);
    scrollChatToBottom();
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour envoyer un message');
      return;
    }

    const response = await fetch('/api/live/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        live_stream_id: streamId,
        message: newMessage,
      }),
    });

    if (response.ok) {
      setNewMessage('');
      messageCountRef.current++;
    } else {
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const scrollChatToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleAddToCart = async (product: LiveProduct) => {
    const productData = {
      id: product.product_id,
      name: product.product_name,
      price: product.product_price,
      slug: product.product_url.split('/').pop() || product.product_id,
      image: { src: product.product_image || '', sourceUrl: product.product_image || '' },
      quantity: 1,
    };

    addToCart(productData, 1);
    productClicksRef.current++;
    toast.success('Produit ajouté au panier');
  };

  const currentProduct = products.find((p) => p.is_current);

  if (!stream) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (stream.status !== 'live') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">{stream.title}</h2>
            <p className="text-gray-500 mb-4">
              Ce live n'est pas encore disponible
            </p>
            <Badge>
              {stream.status === 'scheduled' ? 'Programmé' : 'Terminé'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {stream.playback_url ? (
              <ReactPlayer
                url={stream.playback_url}
                playing={autoplay}
                controls
                width="100%"
                height="100%"
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload',
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="animate-pulse mb-4">
                    <div className="h-16 w-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <div className="h-12 w-12 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-xl font-semibold">LIVE EN DIRECT</p>
                  <p className="text-sm text-gray-300 mt-2">
                    En attente du flux vidéo...
                  </p>
                </div>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{stream.title}</CardTitle>
                  {stream.description && (
                    <p className="text-gray-500 mt-2">{stream.description}</p>
                  )}
                </div>
                <Badge variant="destructive" className="animate-pulse">
                  <div className="h-2 w-2 bg-white rounded-full mr-2"></div>
                  LIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  {stream.current_viewers} spectateurs
                </span>
              </div>
            </CardContent>
          </Card>

          {showProducts && currentProduct && (
            <Card className="border-2 border-red-500">
              <CardHeader>
                <CardTitle className="text-lg">Produit en vedette</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {currentProduct.product_image && (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={currentProduct.product_image}
                        alt={currentProduct.product_name}
                        fill
                        sizes="96px"
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      {currentProduct.product_name}
                    </h3>
                    <p className="text-lg font-bold text-red-600 mb-3">
                      {currentProduct.product_price}
                    </p>
                    <Button
                      onClick={() => handleAddToCart(currentProduct)}
                      className="w-full"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Ajouter au panier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {showChat && (
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Chat en direct
                  </span>
                  <Badge variant="secondary">
                    <Users className="mr-1 h-3 w-3" />
                    {stream.current_viewers}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.is_pinned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex gap-2">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={msg.avatar_url || ''} alt={msg.username} className="object-cover" />
                            <AvatarFallback className="bg-[#b8933d] text-white text-xs">
                              {msg.username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || <UserIcon className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-blue-600">
                              {msg.username}
                            </div>
                            <div className="text-sm break-words">{msg.message}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  {isAuthenticated ? (
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Envoyer un message..."
                      />
                      <Button onClick={sendMessage} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">
                      Connectez-vous pour participer au chat
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {showProducts && products.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Produits du live</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className={product.is_current ? 'border-2 border-red-500' : ''}
              >
                <CardContent className="p-3">
                  {product.product_image && (
                    <div className="relative aspect-square mb-2">
                      <Image
                        src={product.product_image}
                        alt={product.product_name}
                        fill
                        sizes="200px"
                        className="object-cover rounded"
                      />
                      {product.is_current && (
                        <Badge className="absolute top-2 right-2" variant="destructive">
                          EN DIRECT
                        </Badge>
                      )}
                    </div>
                  )}
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {product.product_name}
                  </h3>
                  <p className="text-sm font-bold text-red-600 mb-2">
                    {product.product_price}
                  </p>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    size="sm"
                    className="w-full"
                  >
                    <ShoppingCart className="mr-1 h-3 w-3" />
                    Ajouter
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
