'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Video, ShoppingBag, MessageSquare, Send, Users, Play, StopCircle, Search, Plus, Trash2, ArrowLeft, Heart, Flame, Sparkles, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LiveConsolePage() {
  const params = useParams();
  const liveId = params.id as string;
  const [live, setLive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewersCount, setViewersCount] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Gestion Produits
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sharedProducts, setSharedProducts] = useState<any[]>([]);
  
  // Ambiance
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLiveDetails();
    loadMessages();
    loadSharedProducts();
    getUserProfile();

    // Abonnement Temps Réel
    const channel = supabase
      .channel('live_console')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `live_stream_id=eq.${liveId}` }, 
        (payload) => { loadMessages(); }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_viewers', filter: `live_stream_id=eq.${liveId}` },
        () => loadViewers()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [liveId]);

  // Scroll automatique vers le bas du chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(data);
    }
  }

  async function loadLiveDetails() {
    const { data } = await supabase.from('live_streams').select('*').eq('id', liveId).single();
    setLive(data);
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('live_chat_messages')
      .select('*, profiles(first_name, last_name)')
      .eq('live_stream_id', liveId)
      .order('created_at', { ascending: true }); // On veut les messages dans l'ordre chronologique
    if (data) setMessages(data);
  }

  async function loadViewers() {
    const { count } = await supabase.from('live_viewers').select('*', { count: 'exact', head: true }).eq('live_stream_id', liveId).eq('is_active', true);
    setViewersCount(count || 0);
  }

  async function loadSharedProducts() {
    const { data } = await supabase
      .from('live_shared_products')
      .select('*, products(*)')
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("Erreur: Vous devez être connecté.");
        return;
    }

    const { error } = await supabase.from('live_chat_messages').insert({
      live_stream_id: liveId,
      user_id: user.id,
      message: newMessage,
      is_pinned: true // Admin message = pinned/highlighted par défaut ?
    });

    if (error) {
        console.error(error);
        toast.error("Erreur lors de l'envoi");
    } else {
        setNewMessage('');
        loadMessages(); // Rechargement immédiat
    }
  }

  async function triggerEffect(type: 'heart' | 'fire' | 'confetti') {
    // Pour déclencher l'effet chez tout le monde, on insère une fausse émotion ou un événement
    // Ici on utilise la table 'live_emotions' en tant qu'admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('live_emotions').insert({
        live_stream_id: liveId,
        user_id: user.id,
        emotion_type: type
    });
    toast.success(`Effet ${type} envoyé !`);
  }

  // --- PRODUITS ---

  async function searchProducts(term: string) {
    setSearchTerm(term);
    if (term.length < 2) return;
    const { data } = await supabase.from('products').select('*').ilike('name', `%${term}%`).limit(5);
    if (data) setSearchResults(data);
  }

  async function shareProduct(product: any) {
    await supabase.from('live_shared_products').insert({
      live_stream_id: liveId,
      product_id: product.id,
      is_featured: true
    });
    toast.success(`${product.name} affiché aux clients !`);
    loadSharedProducts();
    setSearchResults([]);
    setSearchTerm('');
  }

  async function unshareProduct(sharedId: string) {
    await supabase.from('live_shared_products').delete().eq('id', sharedId);
    loadSharedProducts();
  }

  if (!live) return <div className="p-8 text-white">Chargement...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden font-sans">
      {/* HEADER */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900 shadow-md z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin/lives">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
                {live.title}
                {live.status === 'live' && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-mono font-bold text-[#D4AF37]">{viewersCount}</span> specs
          </div>
          <Button 
            onClick={toggleLiveStatus}
            variant={live.status === 'live' ? "destructive" : "default"}
            className={live.status === 'live' ? "bg-red-600 hover:bg-red-700 font-bold" : "bg-green-600 hover:bg-green-700 font-bold"}
          >
            {live.status === 'live' ? <><StopCircle className="mr-2 h-4 w-4" /> ARRÊTER LE LIVE</> : <><Play className="mr-2 h-4 w-4" /> LANCER LE DIRECT</>}
          </Button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        
        {/* COL GAUCHE : VISUEL & AMBIANCE (8/12) */}
        <div className="col-span-8 flex flex-col border-r border-gray-800 bg-black">
          
          {/* 1. RETOUR VIDÉO */}
          <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
             {live.playback_url ? (
               <iframe 
                 src={live.playback_url.replace('watch?v=', 'embed/').split('&')[0] + '?autoplay=1&mute=1&controls=0'} 
                 className="w-full h-full pointer-events-none opacity-80" 
                 title="Retour vidéo"
               />
             ) : (
               <div className="text-gray-600 flex flex-col items-center">
                 <Video className="w-16 h-16 mb-4 opacity-50" />
                 <p>En attente du flux vidéo...</p>
               </div>
             )}
          </div>

          {/* 2. BARRE D'AMBIANCE (ANIMATIONS) */}
          <div className="h-20 bg-gray-900 border-t border-gray-800 p-3 flex items-center gap-4 justify-center">
            <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Ambiance :</span>
            
            <Button onClick={() => triggerEffect('heart')} className="bg-pink-600 hover:bg-pink-700 rounded-full" title="Pluie de coeurs">
                <Heart className="w-5 h-5 mr-2 fill-white" /> Love
            </Button>
            
            <Button onClick={() => triggerEffect('fire')} className="bg-orange-600 hover:bg-orange-700 rounded-full" title="Ça chauffe !">
                <Flame className="w-5 h-5 mr-2 fill-white" /> On Fire
            </Button>

            <Button onClick={() => triggerEffect('confetti')} className="bg-[#D4AF37] hover:bg-[#b8933d] rounded-full text-black font-bold" title="Lancer des confettis">
                <PartyPopper className="w-5 h-5 mr-2" /> Célébrer
            </Button>
          </div>
        </div>

        {/* COL DROITE : CHAT & PRODUITS (4/12) */}
        <div className="col-span-4 bg-gray-900 flex flex-col border-l border-gray-800">
            
            {/* HAUT : PRODUITS */}
            <div className="h-1/2 flex flex-col border-b border-gray-800">
                <div className="p-3 bg-gray-800 border-b border-gray-700 font-bold flex justify-between items-center">
                    <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-[#D4AF37]" /> Produits</span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">{sharedProducts.length} affichés</span>
                </div>
                
                {/* Recherche */}
                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Rechercher (ex: Robe)..." 
                            className="pl-9 bg-gray-950 border-gray-700"
                            value={searchTerm}
                            onChange={(e) => searchProducts(e.target.value)}
                        />
                    </div>
                    {/* Résultats Recherche */}
                    {searchResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-[90%] bg-gray-800 border border-gray-600 rounded-md shadow-xl max-h-48 overflow-y-auto">
                            {searchResults.map(p => (
                                <div key={p.id} onClick={() => shareProduct(p)} className="p-2 hover:bg-gray-700 cursor-pointer flex items-center justify-between border-b border-gray-700 last:border-0">
                                    <span className="text-sm truncate">{p.name}</span>
                                    <Plus className="w-4 h-4 text-green-400" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Liste Produits Partagés */}
                <ScrollArea className="flex-1 bg-gray-900/50 p-2">
                    {sharedProducts.map((item) => (
                        <div key={item.id} className="flex items-center bg-gray-800 mb-2 p-2 rounded border-l-4 border-[#D4AF37] group">
                            <img src={item.products?.image_url} className="w-10 h-10 object-cover rounded bg-white mr-3" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{item.products?.name}</p>
                                <p className="text-xs text-gray-400">{item.products?.price}€</p>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-900/30" onClick={() => unshareProduct(item.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    {sharedProducts.length === 0 && <p className="text-center text-gray-600 text-xs mt-4">Aucun produit à l'écran</p>}
                </ScrollArea>
            </div>

            {/* BAS : CHAT */}
            <div className="h-1/2 flex flex-col bg-gray-900">
                <div className="p-3 bg-gray-800 border-b border-gray-700 font-bold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#D4AF37]" /> Chat en direct
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
                    {messages.map((msg) => {
                        const isMe = msg.user_id === userProfile?.id;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-2.5 text-sm ${isMe ? 'bg-[#D4AF37] text-black font-medium' : 'bg-gray-800 text-gray-200'}`}>
                                    {!isMe && <span className="text-xs text-gray-400 block mb-1 font-bold">{msg.profiles?.first_name || 'Anonyme'}</span>}
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={sendMessage} className="p-3 bg-gray-800 flex gap-2 border-t border-gray-700">
                    <Input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Répondre..." 
                        className="bg-gray-900 border-gray-600 focus-visible:ring-[#D4AF37]"
                    />
                    <Button type="submit" size="icon" className="bg-[#D4AF37] hover:bg-[#b8933d] text-black">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>

      </div>
    </div>
  );
}