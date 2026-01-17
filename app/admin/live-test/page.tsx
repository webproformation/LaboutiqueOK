'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { LiveProductOverlay } from '@/components/LiveProductOverlay';
import {
  Video,
  VideoOff,
  Send,
  Heart,
  ThumbsUp,
  Sparkles,
  ShoppingCart,
  Users,
  Play,
  Pause,
  Plus,
  Eye,
  EyeOff,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface FakeUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface ChatMessage {
  id: string;
  user: FakeUser;
  message: string;
  timestamp: Date;
}

interface LiveProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  added_at: Date;
}

interface LiveSharedProduct {
  id: string;
  live_stream_id: string;
  product_id: string;
  live_product_id?: string;
  product_name: string;
  product_image: string;
  original_price: number;
  promo_price: number;
  live_sku: string;
  is_published: boolean;
  published_at?: Date;
  expires_at?: Date;
}

interface EmotionAnimation {
  id: string;
  type: 'heart' | 'like' | 'sparkle';
  x: number;
  y: number;
}

const FAKE_USERS: FakeUser[] = [
  { id: '1', name: 'Sophie M.', avatar: '👩', color: '#FF6B9D' },
  { id: '2', name: 'Julie B.', avatar: '👩‍🦱', color: '#4A90E2' },
  { id: '3', name: 'Emma L.', avatar: '👱‍♀️', color: '#9B59B6' },
];

const AUTO_MESSAGES = [
  "Trop beau ce modèle ! 😍",
  "C'est dispo en quelle taille ?",
  "Le prix svp ?",
  "Zoom sur la matière ?",
  "J'adore cette couleur !",
  "Tu portes du combien ?",
  "Livraison rapide ?",
  "C'est doux au toucher ?",
  "Parfait pour l'été ça !",
  "Je le veux ! 💕",
];

const LIVE_REPLAY_CATEGORY_ID = '1768404743767-lfnpfit';

