'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Video, ShoppingBag, MessageSquare, Send, Users, Play, StopCircle, Search, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

interface ChatMessage {
  id: string;
  message: string;
  profiles: { first_name: string; last_name: string } | null;
  created_at: string;
}

export default function LiveConsolePage() {
  const params = useParams();
  const liveId = params.id as string;
  const [live, setLive] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewersCount, setViewersCount] = useState(0);
  
  // Gestion Produits
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [sharedProducts, setSharedProducts] = useState<any[]>([]);

  useEffect(() => {
    loadLiveDetails();
    loadMessages();
    loadSharedProducts();

    // 1. Abonnement au Chat & Viewers
    const channel = supabase
      .channel('live_console')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `live_stream_id=eq.${liveId}` }, 
        (payload) => {
           // On recharge pour avoir le profil utilisateur associé
           loadMessages();
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_viewers', filter: `live_stream_id=eq.${liveId}` },
        () => loadViewers()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [liveId]);

  // --- CHARGEMENT DES DONNÉES ---

  async function loadLiveDetails() {
    const { data } = await supabase.from('live_streams').select('*').eq('id', liveId).single();
    setLive(data);
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('live_chat_messages')
      .select('*, profiles(first_name, last_name)')
      .eq('live_stream_id', liveId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setMessages(data);
  }

  async function loadViewers() {
    const { count } = await supabase.from('live_viewers').select('*', { count: 'exact', head: true }).eq('live_stream_id', liveId).eq('is_active', true);
    setViewersCount(count || 0);
  }

  async function loadSharedProducts() {
    const { data } = await supabase
      .from('live_shared_products')
      .select('*, products(*)') // On récupère les infos du produit lié
      .eq('live_stream_id', liveId)
      .order('created_at', { ascending: false });
    if (data) setSharedProducts(data);
  }

  // --- ACTIONS ---

  async function toggleLiveStatus() {
    if (!live) return;
    const newStatus = live.status === 'live' ? 'completed' : 'live';
    
    await supabase.from('live_streams').update({ status: newStatus }).eq('id', liveId);
    setLive({ ...live, status: newStatus });
    toast.success(newStatus === 'live' ? 'Live lancé ! 🔴' : 'Live terminé.');
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Récupérer l'ID de l'admin connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('live_chat_messages').insert({
      live_stream_id: liveId,
      user_id: user.id,
      message: newMessage,
      is_pinned: true // Les messages admin sont épinglés ou mis en avant
    });
    setNewMessage('');
    loadMessages();
  }

  // --- GESTION DES PRODUITS (Le coeur du "Shopping") ---

  async function searchProducts(term: string) {
    setSearchTerm(term);
    if (term.length < 2) return;

    // Recherche dans la table 'products'
    const { data } = await supabase
      .from('products')
      .select('id, name, price, image_url')
      .ilike('name', `%${term}%`)
      .limit(5);
    
    if (data) setSearchResults(data);
  }

  async function shareProduct(product: Product) {
    // 1. Ajouter à la table des produits partagés
    await supabase.from('live_shared_products').insert({
      live_stream_id: liveId,
      product_id: product.id,
      is_featured: true
    });
    
    toast.success(`Produit ${product.name} envoyé à l'écran !`);
    loadSharedProducts();
    setSearchResults([]); // Vider la recherche
    setSearchTerm('');
  }

  async function unshareProduct(sharedId: string) {
    await supabase.from('live_shared_products').delete().eq('id', sharedId);
    loadSharedProducts();
  }

  if (!live) return <div className="p-8 text-white">Chargement de la console...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* HEADER ADMIN */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900">
        <div className="flex items-center gap-4">
          <Link href="/admin/lives">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg">{live.title}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full ${live.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
              {live.status === 'live' ? 'EN DIRECT' : 'HORS LIGNE'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-mono font-bold">{viewersCount}</span>
          </div>
          
          <Button 
            onClick={toggleLiveStatus}
            variant={live.status === 'live' ? "destructive" : "default"}
            className={live.status === 'live' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {live.status === 'live' ? <StopCircle className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {live.status === 'live' ? "Arrêter le Live" : "Lancer le Live"}
          </Button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        
        {/* GAUCHE : VIDÉO & CHAT (Col 1 à 8) */}
        <div className="col-span-8 flex flex-col border-r border-gray-800">
          {/* Zone Vidéo (Simulée ou Réelle) */}
          <div className="aspect-video bg-black relative flex items-center justify-center border-b border-gray-800">
             {/* Ici on met l'iframe YouTube pour que l'admin voit ce qui se passe */}
             {live.playback_url ? (
               <iframe 
                 src={live.playback_url.replace('watch?v=', 'embed/')} 
                 className="w-full h-full opacity-50 pointer-events-none" 
                 title="Retour vidéo"
               />
             ) : (
               <div className="text-gray-500 flex flex-col items-center">
                 <Video className="w-12 h-12 mb-2" />
                 <p>Pas de vidéo configurée</p>
               </div>
             )}
             <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded text-xs font-mono">
               VUE RETOUR
             </div>
          </div>

          {/* Zone Chat Admin */}
          <div className="flex-1 flex flex-col bg-gray-900 min-h-0">
            <div className="p-3 border-b border-gray-800 font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#D4AF37]" /> Chat en direct
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 && <p className="text-gray-500 italic text-sm">Aucun message pour l'instant...</p>}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.profiles?.first_name ? '' : 'justify-end'}`}>
                     <div className="bg-gray-800 p-2 rounded-lg max-w-[80%]">
                       <p className="text-xs text-[#D4AF37] font-bold mb-0.5">
                         {msg.profiles?.first_name || 'Admin'} {msg.profiles?.last_name?.charAt(0)}.
                       </p>
                       <p className="text-sm">{msg.message}</p>
                     </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <form onSubmit={sendMessage} className="p-3 border-t border-gray-800 flex gap-2">
              <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Répondre en tant que Morgane..."
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button type="submit" size="icon" className="bg-[#D4AF37] hover:bg-[#b8933d]">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* DROITE : GESTION PRODUITS (Col 9 à 12) */}
        <div className="col-span-4 bg-gray-900 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              Pousser un produit
            </h2>
            
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Chercher un produit..."
                value={searchTerm}
                onChange={(e) => searchProducts(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Résultats recherche */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-gray-800 rounded-md border border-gray-700 overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((product) => (
                  <div key={product.id} className="p-2 hover:bg-gray-700 flex items-center justify-between group cursor-pointer" onClick={() => shareProduct(product)}>
                    <div className="flex items-center gap-2">
                      {product.image_url && <img src={product.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span className="text-sm truncate max-w-[150px]">{product.name}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-400">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Produits à l'écran ({sharedProducts.length})</h3>
            <div className="space-y-3">
              {sharedProducts.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-3 border-l-4 border-[#D4AF37] flex gap-3 relative animate-in fade-in slide-in-from-right-4">
                  {item.products?.image_url && (
                    <img src={item.products.image_url} alt="" className="w-12 h-12 rounded object-cover bg-white" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.products?.name || 'Produit inconnu'}</p>
                    <p className="text-xs text-gray-400">{item.products?.price}€</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 absolute top-1 right-1 h-6 w-6"
                    onClick={() => unshareProduct(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {sharedProducts.length === 0 && (
                <div className="text-center text-gray-600 text-sm py-8 border-2 border-dashed border-gray-800 rounded-lg">
                  Aucun produit affiché.<br/>Cherchez ci-dessus pour ajouter.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}