'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Search,
  X
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

export default function LiveTestPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [viewerCount, setViewerCount] = useState(3);
  const [emotions, setEmotions] = useState({ hearts: 0, likes: 0, sparkles: 0 });
  const [goalProgress, setGoalProgress] = useState(0);
  const [autoChat, setAutoChat] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [emotionAnimations, setEmotionAnimations] = useState<EmotionAnimation[]>([]);

  // Vérification admin
  useEffect(() => {
    if (profile && !profile.is_admin) {
      toast.error('Accès réservé aux administrateurs');
      router.push('/');
    }
  }, [profile, router]);

  // Démarrer/arrêter le flux webcam
  async function toggleStream() {
    if (isStreaming && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } else {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: true
        });

        setStream(mediaStream);
        setIsStreaming(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        toast.success('Webcam activée !');
      } catch (error) {
        console.error('Erreur accès webcam:', error);
        toast.error('Impossible d\'accéder à la webcam');
      }
    }
  }

  // Recherche de produits
  async function searchProducts(query: string) {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, image_url, regular_price, sale_price')
        .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
        .eq('status', 'published')
        .limit(10);

      if (!error && data) {
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Simulation messages automatiques
  useEffect(() => {
    if (!autoChat) return;

    const interval = setInterval(() => {
      const randomUser = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
      const randomMessage = AUTO_MESSAGES[Math.floor(Math.random() * AUTO_MESSAGES.length)];

      addFakeMessage(randomUser, randomMessage);

      // Augmenter aléatoirement les émotions
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
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
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

  function addProductToLive(product: any) {
    const liveProduct: LiveProduct = {
      id: product.id,
      name: product.name,
      price: product.sale_price || product.regular_price,
      image_url: product.image_url || '/placeholder.png',
      added_at: new Date()
    };

    setProducts(prev => [liveProduct, ...prev]);
    setShowProductSelector(false);
    setSearchQuery('');
    setSearchResults([]);

    toast.success(`${product.name} ajouté au live !`);

    // Simuler des réactions
    setTimeout(() => {
      addFakeMessage(FAKE_USERS[0], `Oh j'adore ce modèle ! 😍`);
      setEmotions(prev => ({ ...prev, hearts: prev.hearts + 3 }));
      triggerEmotionAnimation('heart');
    }, 1000);
  }

  // Animation des émotions
  function triggerEmotionAnimation(type: 'heart' | 'like' | 'sparkle') {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const rect = videoElement.getBoundingClientRect();

    if (type === 'sparkle') {
      // Feux d'artifice multiples
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
      // Un gros pouce ou coeur
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

    // Choisir un utilisateur aléatoire
    const randomUser = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];

    // Message selon l'émotion
    const emotionMessages = {
      hearts: ['❤️', '💕', '💖', '😍'],
      likes: ['👍', '👏', '🔥', '💪'],
      sparkles: ['✨', '⭐', '🌟', '💫']
    };

    const randomEmoji = emotionMessages[type][Math.floor(Math.random() * emotionMessages[type].length)];
    addFakeMessage(randomUser, randomEmoji);

    // Animation visuelle
    const animationType = type === 'hearts' ? 'heart' : type === 'likes' ? 'like' : 'sparkle';
    triggerEmotionAnimation(animationType);
  }

  function simulateViewer() {
    setViewerCount(prev => prev + 1);
    setGoalProgress(prev => Math.min(prev + 2, 100));
    toast.success('Un nouveau viewer a rejoint !');
  }

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-t-4 border-t-[#d4af37]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-[#d4af37] flex items-center gap-2">
                  <Video className="h-6 w-6" />
                  Démo Live Streaming - Mode Test
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Page de test avec capture webcam et simulation d'utilisateurs
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

        {/* Contrôles Rapides */}
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

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne Gauche - Vidéo + Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vidéo avec animations */}
            <Card className="overflow-hidden">
              <div className="relative w-full aspect-video bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Animations d'émotions */}
                {emotionAnimations.map((anim) => (
                  <div
                    key={anim.id}
                    className="fixed pointer-events-none z-50"
                    style={{
                      left: anim.x,
                      top: anim.y,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {anim.type === 'heart' && (
                      <div className="animate-bounce-float text-8xl">
                        ❤️
                      </div>
                    )}
                    {anim.type === 'like' && (
                      <div className="animate-bounce-float text-8xl">
                        👍
                      </div>
                    )}
                    {anim.type === 'sparkle' && (
                      <div className="animate-firework text-6xl">
                        ✨
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && (
                  <>
                    <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
                      <Badge className="bg-red-600 text-white px-3 py-1.5 animate-pulse shadow-lg">
                        <span className="w-2 h-2 bg-white rounded-full mr-2" />
                        EN DIRECT
                      </Badge>
                      <Badge className="bg-black/70 text-white px-3 py-1.5 backdrop-blur-sm">
                        <Eye className="h-4 w-4 mr-2" />
                        {viewerCount} viewers
                      </Badge>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-white text-sm">
                          <span>Objectif viewers: {viewerCount}/100</span>
                          <span>{goalProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8933d] transition-all duration-500"
                            style={{ width: `${goalProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Cliquez sur "Démarrer le Live" pour activer la webcam</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats en temps réel */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <div className="text-3xl font-bold text-gray-900">{emotions.hearts}</div>
                  <div className="text-sm text-gray-500">Coeurs</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-3xl font-bold text-gray-900">{emotions.likes}</div>
                  <div className="text-sm text-gray-500">Likes</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <div className="text-3xl font-bold text-gray-900">{emotions.sparkles}</div>
                  <div className="text-sm text-gray-500">Sparkles</div>
                </CardContent>
              </Card>
            </div>

            {/* Produits du Live */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Produits Partagés ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun produit ajouté au live</p>
                    <p className="text-sm mt-1">Cliquez sur "Ajouter Produit" pour commencer</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full aspect-square object-cover rounded mb-2"
                        />
                        <h4 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h4>
                        <p className="text-lg font-bold text-[#d4af37]">{product.price}€</p>
                        <Badge variant="outline" className="text-xs mt-2">
                          Ajouté il y a {Math.floor((Date.now() - product.added_at.getTime()) / 1000)}s
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne Droite - Chat + Actions */}
          <div className="space-y-6">
            {/* Viewers Simulés */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Viewers Connectés ({viewerCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {FAKE_USERS.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
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
                </div>
              </CardContent>
            </Card>

            {/* Chat en Direct */}
            <Card className="flex flex-col h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Send className="h-5 w-5" />
                  Chat en Direct
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea ref={chatScrollRef} className="flex-1 px-4">
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
                </ScrollArea>

                <div className="border-t p-4 space-y-3">
                  {/* Boutons Émotions */}
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

                  {/* Input Message */}
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

        {/* Modal Recherche de Produits */}
        {showProductSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rechercher un produit</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setShowProductSelector(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
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
                        onClick={() => addProductToLive(product)}
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Styles pour les animations */}
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