export default function LiveTestPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [liveStreamId, setLiveStreamId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [viewerCount, setViewerCount] = useState(3);
  const [emotions, setEmotions] = useState({ hearts: 0, likes: 0, sparkles: 0 });
  const [goalProgress, setGoalProgress] = useState(0);
  const [autoChat, setAutoChat] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [promoPrice, setPromoPrice] = useState<string>('');
  const [modalStep, setModalStep] = useState<1 | 2>(1);

  const [sharedProducts, setSharedProducts] = useState<LiveSharedProduct[]>([]);
  const [emotionAnimations, setEmotionAnimations] = useState<EmotionAnimation[]>([]);

  useEffect(() => {
    if (!loading && !profile?.is_admin) {
      router.push('/admin');
    }
  }, [profile, loading, router]);

  useEffect(() => {
    if (isStreaming && liveStreamId) {
      loadSharedProducts();
      const interval = setInterval(loadSharedProducts, 5000);
      return () => clearInterval(interval);
    }
  }, [isStreaming, liveStreamId]);

  async function loadSharedProducts() {
    if (!liveStreamId) return;

    try {
      const { data, error } = await supabase
        .from('live_shared_products')
        .select('*, product:products(name, image_url, sku, regular_price)')
        .eq('live_stream_id', liveStreamId)
        .order('shared_at', { ascending: false });

      if (!error && data) {
        const now = new Date();
        const activeProducts = data.filter(p => {
          if (!p.expires_at) return true;
          return new Date(p.expires_at) > now;
        });

        setSharedProducts(activeProducts.map(p => {
          const regularPrice = p.product?.regular_price || 0;
          return {
            id: p.id,
            live_stream_id: p.live_stream_id,
            product_id: p.product_id,
            live_product_id: p.live_product_id,
            product_name: p.product?.name || 'Produit',
            product_image: p.product?.image_url || '',
            original_price: p.original_price || regularPrice,
            promo_price: p.promo_price || regularPrice,
            live_sku: p.live_sku || (p.product?.sku ? `${p.product.sku}-live` : ''),
            is_published: p.is_published || false,
            published_at: p.published_at ? new Date(p.published_at) : undefined,
            expires_at: p.expires_at ? new Date(p.expires_at) : undefined,
          };
        }));
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  }

  async function toggleStream() {
    if (!isStreaming) {
      try {
        const liveId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const { data: newLive, error: liveError } = await supabase
          .from('live_streams')
          .insert({
            id: liveId,
            title: `Live Test ${new Date().toLocaleString('fr-FR')}`,
            status: 'live',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (liveError) {
          console.error('Erreur création live:', liveError);
          toast.error('Impossible de créer le live');
          return;
        }

        setLiveStreamId(liveId);

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        setStream(mediaStream);
        setIsStreaming(true);
        toast.success('Live démarré ! La webcam est active.');
      } catch (error) {
        toast.error('Impossible d\'accéder à la webcam');
        console.error(error);
      }
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (liveStreamId) {
        await supabase
          .from('live_streams')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString()
          })
          .eq('id', liveStreamId);
      }

      setStream(null);
      setIsStreaming(false);
      setLiveStreamId(null);
      toast.info('Live arrêté');
    }
  }

  async function searchProducts(query: string) {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, image_url, regular_price, sale_price, sku')
        .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
        .eq('status', 'publish')
        .limit(10);

      if (!error && data) {
        setSearchResults(data);
      } else if (error) {
        console.error('Erreur recherche:', error);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!autoChat) return;

    const interval = setInterval(() => {
      const randomUser = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
      const randomMessage = AUTO_MESSAGES[Math.floor(Math.random() * AUTO_MESSAGES.length)];

      addFakeMessage(randomUser, randomMessage);

      if (Math.random() > 0.5) {
        const emotionType = ['hearts', 'likes', 'sparkles'][Math.floor(Math.random() * 3)];
        setEmotions(prev => ({ ...prev, [emotionType]: prev[emotionType as keyof typeof prev] + 1 }));
      }
    }, 3000 + Math.random() * 4000);

    return () => clearInterval(interval);
  }, [autoChat]);

  function addFakeMessage(user: FakeUser, message: string) {
    const newMsg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      user,
      message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);

    setTimeout(() => {
      if (!isUserScrolling && chatScrollRef.current) {
        chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }

  function handleChatScroll() {
    if (!chatScrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    setIsUserScrolling(!isAtBottom);
  }

  function sendMessage() {
    if (!newMessage.trim()) return;

    const adminUser: FakeUser = {
      id: 'admin',
      name: 'Morgane (Vous)',
      avatar: '👑',
      color: '#D4AF37'
    };

    addFakeMessage(adminUser, newMessage);
    setNewMessage('');
  }

  function selectProductForConfig(product: any) {
    setSelectedProduct(product);
    const defaultPrice = product.sale_price || product.regular_price;
    setPromoPrice(defaultPrice.toString());
    setModalStep(2);
  }

  async function addProductToLive() {
    if (!liveStreamId) {
      toast.error('Aucun live actif. Démarrez d\'abord le live.');
      return;
    }

    if (!selectedProduct || !promoPrice) {
      toast.error('Veuillez renseigner le prix promo');
      return;
    }

    const priceValue = parseFloat(promoPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('Prix promo invalide');
      return;
    }

    try {
      const originalSku = selectedProduct.sku || `prod-${selectedProduct.id}`;
      const liveSku = `${originalSku}-live-${Date.now()}`;
      const originalPrice = selectedProduct.sale_price || selectedProduct.regular_price;

      const { data: liveProductData, error: insertError } = await supabase
        .from('products')
        .insert({
          name: `${selectedProduct.name} (LIVE)`,
          slug: `${selectedProduct.slug}-live-${Date.now()}`,
          description: selectedProduct.description,
          regular_price: originalPrice,
          sale_price: priceValue,
          sku: liveSku,
          status: 'publish',
          category_id: LIVE_REPLAY_CATEGORY_ID,
          image_url: selectedProduct.image_url,
          stock_quantity: selectedProduct.stock_quantity || 10
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erreur duplication produit:', insertError);
        toast.error('Erreur lors de la duplication du produit');
        return;
      }

      console.log('[Frontend] Calling API to add product to live...');

      const apiResponse = await fetch('/api/live/add-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          live_stream_id: liveStreamId,
          product_id: selectedProduct.id,
          live_product_id: liveProductData.id,
          special_offer: selectedProduct.name,
          promo_price: priceValue,
          original_price: originalPrice,
          live_sku: liveSku,
          product_name: selectedProduct.name,
          product_image: selectedProduct.image_url
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('Erreur API ajout produit partagé:', errorData);
        toast.error('Erreur lors de l\'ajout du produit');
        return;
      }

      toast.success(`✅ ${selectedProduct.name} ajouté avec prix promo ${priceValue}€`);

      setShowProductSelector(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      setPromoPrice('');
      setModalStep(1);

      loadSharedProducts();

      setTimeout(() => {
        addFakeMessage(FAKE_USERS[0], `Wow, quel prix ! 😍`);
        setEmotions(prev => ({ ...prev, hearts: prev.hearts + 3 }));
        triggerEmotionAnimation('heart');
      }, 1000);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    }
  }

  async function publishProductToViewers(sharedProduct: LiveSharedProduct) {
    try {
      const { error } = await supabase
        .from('live_shared_products')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', sharedProduct.id);

      if (error) {
        console.error('Erreur publication:', error);
        toast.error('Erreur lors de la publication');
        return;
      }

      toast.success(`📢 ${sharedProduct.product_name} publié en live !`);

      loadSharedProducts();

      setTimeout(() => {
        addFakeMessage(FAKE_USERS[1], `Je le prends tout de suite ! 🛒`);
        addFakeMessage(FAKE_USERS[2], `Quelle promo incroyable ! 💝`);
        setEmotions(prev => ({ ...prev, sparkles: prev.sparkles + 5 }));
        triggerEmotionAnimation('sparkle');
      }, 500);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    }
  }

  async function toggleProductVisibility(sharedProduct: LiveSharedProduct) {
    try {
      const newVisibility = !sharedProduct.is_published;

      const { error } = await supabase
        .from('live_shared_products')
        .update({
          is_published: newVisibility
        })
        .eq('id', sharedProduct.id);

      if (error) {
        console.error('Erreur toggle visibilité:', error);
        toast.error('Erreur lors du changement de visibilité');
        return;
      }

      toast.success(newVisibility ? '👁️ Produit visible pour les spectateurs' : '🙈 Produit masqué aux spectateurs');

      loadSharedProducts();

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    }
  }

  function triggerEmotionAnimation(type: 'heart' | 'like' | 'sparkle') {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const rect = videoElement.getBoundingClientRect();

    if (type === 'sparkle') {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const animation: EmotionAnimation = {
            id: `${Date.now()}-${Math.random()}`,
            type: 'sparkle',
            x: rect.left + Math.random() * rect.width,
            y: rect.top + Math.random() * rect.height
          };
          setEmotionAnimations(prev => [...prev, animation]);

          setTimeout(() => {
            setEmotionAnimations(prev => prev.filter(a => a.id !== animation.id));
          }, 2000);
        }, i * 150);
      }
    } else {
      const animation: EmotionAnimation = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      setEmotionAnimations(prev => [...prev, animation]);

      setTimeout(() => {
        setEmotionAnimations(prev => prev.filter(a => a.id !== animation.id));
      }, 2000);
    }
  }

  function sendEmotion(type: 'hearts' | 'likes' | 'sparkles') {
    setEmotions(prev => ({ ...prev, [type]: prev[type] + 1 }));

    const randomUser = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];

    const emotionMessages = {
      hearts: ['❤️', '💕', '💖', '😍'],
      likes: ['👍', '👏', '🔥', '💪'],
      sparkles: ['✨', '⭐', '🌟', '💫']
    };

    const randomEmoji = emotionMessages[type][Math.floor(Math.random() * emotionMessages[type].length)];
    addFakeMessage(randomUser, randomEmoji);

    const animationType = type === 'hearts' ? 'heart' : type === 'likes' ? 'like' : 'sparkle';
    triggerEmotionAnimation(animationType);
  }

  function simulateViewer() {
    setViewerCount(prev => prev + 1);
    setGoalProgress(prev => Math.min(prev + 2, 100));
    toast.success('Un nouveau viewer a rejoint !');
  }

  function closeModal() {
    setShowProductSelector(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedProduct(null);
    setPromoPrice('');
    setModalStep(1);
  }

  function backToSearch() {
    setSelectedProduct(null);
    setPromoPrice('');
    setModalStep(1);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#d4af37] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return null;
  }

  const pendingProducts = sharedProducts.filter(p => !p.is_published);
  const publishedProducts = sharedProducts.filter(p => p.is_published);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-t-4 border-t-[#d4af37]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-[#d4af37] flex items-center gap-2">
                  <Video className="h-6 w-6" />
                  Démo Live Streaming - Mode Test
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Page de test avec capture webcam et gestion produits live
                </p>
              </div>
              <Badge variant={isStreaming ? "default" : "secondary"} className="text-lg px-4 py-2">
                {isStreaming ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                    EN DIRECT
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <VideoOff className="h-4 w-4" />
                    HORS LIGNE
                  </span>
                )}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={toggleStream}
                size="lg"
                className={isStreaming ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                {isStreaming ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Arrêter le Live
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Démarrer le Live
                  </>
                )}
              </Button>

              <Button
                onClick={() => setAutoChat(!autoChat)}
                variant={autoChat ? "default" : "outline"}
                size="lg"
              >
                {autoChat ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Stopper Chat Auto
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Activer Chat Auto
                  </>
                )}
              </Button>

              <Button onClick={simulateViewer} variant="outline" size="lg">
                <Users className="h-5 w-5 mr-2" />
                + Viewer
              </Button>

              <Button onClick={() => setShowProductSelector(true)} variant="outline" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Ajouter Produit
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="relative w-full aspect-video bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Webcam désactivée</p>
                      <p className="text-sm opacity-75 mt-2">Cliquez sur &quot;Démarrer le Live&quot;</p>
                    </div>
                  </div>
                )}

                {emotionAnimations.map((anim) => (
                  <div
                    key={anim.id}
                    className={anim.type === 'sparkle' ? 'animate-firework' : 'animate-bounce-float'}
                    style={{
                      position: 'fixed',
                      left: anim.x,
                      top: anim.y,
                      fontSize: anim.type === 'sparkle' ? '6rem' : '8rem',
                      pointerEvents: 'none',
                      zIndex: 9999
                    }}
                  >
                    {anim.type === 'heart' && '❤️'}
                    {anim.type === 'like' && '👍'}
                    {anim.type === 'sparkle' && '✨'}
                  </div>
                ))}

                {publishedProducts.length > 0 && publishedProducts[0] && (
                  <LiveProductOverlay
                    product={publishedProducts[0]}
                    showCloseButton={true}
                    position="bottom-right"
                  />
                )}

                <div className="absolute top-4 left-4 space-y-2">
                  <Badge className="bg-black/60 backdrop-blur text-white border-none">
                    <Eye className="h-4 w-4 mr-1" />
                    {viewerCount} spectateurs
                  </Badge>
                  <div className="flex gap-2">
                    <Badge className="bg-black/60 backdrop-blur text-white border-none">
                      ❤️ {emotions.hearts}
                    </Badge>
                    <Badge className="bg-black/60 backdrop-blur text-white border-none">
                      👍 {emotions.likes}
                    </Badge>
                    <Badge className="bg-black/60 backdrop-blur text-white border-none">
                      ✨ {emotions.sparkles}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produits Partagés ({sharedProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sharedProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun produit partagé</p>
                    <p className="text-sm mt-1">Ajoutez des produits au live</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingProducts.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-600 mb-3">
                          En attente de publication ({pendingProducts.length})
                        </h3>
                        <div className="space-y-2">
                          {pendingProducts.map((product) => (
                            <div
                              key={product.id}
                              className="border rounded-lg p-3 bg-yellow-50 border-yellow-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                                  {product.product_image && (
                                    <img
                                      src={product.product_image}
                                      alt={product.product_name}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm line-clamp-1">
                                    {product.product_name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 line-through">
                                      {product.original_price}€
                                    </span>
                                    <span className="text-lg font-bold text-[#d4af37]">
                                      {product.promo_price}€
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    SKU: {product.live_sku}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => publishProductToViewers(product)}
                                  size="sm"
                                  className="bg-[#d4af37] hover:bg-[#b8941f] flex-shrink-0"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Publier en live
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {publishedProducts.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-600 mb-3">
                          Publiés ({publishedProducts.length})
                        </h3>
                        <div className="space-y-2">
                          {publishedProducts.map((product) => (
                            <div
                              key={product.id}
                              className="border rounded-lg p-3 bg-green-50 border-green-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                                  {product.product_image && (
                                    <img
                                      src={product.product_image}
                                      alt={product.product_name}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm line-clamp-1">
                                    {product.product_name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 line-through">
                                      {product.original_price}€
                                    </span>
                                    <span className="text-lg font-bold text-green-600">
                                      {product.promo_price}€
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    SKU: {product.live_sku}
                                  </p>
                                  {product.expires_at && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Expire: {new Date(product.expires_at).toLocaleTimeString('fr-FR')}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Badge variant="outline" className="border-green-600 text-green-600">
                                    <Check className="h-3 w-3 mr-1" />
                                    Publié
                                  </Badge>
                                  <Button
                                    onClick={() => toggleProductVisibility(product)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-shrink-0"
                                    title={product.is_published ? "Masquer aux spectateurs" : "Afficher aux spectateurs"}
                                  >
                                    {product.is_published ? (
                                      <>
                                        <EyeOff className="h-4 w-4 mr-1" />
                                        Masquer
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-4 w-4 mr-1" />
                                        Afficher
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Viewers Connectés ({viewerCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 overflow-y-auto space-y-2">
                  {FAKE_USERS.slice(0, 3).map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <span className="text-2xl">{user.avatar}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">En ligne</div>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: user.color }}
                      />
                    </div>
                  ))}
                  {FAKE_USERS.slice(3).map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 opacity-75">
                      <span className="text-lg">{user.avatar}</span>
                      <div className="flex-1">
                        <div className="font-medium text-xs">{user.name}</div>
                      </div>
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: user.color }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Send className="h-5 w-5" />
                  Chat en Direct
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <div
                  ref={chatScrollRef}
                  onScroll={handleChatScroll}
                  className="flex-1 px-4 overflow-y-auto"
                  style={{ maxHeight: '400px' }}
                >
                  <div className="space-y-3 py-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p className="text-sm">Aucun message pour le moment</p>
                        <p className="text-xs mt-1">Les messages apparaîtront ici</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="flex gap-2">
                          <span className="text-xl flex-shrink-0">{msg.user.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span
                                className="font-semibold text-sm"
                                style={{ color: msg.user.color }}
                              >
                                {msg.user.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 break-words">{msg.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="border-t p-4 space-y-3">
                  <div className="flex gap-2 justify-around">
                    <Button
                      onClick={() => sendEmotion('hearts')}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Heart className="h-4 w-4 text-red-500" />
                    </Button>
                    <Button
                      onClick={() => sendEmotion('likes')}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      onClick={() => sendEmotion('sparkles')}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Envoyer un message..."
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {showProductSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {modalStep === 1 ? 'Rechercher un produit' : 'Configurer le prix promo'}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={closeModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {modalStep === 1 && (
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher par nom ou slug..."
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 overflow-auto">
                {modalStep === 1 ? (
                  <>
                    {isSearching ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin h-8 w-8 border-4 border-[#d4af37] border-t-transparent rounded-full mx-auto mb-2" />
                        <p>Recherche en cours...</p>
                      </div>
                    ) : searchQuery.length < 2 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Tapez au moins 2 caractères pour rechercher</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Aucun produit trouvé</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => selectProductForConfig(product)}
                            className="border rounded-lg p-3 cursor-pointer hover:border-[#d4af37] hover:shadow-md transition-all"
                          >
                            <img
                              src={product.image_url || '/placeholder.png'}
                              alt={product.name}
                              className="w-full aspect-square object-cover rounded mb-2"
                            />
                            <h4 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h4>
                            <p className="text-lg font-bold text-[#d4af37]">
                              {product.sale_price || product.regular_price}€
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-6">
                    {selectedProduct && (
                      <>
                        <div className="flex gap-4 p-4 border rounded-lg bg-gray-50">
                          <img
                            src={selectedProduct.image_url || '/placeholder.png'}
                            alt={selectedProduct.name}
                            className="w-24 h-24 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">
                              Prix actuel: {selectedProduct.sale_price || selectedProduct.regular_price}€
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              SKU: {selectedProduct.sku || `prod-${selectedProduct.id}`}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="promo-price" className="text-base font-semibold">
                            Prix promo pour le live
                          </Label>
                          <Input
                            id="promo-price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={promoPrice}
                            onChange={(e) => setPromoPrice(e.target.value)}
                            placeholder="Ex: 19.99"
                            className="text-lg"
                          />
                          <p className="text-sm text-gray-500">
                            Ce produit sera dupliqué dans la catégorie &quot;LIVE & REPLAY&quot; avec le SKU{' '}
                            <span className="font-mono text-[#d4af37]">
                              {selectedProduct.sku || `prod-${selectedProduct.id}`}-live
                            </span>
                          </p>
                          <p className="text-sm text-gray-500">
                            Il restera disponible au prix promo pendant <span className="font-semibold">2 heures</span> après le live.
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={backToSearch}
                            className="flex-1"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour
                          </Button>
                          <Button
                            onClick={addProductToLive}
                            className="flex-1 bg-[#d4af37] hover:bg-[#b8941f]"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Ajouter au live
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes bounce-float {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -100%) scale(1.2) rotate(10deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -200%) scale(0.8) rotate(-10deg);
            opacity: 0;
          }
        }

        @keyframes firework {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
        }

        .animate-bounce-float {
          animation: bounce-float 2s ease-out forwards;
        }

        .animate-firework {
          animation: firework 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
