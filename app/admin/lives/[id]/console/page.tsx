'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, ShoppingBag, MessageSquare, Send, Users, Play, StopCircle, Search, Plus, Trash2, ArrowLeft, Heart, Flame, Star, Eye, EyeOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LiveConsolePage() {
  const params = useParams();
  const liveId = params.id as string;
  const [live, setLive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewersCount, setViewersCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gestion Produits
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sharedProducts, setSharedProducts] = useState<any[]>([]);
  
  // Modale Prix & Config
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [promoPrice, setPromoPrice] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    loadLiveDetails();
    loadMessages();
    loadSharedProducts();

    const channel = supabase.channel('live_console_v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `live_stream_id=eq.${liveId}` }, 
        () => loadMessages()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_viewers', filter: `live_stream_id=eq.${liveId}` },
        () => loadViewers()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [liveId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function loadLiveDetails() {
    const { data } = await supabase.from('live_streams').select('*').eq('id', liveId).single();
    setLive(data);
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('live_chat_messages')
      .select('*, profiles(first_name, last_name)')
      .eq('live_stream_id', liveId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }

  async function loadViewers() {
    const { count } = await supabase.from('live_viewers').select('*', { count: 'exact', head: true }).eq('live_stream_id', liveId).eq('is_active', true);
    setViewersCount(count || 0);
  }

  async function loadSharedProducts() {
    // On récupère les produits partagés ET leurs infos catalogue
    const { data } = await supabase
      .from('live_shared_products')
      .select(`
        *,
        products (
          name, 
          image_url, 
          regular_price, 
          sale_price
        )
      `)
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
    toast.success(newStatus === 'live' ? '🔴 Live lancé !' : 'Live terminé.');
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // On utilise l'utilisateur connecté (Admin)
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('live_chat_messages').insert({
      live_stream_id: liveId,
      user_id: user?.id, // Peut être null si on a désactivé RLS, mais mieux vaut l'avoir
      message: newMessage,
      is_pinned: true 
    });
    setNewMessage('');
    loadMessages();
  }

  async function triggerEffect(type: 'heart' | 'fire' | 'star') {
    await supabase.from('live_emotions').insert({
        live_stream_id: liveId,
        emotion_type: type
    });
    toast.success(`Effet ${type} envoyé !`);
  }

  // --- GESTION PRODUITS AVANCEE ---

  async function searchProducts(term: string) {
    setSearchTerm(term);
    if (term.length < 2) return;
    
    const { data } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${term}%`)
      .limit(8);
      
    if (data) setSearchResults(data);
  }

  function openProductConfig(product: any) {
    setSelectedProduct(product);
    // On préremplit avec le prix de vente ou le prix régulier
    const currentPrice = product.sale_price || product.regular_price || 0;
    setPromoPrice(currentPrice.toString());
    setIsConfigOpen(true);
    setSearchResults([]); // On ferme la recherche
  }

  async function addProductToLive() {
    if (!selectedProduct) return;

    const originalPrice = selectedProduct.sale_price || selectedProduct.regular_price || 0;
    const finalPromoPrice = parseFloat(promoPrice) || originalPrice;

    // On insère dans la table de liaison avec le PRIX SPÉCIAL
    const { error } = await supabase.from('live_shared_products').insert({
      live_stream_id: liveId,
      product_id: selectedProduct.id,
      is_featured: true,
      is_published: true, // Visible directement (ou mettre false pour "Préparer")
      promo_price: finalPromoPrice,
      original_price: originalPrice
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    } else {
      toast.success(`${selectedProduct.name} ajouté à ${finalPromoPrice}€`);
      loadSharedProducts();
      setIsConfigOpen(false);
      setSelectedProduct(null);
      setSearchTerm('');
    }
  }

  async function toggleVisibility(item: any) {
    await supabase
      .from('live_shared_products')
      .update({ is_published: !item.is_published })
      .eq('id', item.id);
    loadSharedProducts();
  }

  async function removeProduct(id: string) {
    await supabase.from('live_shared_products').delete().eq('id', id);
    loadSharedProducts();
  }

  if (!live) return <div className="p-12 text-center text-white">Chargement...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900 z-20">
        <div className="flex items-center gap-4">
          <Link href="/admin/lives">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              {live.title}
              {live.status === 'live' && <span className="animate-pulse text-red-500 text-xs border border-red-500 px-2 rounded-full">EN DIRECT</span>}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-black/50 px-3 py-1 rounded text-sm text-[#D4AF37] font-mono">
             👥 {viewersCount}
           </div>
           <Button 
            onClick={toggleLiveStatus}
            className={live.status === 'live' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
           >
             {live.status === 'live' ? <><StopCircle className="mr-2 h-4 w-4"/> ARRÊTER</> : <><Play className="mr-2 h-4 w-4"/> LANCER</>}
           </Button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        
        {/* COL GAUCHE (8/12) : VIDEO & AMBIANCE */}
        <div className="col-span-8 bg-black flex flex-col border-r border-gray-800">
           {/* VIDEO */}
           <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
             {live.playback_url ? (
               <iframe 
                 src={live.playback_url.replace('watch?v=', 'embed/').split('&')[0] + '?autoplay=1&mute=1&controls=0'}
                 className="w-full h-full pointer-events-none opacity-90"
               />
             ) : (
               <div className="text-gray-600 flex flex-col items-center">
                 <Video className="w-16 h-16 mb-2 opacity-50"/>
                 <p>En attente du flux vidéo...</p>
               </div>
             )}
           </div>

           {/* BOUTONS AMBIANCE */}
           <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-4">
              <span className="text-gray-500 text-xs uppercase font-bold tracking-wider mr-2">Ambiance :</span>
              <Button onClick={() => triggerEffect('heart')} className="bg-pink-600 rounded-full hover:scale-110 transition"><Heart className="w-5 h-5"/></Button>
              <Button onClick={() => triggerEffect('fire')} className="bg-orange-600 rounded-full hover:scale-110 transition"><Flame className="w-5 h-5"/></Button>
              <Button onClick={() => triggerEffect('star')} className="bg-yellow-500 rounded-full hover:scale-110 transition"><Star className="w-5 h-5"/></Button>
           </div>
        </div>

        {/* COL DROITE (4/12) : TABS (PRODUITS / CHAT) */}
        <div className="col-span-4 bg-gray-900 flex flex-col">
          <Tabs defaultValue="products" className="flex-1 flex flex-col">
            <div className="px-4 pt-4 border-b border-gray-800">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="products">🛍️ Produits</TabsTrigger>
                <TabsTrigger value="chat">💬 Chat</TabsTrigger>
              </TabsList>
            </div>

            {/* TAB PRODUITS */}
            <TabsContent value="products" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
               {/* Recherche */}
               <div className="p-4 border-b border-gray-800 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-400">Ajouter un produit</h3>
                  <div className="relative">
                     <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                     <Input 
                        className="pl-9 bg-gray-950 border-gray-700" 
                        placeholder="Nom du produit..."
                        value={searchTerm}
                        onChange={(e) => searchProducts(e.target.value)}
                     />
                     {/* Resultats Dropdown */}
                     {searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-xl max-h-60 overflow-y-auto">
                           {searchResults.map(p => (
                             <div 
                               key={p.id} 
                               className="p-3 hover:bg-gray-700 cursor-pointer flex items-center gap-3 border-b border-gray-700/50"
                               onClick={() => openProductConfig(p)}
                             >
                                <img src={p.image_url} className="w-10 h-10 object-cover rounded bg-white" />
                                <div className="flex-1 min-w-0">
                                   <div className="font-bold text-sm truncate">{p.name}</div>
                                   <div className="text-xs text-gray-400">
                                     {p.sale_price || p.regular_price}€
                                   </div>
                                </div>
                                <Plus className="w-4 h-4 text-green-400"/>
                             </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>

               {/* Liste Produits Actifs */}
               <ScrollArea className="flex-1 p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">En ligne ({sharedProducts.length})</h3>
                  <div className="space-y-3">
                     {sharedProducts.map(item => (
                       <div key={item.id} className={`bg-gray-800 rounded-lg p-3 border-l-4 ${item.is_published ? 'border-green-500' : 'border-gray-600 opacity-75'}`}>
                          <div className="flex gap-3">
                             <img src={item.products?.image_url} className="w-12 h-12 rounded object-cover bg-white" />
                             <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm truncate">{item.products?.name}</div>
                                <div className="flex items-center gap-2">
                                   <span className="text-[#D4AF37] font-bold">{item.promo_price || 0}€</span>
                                   {item.original_price > item.promo_price && (
                                     <span className="text-xs text-gray-500 line-through">{item.original_price}€</span>
                                   )}
                                </div>
                             </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-2">
                             <Button size="sm" variant="ghost" onClick={() => toggleVisibility(item)} title={item.is_published ? "Masquer" : "Afficher"}>
                                {item.is_published ? <Eye className="w-4 h-4 text-green-400"/> : <EyeOff className="w-4 h-4 text-gray-400"/>}
                             </Button>
                             <Button size="sm" variant="ghost" onClick={() => removeProduct(item.id)} className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4"/>
                             </Button>
                          </div>
                       </div>
                     ))}
                     {sharedProducts.length === 0 && <div className="text-center text-gray-600 text-sm mt-10">Aucun produit affiché.</div>}
                  </div>
               </ScrollArea>
            </TabsContent>

            {/* TAB CHAT */}
            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
               <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
                  {messages.map(msg => (
                     <div key={msg.id} className="bg-gray-800 p-2 rounded-lg text-sm">
                        <span className="text-[#D4AF37] font-bold text-xs block mb-1">
                          {msg.profiles?.first_name || 'Anonyme'}
                        </span>
                        {msg.message}
                     </div>
                  ))}
               </div>
               <form onSubmit={sendMessage} className="p-3 border-t border-gray-800 flex gap-2">
                  <Input 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    className="bg-gray-900 border-gray-700" 
                    placeholder="Répondre..."
                  />
                  <Button type="submit" size="icon" className="bg-[#D4AF37] hover:bg-[#b8933d]">
                    <Send className="w-4 h-4 text-black"/>
                  </Button>
               </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* MODALE DE CONFIGURATION PRIX */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Configurer {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="flex justify-center">
                <img src={selectedProduct?.image_url} className="w-32 h-32 object-cover rounded-lg border border-gray-700" />
             </div>
             <div>
                <Label>Prix Spécial Live (€)</Label>
                <Input 
                  type="number" 
                  value={promoPrice} 
                  onChange={e => setPromoPrice(e.target.value)}
                  className="bg-gray-950 border-gray-700 text-lg font-bold text-[#D4AF37]"
                />
                <p className="text-xs text-gray-500 mt-1">
                   Prix catalogue : {selectedProduct?.sale_price || selectedProduct?.regular_price}€
                </p>
             </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Annuler</Button>
             <Button onClick={addProductToLive} className="bg-[#D4AF37] hover:bg-[#b8933d] text-black font-bold">
                <Check className="w-4 h-4 mr-2"/> Valider et Afficher
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}